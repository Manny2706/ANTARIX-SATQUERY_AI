import { useState } from 'react'
import Splash from './components/Splash'
import Landing from './components/Landing'
import Dashboard from './components/Dashboard'
import SearchPage from './components/SearchPage'

function App() {
  const [currentPage, setCurrentPage] = useState('splash')
  const [dashboardTab, setDashboardTab] = useState('dashboard')

  const goToDashboard = (tab) => {
    setDashboardTab(tab)
    setCurrentPage('dashboard')
  }

  if (currentPage === 'searchpage') {
    return <SearchPage onNavigate={goToDashboard} />
  }

  if (currentPage === 'dashboard') {
    return <Dashboard initialTab={dashboardTab} onNewAnalysis={() => setCurrentPage('searchpage')} />
  }

  if (currentPage === 'landing') {
    return <Landing onGetStarted={() => setCurrentPage('searchpage')} />
  }

  return (
    <Splash onFinish={() => setCurrentPage('landing')} />
  )
}

export default App
