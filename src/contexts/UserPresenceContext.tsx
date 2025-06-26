import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';

import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();


//
// You define a Context: a way to share state like “who’s online”
// Then you use .Provider to wrap part of your app and supply that state
// Components inside it use useContext(...) to consume the value
//
interface UserPresenceContextType {
  onlineUsers: Schema['UserPresence']['type'][];
  isLoading: boolean;
  error: string | null;
}

const UserPresenceContext = createContext<UserPresenceContextType>({
  onlineUsers: [],
  isLoading: true,
  error: null,
});

export const useUserPresence = () => {
  const context = useContext(UserPresenceContext);
  if (!context) {
    throw new Error('useUserPresence must be used within UserPresenceProvider');
  }
  return context;
};

//
// This is a React Function Component that accepts props of type
//
export const UserPresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  //
  // Need useState as this can let react know that something got changed.
  //  
  
  // 'type' is the keyword to extract the inferred TypeScript type representing a single UserPresence record.
  const { user } = useAuthenticator((context) => [context.user]);
  const [onlineUsers, setOnlineUsers] = useState<Schema['UserPresence']['type'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserPresenceId, setCurrentUserPresenceId] = useState<string | null>(null);

  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const INACTIVE_THRESHOLD = 120000; // 2 minutes

  // 'useEffect' means Fetch data when component mounts
  useEffect(() => {
    if (!user) return;

    let heartbeatInterval: NodeJS.Timeout;
    let subscription: any;

    const initializePresence = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize current user's presence
        await createOrUpdateUserPresence();

        // Load all online users
        await loadOnlineUsers();

        // Set up real-time subscription
        // "Give me the current list of users, then keep watching and notify me every time something changes."
        subscription = client.models.UserPresence.observeQuery().subscribe({
          next: ({ items }) => {
            const activeUsers = filterActiveUsers(items);
            setOnlineUsers(activeUsers);
          },
          error: (err) => {
            console.error('Subscription error:', err);
            setError('Failed to subscribe to presence updates');
          }
        });

        // Start heartbeat
        heartbeatInterval = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize presence:', err);
        setError('Failed to initialize user presence');
        setIsLoading(false);
      }
    };

    initializePresence();

    // Cleanup function
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
      handleUserLeaving();
    };
  }, [user]);

  // Handle page visibility and beforeunload events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized browser
        updatePresenceStatus(false);
      } else {
        // User came back
        updatePresenceStatus(true);
      }
    };

    const handleBeforeUnload = () => {
      handleUserLeaving();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUserPresenceId]);

  const createOrUpdateUserPresence = async () => {
    if (!user) return;

    try {
      const username = user.signInDetails?.loginId || user.username;
      const email = user.signInDetails?.loginId || user.attributes?.email;

      // Check if user already has a presence record
      const { data: existingPresences } = await client.models.UserPresence.list({
        filter: {
          email: {
            eq: email
          }
        }
      });

      let presenceId: string | null;

      if (existingPresences && existingPresences.length > 0) {
        // Update existing presence
        const existingPresence = existingPresences[0];
        presenceId = existingPresence.id;

        await client.models.UserPresence.update({
          id: presenceId,
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
      } else {
        // Create new presence
        const { data: newPresence } = await client.models.UserPresence.create({
          username,
          email,
          isOnline: true,
          lastSeen: new Date().toISOString()
        });

        if (newPresence) {
          presenceId = newPresence.id;
        } else {
          throw new Error('Failed to create presence record');
        }
      }

      setCurrentUserPresenceId(presenceId);
    } catch (err) {
      console.error('Error creating/updating user presence:', err);
      throw err;
    }
  };

  const updateHeartbeat = async () => {
    if (!currentUserPresenceId) return;

    try {
      await client.models.UserPresence.update({
        id: currentUserPresenceId,
        lastSeen: new Date().toISOString(),
        isOnline: true
      });
    } catch (err) {
      console.error('Error updating heartbeat:', err);
    }
  };

  const updatePresenceStatus = async (isOnline: boolean) => {
    if (!currentUserPresenceId) return;

    try {
      await client.models.UserPresence.update({
        id: currentUserPresenceId,
        isOnline,
        lastSeen: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating presence status:', err);
    }
  };

  const handleUserLeaving = async () => {
    if (!currentUserPresenceId) return;

    try {
      await client.models.UserPresence.delete({
        id: currentUserPresenceId
      });
    } catch (err) {
      console.error('Error removing user presence:', err);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const { data: users } = await client.models.UserPresence.list({
        filter: {
          isOnline: {
            eq: true
          }
        }
      });

      if (users) {
        const activeUsers = filterActiveUsers(users);
        setOnlineUsers(activeUsers);
      }
    } catch (err) {
      console.error('Error loading online users:', err);
      setError('Failed to load online users');
    }
  };

  const filterActiveUsers = (users: Schema['UserPresence']['type'][]) => {
    const now = new Date();
    return users.filter(user => {
      if (!user.isOnline) return false;
      
      const lastSeen = new Date(user.lastSeen);
      const timeDiff = now.getTime() - lastSeen.getTime();
      return timeDiff < INACTIVE_THRESHOLD;
    });
  };

  /*   
   * You define a Context: a way to share state like “who’s online” 
   * Then you use .Provider to wrap part of your app and supply that state
   * Components inside it use useContext(...) to consume the value
   */

  const value: UserPresenceContextType = {
    onlineUsers,
    isLoading,
    error,
  };

  return (
    <UserPresenceContext.Provider value={value}>
      {children}
    </UserPresenceContext.Provider>
  );
};