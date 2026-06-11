import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Clock, 
  FileSpreadsheet, 
  Camera, 
  LogOut,
  ShieldAlert,
  MessageSquare,
  Inbox
} from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab }) => {
  const { user, logout, isAdmin } = useAuth();

  const handleTabChange = (tabId) => {
    setCurrentTab(tabId);
  };

  // Define navigational links with permission gates
  const navItems = [
    // Shared
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'scan', name: 'Recognition Station', icon: Camera, adminOnly: false },
    { id: 'attendance', name: isAdmin() ? 'Attendance Logs' : 'My Attendance', icon: Clock, adminOnly: false },
    
    // Admin Only
    { id: 'enroll', name: 'Face Enrollment', icon: UserPlus, adminOnly: true },
    { id: 'users', name: 'User Directory', icon: Users, adminOnly: true },
    { id: 'reports', name: 'System Reports', icon: FileSpreadsheet, adminOnly: true },
    { id: 'query-manager', name: 'Query Manager', icon: Inbox, adminOnly: true },
    
    // Employee Only
    { id: 'helpdesk', name: 'Helpdesk Queries', icon: MessageSquare, employeeOnly: true }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', padding: '0 8px' }}>
        <div style={{ backgroundColor: 'var(--primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px var(--primary-glow)' }}>
          <ShieldAlert size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '800', lineHeight: 1, margin: 0 }}>FaceSecure<span style={{ color: 'var(--primary)' }}>AI</span></h2>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>ENTERPRISE SECURE</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
        {navItems.map((item) => {
          // Check Admin rules
          if (item.adminOnly && !isAdmin()) return null;
          // Check Employee rules
          if (item.employeeOnly && isAdmin()) return null;

          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Box */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {user?.roles?.map(r => r.replace('ROLE_', '').toLowerCase()).join(', ')}
          </span>
        </div>
        
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
