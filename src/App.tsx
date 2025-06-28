import { useEffect, useState } from "react";

import type { Schema } from "../amplify/data/resource";
import { UserPresenceProvider } from './contexts/UserPresenceContext';
import UserRoster from './components/UserRoster';

import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';

import './App.css';

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();

  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
    return () => sub.unsubscribe();
  }, []);
  
  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  async function handleSignOut() {
    signOut();
  }

  return (
    <div className="split">
      <aside>
        <UserPresenceProvider>
          <div className="roster">
            <UserRoster />
          </div>
        </UserPresenceProvider>
      </aside>
      <main>
        <h1>{user?.signInDetails?.loginId}'s todos</h1>
        <h1>My todos</h1>
        <button onClick={createTodo}>+ new</button>
        <ul>
          {todos.map((todo) => (
            <li
              onClick={() => deleteTodo(todo.id)}
              key={todo.id}>{todo.content}
            </li>
          ))}
        </ul>
        <div>
          🥳 App successfully hosted. Try creating a new todo.
          <br />
          <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
            Review next step of this tutorial.
          </a>
        </div>
        <button onClick={handleSignOut}>Sign out</button>
      </main>
    </div>
  );
}

export default App;
