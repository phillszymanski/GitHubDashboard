import { useState } from 'react'
import './App.css'
import {
  DashboardAggregate,
  UsersTable,
} from './components'

function App() {
  const [tab, setTab] = useState<'dashboard' | 'users'>('users')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GitHub Dashboard</h1>
      </header>
      <main className="app-content">
        {tab === 'dashboard' && (
          <DashboardAggregate
            requestedUsername={selectedUser}
            onBack={() => setTab('users')}
          />
        )}
        {tab === 'users' && (
          <UsersTable
            selectedUsername={selectedUser}
            onSelectUser={(username) => {
              setSelectedUser(username)
              setTab('dashboard')
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
