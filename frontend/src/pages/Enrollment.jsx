import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WebcamCapture from '../components/WebcamCapture';
import { UserPlus, Search, HelpCircle, Check, X, Camera } from 'lucide-react';

const Enrollment = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // List of captured base64 images (we require 3)
  const [capturedImages, setCapturedImages] = useState([]);
  const [captureStep, setCaptureStep] = useState(0); // 0: not started, 1, 2, 3: capturing, 4: captured all 3
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCapturedImages([]);
    setCaptureStep(0);
    setMessage({ text: '', type: '' });
  };

  const handleCaptureImage = (base64Data) => {
    if (capturedImages.length >= 3) return;

    const updated = [...capturedImages, base64Data];
    setCapturedImages(updated);

    if (updated.length === 1) {
      setCaptureStep(2);
      setMessage({ text: 'Photo 1 captured! Now turn slightly to the left and scan again.', type: 'info' });
    } else if (updated.length === 2) {
      setCaptureStep(3);
      setMessage({ text: 'Photo 2 captured! Turn slightly to the right for the final scan.', type: 'info' });
    } else if (updated.length === 3) {
      setCaptureStep(4);
      setMessage({ text: 'All 3 biometric captures ready. Review profiles and enroll.', type: 'success' });
    }
  };

  const resetCaptures = () => {
    setCapturedImages([]);
    setCaptureStep(1);
    setMessage({ text: 'Look straight into the lens for Photo 1.', type: 'info' });
  };

  const handleEnroll = async () => {
    if (!selectedUser || capturedImages.length < 3) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/api/faces/enroll', {
        userId: selectedUser.id,
        images: capturedImages
      });
      setMessage({ text: 'Biometric enrollment completed successfully! User is now active.', type: 'success' });
      setCapturedImages([]);
      setCaptureStep(0);
      
      // Sync users list to refresh status indicators
      fetchUsers();
    } catch (error) {
      console.error(error);
      setMessage({ 
        text: error.response?.data?.message || 'Biometric template generation failed. Ensure your face is centered and clear.', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Face Enrollment</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Register new high-accuracy 128-D facial biometrics</p>
      </div>

      <div className="grid-cols-2" style={{ gridTemplateColumns: '40% 60%' }}>
        
        {/* Left Side: Search User list */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span className="form-label">1. Select User Profile</span>
          
          <div style={{ position: 'relative' }}>
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
              placeholder="Search user by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {filteredUsers.length === 0 ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No matching user profiles found.
              </span>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: selectedUser?.id === u.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: selectedUser?.id === u.id ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.firstName} {u.lastName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{u.username}</span>
                  </div>
                  
                  {/* Status Indicator (active vs inactive templates) */}
                  <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6875rem' }}>
                    {u.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Biometric Registration camera HUD */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span className="form-label">2. Biometric Photo Capture</span>

          {!selectedUser ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '350px',
              color: 'var(--text-secondary)',
              gap: '12px',
              textAlign: 'center'
            }}>
              <HelpCircle size={40} style={{ color: 'var(--text-muted)' }} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Profile Selected</h3>
                <p style={{ fontSize: '0.875rem', maxWidth: '280px', margin: '4px auto 0' }}>
                  Please choose a user from the directory panel on the left to begin capturing facial maps.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Enrollment Guideline Info bar */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                borderLeft: '4px solid var(--primary)'
              }}>
                <span style={{ fontWeight: 700 }}>Active User: </span>
                <span>{selectedUser.firstName} {selectedUser.lastName} (ID: #{selectedUser.id})</span>
              </div>

              {message.text && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' :
                                   message.type === 'info' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${
                    message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' :
                    message.type === 'info' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  }`,
                  color: message.type === 'success' ? 'var(--success)' :
                         message.type === 'info' ? 'var(--primary)' : 'var(--danger)'
                }}>
                  {message.text}
                </div>
              )}

              {/* Multi-step photo progress indicators */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', width: '100%' }}>
                {[1, 2, 3].map(stepNum => {
                  const isDone = capturedImages.length >= stepNum;
                  const isActive = captureStep === stepNum;
                  
                  return (
                    <div 
                      key={stepNum}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: isDone ? 'rgba(16, 185, 129, 0.08)' : isActive ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-input)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--text-muted)',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {isDone ? <Check size={16} /> : <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem' }}>{stepNum}</span>}
                      <span>{stepNum === 1 ? 'Straight' : stepNum === 2 ? 'Left Angle' : 'Right Angle'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Live stream webcam window */}
              {captureStep > 0 && captureStep < 4 ? (
                <WebcamCapture 
                  onCapture={handleCaptureImage} 
                  label={`Capture Step ${captureStep}`} 
                />
              ) : captureStep === 4 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Image Previews */}
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                    {capturedImages.map((img, idx) => (
                      <div key={idx} style={{ flex: 1, aspectRatio: '4/3', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative', backgroundColor: '#000' }}>
                        <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600 }}>Photo {idx + 1}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="btn btn-secondary" onClick={resetCaptures} style={{ flex: 1 }}>
                      <X size={16} />
                      <span>Retake Captures</span>
                    </button>
                    <button className="btn btn-primary" onClick={handleEnroll} disabled={loading} style={{ flex: 1 }}>
                      {loading ? 'Processing Embeddings...' : 'Enroll Face Templates'}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={() => { setCaptureStep(1); resetCaptures(); }} style={{ width: '100%' }}>
                  <UserPlus size={16} />
                  <span>Start Biometric Enrollment</span>
                </button>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Enrollment;
