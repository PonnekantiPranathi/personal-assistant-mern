import './App.css';
import Chat from './components/Chat';
import AllToDoLists from './components/AllToDoLists';
import AllReminders from './components/AllReminders';
import { FaBell, FaList } from 'react-icons/fa';
import { useState } from 'react';

function App() {
  const [view, setView] = useState('chat'); // State to manage the view

  const handleViewChange = (view) => {
    setView(prevView => (prevView === view ? 'chat' : view));
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="icon icon-left" onClick={() => handleViewChange('todos')}>
          <FaList />
        </div>
        <h1> My Personal Assistant </h1>
        <div className="icon icon-right" onClick={() => handleViewChange('reminders')}>
          <FaBell />
        </div>
      </header>
      {view === 'chat' && <Chat />}
      {view === 'todos' && <AllToDoLists onBack={() => handleViewChange('chat')} />}
      {view === 'reminders' && <AllReminders onBack={() => handleViewChange('chat')} />}
    </div>
  );
}

export default App;
