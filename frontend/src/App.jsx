import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ScanStation from './pages/ScanStation';
import Enrollment from './pages/Enrollment';
import UserDirectory from './pages/UserDirectory';
import AttendanceLogs from './pages/AttendanceLogs';
import Reports from './pages/Reports';
import Helpdesk from './pages/Helpdesk';
import QueryManager from './pages/QueryManager';
import UserDashboard from './pages/UserDashboard';

const AppContent = () => {
  const { user, loading, isAdmin } = useAuth();
  
  // Set default view: both profiles now default to the dashboard tab
  const getDefaultTab = () => {
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [tabInitialized, setTabInitialized] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <h2>Initializing FaceSecureAI Secure Context...</h2>
      </div>
    );
  }

  // Not logged in -> Show Login/Register flows
  if (!user) {
    return <Login />;
  }

  // Once authenticated, set default tab based on role once
  if (!tabInitialized) {
    setCurrentTab(getDefaultTab());
    setTabInitialized(true);
  }

  // Render content based on selected sidebar tab
  const renderTabContent = () => {
    switch (currentTab) {
      // Shared views
      case 'dashboard':
        return isAdmin() ? <Dashboard /> : <UserDashboard setCurrentTab={setCurrentTab} />;
      case 'scan':
        return <ScanStation />;
      case 'attendance':
        return <AttendanceLogs />;

      // Admin Only views
      case 'enroll':
        return isAdmin() ? <Enrollment /> : <ScanStation />;
      case 'users':
        return isAdmin() ? <UserDirectory /> : <ScanStation />;
      case 'reports':
        return isAdmin() ? <Reports /> : <ScanStation />;
      case 'query-manager':
        return isAdmin() ? <QueryManager /> : <ScanStation />;

      // Employee Only views
      case 'helpdesk':
        return !isAdmin() ? <Helpdesk /> : <Dashboard />;
        
      default:
        return isAdmin() ? <Dashboard /> : <UserDashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Panel Content */}
      <main className="main-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
