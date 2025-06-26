import React from 'react';
import { useUserPresence } from '../contexts/UserPresenceContext';
import { getCurrentUser } from 'aws-amplify/auth';
import './UserRoster.css';

const UserRoster: React.FC = () => {
  const { onlineUsers, isLoading, error } = useUserPresence();
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string>('');

  React.useEffect(() => {
    getCurrentUser().then(user => {
      setCurrentUserEmail(user.signInDetails?.loginId || user.username || '');
    }).catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <div className="roster-container">
        <h2>Loading users...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="roster-container">
        <h2>Error</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="roster-container">
      <h2>Online Users ({onlineUsers.length})</h2>
      
      {onlineUsers.length === 0 ? (
        <div className="empty-state">
          <p>No users currently online</p>
        </div>
      ) : (
        <div className="users-grid">
          {onlineUsers.map(user => (
            <div 
              key={user.id}
              className={`user-card ${user.email === currentUserEmail ? 'current-user' : ''}`}
            >
              <div className="user-info">
                <div className="username">{user.username}</div>
                <div className="user-status">
                  {user.email === currentUserEmail ? 'You' : 'Online'}
                </div>
                <div className="last-seen">
                  Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
                </div>
              </div>
              <div className="online-indicator"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserRoster;
