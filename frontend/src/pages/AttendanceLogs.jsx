import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Calendar, Filter, User } from 'lucide-react';

const AttendanceLogs = () => {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filter parameters
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/attendance/list?startDate=${startDate}&endDate=${endDate}`;
      if (selectedUserId) {
        url += `&userId=${selectedUserId}`;
      }
      
      const response = await axios.get(url);
      setRecords(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch attendance history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, selectedUserId]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Attendance Logs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>View and audit employee check-in and checkout history records</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Filters Form Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            <span>Start Date</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            <span>End Date</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ flex: 1.5, minWidth: '240px', marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} />
            <span>Filter by Employee</span>
          </label>
          <select
            className="form-input"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">All Registered Employees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} (@{u.username})
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Logs Grid */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee Profile</th>
                <th>Clock In Time</th>
                <th>Clock Out Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Fetching records from database...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No attendance files found in the specified range.
                  </td>
                </tr>
              ) : (
                records.map(record => {
                  const clockInTime = new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const clockOutTime = record.clockOut 
                    ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Active Shift';

                  return (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 600 }}>{record.date}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{record.user.fullName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{record.user.username}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--success)' }}>{clockInTime}</td>
                      <td style={{ fontWeight: 500, color: record.clockOut ? 'var(--text-primary)' : 'var(--primary)' }}>
                        {clockOutTime}
                      </td>
                      <td>
                        <span className={`badge ${
                          record.status === 'PRESENT' ? 'badge-success' :
                          record.status === 'LATE' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AttendanceLogs;
