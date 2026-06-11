import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, X, Check, ShieldAlert } from 'lucide-react';

const UserDirectory = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form States
  const [userId, setUserId] = useState(null); // null if creating, ID if editing
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [roleAdmin, setRoleAdmin] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/users?search=${search}`);
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const openCreateModal = () => {
    setUserId(null);
    setUsername('');
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setPassword('');
    setStatus('ACTIVE');
    setRoleAdmin(false);
    
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setUserId(user.id);
    setUsername(user.username);
    setEmail(user.email);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone || '');
    setPassword(''); // don't load password
    setStatus(user.status);
    setRoleAdmin(user.roles.includes('ROLE_ADMIN'));
    
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user: ${name}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/users/${id}`);
      setSuccess(`User ${name} deleted successfully!`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      username,
      email,
      firstName,
      lastName,
      phone,
      status,
      roles: roleAdmin ? ['ROLE_ADMIN', 'ROLE_USER'] : ['ROLE_USER']
    };

    if (!userId) {
      // Create mode requires password
      if (!password) {
        setError('Password is required for new user creation.');
        return;
      }
      payload.password = password;
    }

    try {
      if (userId) {
        // Edit mode
        await axios.put(`/api/users/${userId}`, payload);
        setSuccess('User profile updated successfully!');
      } else {
        // Create mode
        await axios.post('/api/users', payload);
        setSuccess('New user account registered successfully!');
      }
      
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing request.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>User Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Add, update, and manage employee profile records</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Add Employee</span>
        </button>
      </div>

      {success && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--success-glow)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Filter and Search */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', paddingLeft: '44px' }}
            placeholder="Search directory by name/username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee Name</th>
                <th>Username</th>
                <th>Email Address</th>
                <th>Contact</th>
                <th>Auth Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Loading employee registry...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No matching user records found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                    <td>@{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {u.roles.map(role => (
                          <span key={role} className={`badge ${role === 'ROLE_ADMIN' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.625rem' }}>
                            {role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => openEditModal(u)} 
                          style={{ padding: '6px 10px', minWidth: 'auto' }}
                          title="Edit Profile"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(u.id, u.firstName + " " + u.lastName)}
                          style={{ padding: '6px 10px', minWidth: 'auto', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                          title="Delete Profile"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {userId ? 'Modify Employee Profile' : 'Register New Employee'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="first-name">First Name</label>
                  <input
                    id="first-name"
                    type="text"
                    required
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="last-name">Last Name</label>
                  <input
                    id="last-name"
                    type="text"
                    required
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    required
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="text"
                    className="form-input"
                    placeholder="e.g. +1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {!userId && (
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Login Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Set baseline login password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {userId && (
                <div className="form-group">
                  <label className="form-label" htmlFor="status">Account Status</label>
                  <select 
                    id="status"
                    className="form-input" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input 
                    type="checkbox" 
                    checked={roleAdmin} 
                    onChange={(e) => setRoleAdmin(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Grant Administrator Privileges</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {userId ? 'Save Modifications' : 'Create Account'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDirectory;
