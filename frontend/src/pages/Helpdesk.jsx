import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Send, ClipboardList, Info, HelpCircle, MessageSquare, 
  CheckCircle2, AlertCircle, Clock, Check, Radio, Filter
} from 'lucide-react';
import { subscribeToQueries } from '../services/supabaseClient';

const Helpdesk = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const [queries, setQueries] = useState([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('ATTENDANCE_DISPUTE');
  const [priority, setPriority] = useState('MEDIUM');
  const [messageText, setMessageText] = useState('');
  const [adminReplyText, setAdminReplyText] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQueries = async () => {
    try {
      const response = await axios.get('/api/queries');
      setQueries(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch helpdesk tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();

    // Supabase Real-Time Queries Subscription
    const unsubscribe = subscribeToQueries((payload) => {
      console.log('⚡ [Supabase Realtime] Ticket Update:', payload);
      fetchQueries();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !messageText) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/queries', {
        subject,
        category,
        priority,
        message: messageText
      });
      setSuccess('🎉 Ticket created in Supabase PostgreSQL & broadcast live to administrators!');
      setSubject('');
      setMessageText('');
      fetchQueries();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error submitting query ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    const reply = adminReplyText[ticketId] || 'Issue investigated and attendance record corrected.';
    try {
      await axios.post(`/api/queries/${ticketId}/resolve`, { response: reply });
      setSuccess(`Ticket #${ticketId} marked as RESOLVED.`);
      setAdminReplyText(prev => ({ ...prev, [ticketId]: '' }));
      fetchQueries();
    } catch (err) {
      setError('Failed to resolve ticket');
    }
  };

  const filteredQueries = queries.filter(q => {
    if (statusFilter === 'ALL') return true;
    return q.status === statusFilter;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Support & Helpdesk</h1>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--success)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <Radio size={12} className="animate-pulse" />
              <span>Real-Time Ticket Stream</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Submit attendance disputes, biometric recalibrations, and security queries directly to administration
          </p>
        </div>
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

      <div className="grid-cols-2" style={{ gridTemplateColumns: '38% 62%' }}>
        
        {/* Left Side: Create Query Form */}
        <div className="glass-panel" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--primary)" />
            <span className="form-label" style={{ margin: 0 }}>New Ticket Request</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div className="form-group">
              <label className="form-label" htmlFor="subject">Subject / Issue Title *</label>
              <input
                id="subject"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Forgot Clock-out / Missing Shift"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="ATTENDANCE_DISPUTE">Attendance Timecard</option>
                  <option value="BIOMETRIC_RESCAN">Face Scan / Rescan</option>
                  <option value="SECURITY_ACCESS">Security / Door Access</option>
                  <option value="GENERAL">General Support</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  className="form-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Urgent)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="message">Detailed Explanation *</label>
              <textarea
                id="message"
                required
                className="form-input"
                rows="5"
                style={{ resize: 'vertical', minHeight: '100px' }}
                placeholder="Explain details of the time discrepancy or reason..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <Info size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Tickets are synchronized live with Supabase Cloud PostgreSQL.</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={submitting}>
              <Send size={15} />
              <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
            </button>

          </form>
        </div>

        {/* Right Side: Ticket list history & Admin response */}
        <div className="glass-panel" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} color="var(--primary)" />
              <span className="form-label" style={{ margin: 0 }}>Ticket Feed ({filteredQueries.length})</span>
            </div>

            {/* Filter Toggle */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'OPEN', 'RESOLVED'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: statusFilter === f ? 'var(--primary)' : 'var(--bg-input)',
                    color: statusFilter === f ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '520px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {filteredQueries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                <HelpCircle size={36} />
                <span>No support tickets match the current filter.</span>
              </div>
            ) : (
              filteredQueries.map(q => {
                const date = new Date(q.createdAt || q.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <div 
                    key={q.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>{q.subject}</h4>
                          <span style={{
                            fontSize: '0.625rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: q.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: q.priority === 'HIGH' ? 'var(--danger)' : 'var(--primary)',
                            fontWeight: 700
                          }}>
                            {q.priority || 'MEDIUM'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Ticket ID: #{q.id} • {q.category || 'GENERAL'} • Submitted: {date}
                        </span>
                      </div>
                      
                      <span className={`badge ${q.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>
                        {q.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {q.message}
                    </p>

                    {/* Admin response block */}
                    {q.adminResponse ? (
                      <div style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)',
                        borderLeft: '3px solid var(--success)',
                        fontSize: '0.8125rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <CheckCircle2 size={14} color="var(--success)" />
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>Administrator Resolution:</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>{q.adminResponse}</span>
                      </div>
                    ) : isAdmin && q.status === 'OPEN' ? (
                      /* Admin Resolve Action Box */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Type admin resolution remark..."
                          value={adminReplyText[q.id] || ''}
                          onChange={(e) => setAdminReplyText({ ...adminReplyText, [q.id]: e.target.value })}
                          style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleResolveTicket(q.id)}
                          style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: '0.75rem' }}
                        >
                          <Check size={14} />
                          <span>Resolve Ticket</span>
                        </button>
                      </div>
                    ) : null}

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Helpdesk;
