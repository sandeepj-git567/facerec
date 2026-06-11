import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, ClipboardList, Info, HelpCircle } from 'lucide-react';

const Helpdesk = () => {
  const [queries, setQueries] = useState([]);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
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
        message: messageText
      });
      setSuccess('Query ticket submitted successfully to administration!');
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Helpdesk Portal</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Submit attendance disputes and general feedback to system administrators</p>
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

      <div className="grid-cols-2" style={{ gridTemplateColumns: '40% 60%' }}>
        
        {/* Left Side: Create Query Form */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span className="form-label">Create Support Ticket</span>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group">
              <label className="form-label" htmlFor="subject">Subject / Title</label>
              <input
                id="subject"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Forgot Clock-out on 06-10"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="message">Detailed Message</label>
              <textarea
                id="message"
                required
                className="form-input"
                rows="6"
                style={{ resize: 'vertical', minHeight: '120px' }}
                placeholder="Explain the correction details or issue you'd like resolved..."
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
              <span>Resolving clock disputes automatically updates corresponding daily attendance records.</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Query'}</span>
            </button>

          </form>
        </div>

        {/* Right Side: Ticket list history */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} color="var(--primary)" />
            <span className="form-label">Submitted Tickets Logs</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '450px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {loading && queries.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                Fetching helpdesk history...
              </span>
            ) : queries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                <HelpCircle size={36} />
                <span>No support tickets submitted yet.</span>
              </div>
            ) : (
              queries.map(q => {
                const date = new Date(q.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

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
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>{q.subject}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ticket ID: #{q.id} • Submitted: {date}</span>
                      </div>
                      
                      <span className={`badge ${
                        q.status === 'PENDING' ? 'badge-warning' :
                        q.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'
                      }`}>
                        {q.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {q.message}
                    </p>

                    {/* Admin response block */}
                    {q.adminRemarks && (
                      <div style={{
                        marginTop: '4px',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-input)',
                        borderLeft: '3px solid var(--primary)',
                        fontSize: '0.8125rem'
                      }}>
                        <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>Admin Response:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{q.adminRemarks}</span>
                      </div>
                    )}

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
