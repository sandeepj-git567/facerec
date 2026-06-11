import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Inbox, MessageSquare, Check, X, CheckSquare, XSquare, AlertCircle } from 'lucide-react';

const QueryManager = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null); // Query to process
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionType, setActionType] = useState(''); // 'RESOLVED' or 'REJECTED'
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/queries');
      setQueries(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch queries list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const openProcessModal = (query, action) => {
    setSelectedQuery(query);
    setActionType(action);
    setAdminRemarks('');
    setError('');
    setSuccess('');
  };

  const handleProcessQuery = async (e) => {
    e.preventDefault();
    if (!adminRemarks.trim()) {
      setError('Remarks are required to process support tickets');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`/api/queries/${selectedQuery.id}`, {
        status: actionType,
        adminRemarks: adminRemarks.trim()
      });

      setSuccess(`Ticket ID #${selectedQuery.id} processed as ${actionType}!`);
      setSelectedQuery(null);
      fetchQueries();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error processing query ticket.');
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = queries.filter(q => q.status === 'PENDING').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Query Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Audit employee dispute tickets and resolve attendance records anomalies</p>
        </div>
        <span className="badge badge-warning" style={{ padding: '8px 14px', fontSize: '0.8125rem' }}>
          {pendingCount} Pending Tickets
        </span>
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

      {/* Main Grid View */}
      <div className="grid-cols-2" style={{ gridTemplateColumns: selectedQuery ? '55% 45%' : '100%' }}>
        
        {/* Left Side: Tickets List */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={18} color="var(--primary)" />
            <span className="form-label">Employee Tickets Directory</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Employee</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && queries.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      Loading helpdesk tickets database...
                    </td>
                  </tr>
                ) : queries.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No support tickets submitted.
                    </td>
                  </tr>
                ) : (
                  queries.map(q => (
                    <tr key={q.id} style={{ 
                      backgroundColor: selectedQuery?.id === q.id ? 'rgba(59, 130, 246, 0.04)' : 'transparent' 
                    }}>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{q.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{q.fullName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{q.username}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{q.subject}</span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {q.message}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          q.status === 'PENDING' ? 'badge-warning' :
                          q.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {q.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              className="btn btn-primary"
                              onClick={() => openProcessModal(q, 'RESOLVED')}
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              <Check size={12} />
                              <span>Resolve</span>
                            </button>
                            <button 
                              className="btn btn-secondary"
                              onClick={() => openProcessModal(q, 'REJECTED')}
                              style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid var(--danger)', color: 'var(--danger)', backgroundColor: 'transparent' }}
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', italic: 'true' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Resolve/Reject form */}
        {selectedQuery && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label" style={{ color: actionType === 'RESOLVED' ? 'var(--success)' : 'var(--danger)' }}>
                {actionType === 'RESOLVED' ? 'Resolve Support Ticket' : 'Reject Support Ticket'}
              </span>
              <button 
                onClick={() => setSelectedQuery(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.875rem'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedQuery.fullName}</span>
              <span style={{ color: 'var(--text-muted)' }}> (ID: #{selectedQuery.id})</span>
              <h4 style={{ margin: '8px 0 4px', fontWeight: 700 }}>{selectedQuery.subject}</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.8125rem' }}>
                {selectedQuery.message}
              </p>
            </div>

            {actionType === 'RESOLVED' && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--success)'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>Resolving this dispute automatically updates the employee's attendance state to present.</span>
              </div>
            )}

            <form onSubmit={handleProcessQuery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="remarks">Response Remarks</label>
                <textarea
                  id="remarks"
                  required
                  className="form-input"
                  rows="4"
                  placeholder="Explain the resolution or reason for rejection to the employee..."
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  disabled={processing}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedQuery(null)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    backgroundColor: actionType === 'RESOLVED' ? 'var(--success)' : 'var(--danger)',
                    color: '#fff',
                    boxShadow: actionType === 'RESOLVED' ? '0 4px 14px var(--success-glow)' : '0 4px 14px var(--danger-glow)'
                  }} 
                  disabled={processing}
                >
                  {processing ? 'Processing...' : actionType === 'RESOLVED' ? 'Approve & Correct' : 'Reject Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

    </div>
  );
};

export default QueryManager;
