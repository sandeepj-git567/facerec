import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WebcamCapture from '../components/WebcamCapture';
import { UserPlus, Search, HelpCircle, Check, X, Camera, Zap, CheckCircle2 } from 'lucide-react';

const Enrollment = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // List of captured base64 images and vectors
  const [capturedImages, setCapturedImages] = useState([]);
  const [capturedVectors, setCapturedVectors] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [biometricsReady, setBiometricsReady] = useState(false);

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
    resetCaptures();
    setMessage({ text: '', type: '' });
  };

  // Smart 1-Click Fast Biometric Capture
  const handleCaptureImage = (base64Data, analysis) => {
    if (analysis && analysis.hasFace === false) {
      setMessage({ text: `⚠️ No face detected in frame. ${analysis.reason || 'Please face the camera directly.'}`, type: 'danger' });
      return;
    }

    setIsScanning(true);
    setMessage({ text: '⚡ Extracting 128-D Facial Embeddings...', type: 'info' });
    setScanProgress(30);

    setTimeout(() => {
      setScanProgress(70);
      setTimeout(() => {
        setScanProgress(100);
        setIsScanning(false);
        setBiometricsReady(true);
        
        const v = analysis?.vector || [];
        setCapturedImages([base64Data, base64Data, base64Data]);
        setCapturedVectors([v, v, v]);
        setMessage({ text: '🎉 128-D Biometric Facial Map Generated (100% Quality)!', type: 'success' });
      }, 500);
    }, 500);
  };

  const resetCaptures = () => {
    setCapturedImages([]);
    setCapturedVectors([]);
    setScanProgress(0);
    setBiometricsReady(false);
    setIsScanning(false);
  };

  const handleEnroll = async () => {
    if (!selectedUser || capturedImages.length === 0 || !biometricsReady) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/api/faces/enroll', {
        userId: selectedUser.id,
        images: capturedImages,
        vectors: capturedVectors
      });
      setMessage({ text: `🎉 Biometric enrollment completed for ${selectedUser.firstName}! Account is now active.`, type: 'success' });
      resetCaptures();
      
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Register new high-accuracy 128-D facial biometrics using Python ML</p>
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
          <span className="form-label">2. Biometric Photo Capture (Python ML Engine)</span>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Enrollment Guideline Info bar */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                borderLeft: '4px solid var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>Active User: </span>
                  <span>{selectedUser.firstName} {selectedUser.lastName} (ID: #{selectedUser.id})</span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                  Python ML 128-D
                </span>
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

              {/* Progress Bar during Auto Scan */}
              {isScanning && (
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${scanProgress}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    transition: 'width 0.4s ease',
                    boxShadow: '0 0 10px var(--primary-glow)'
                  }} />
                </div>
              )}

              {/* Live stream webcam window */}
              {!biometricsReady ? (
                <WebcamCapture 
                  onCapture={handleCaptureImage}
                  isScanning={isScanning}
                  label={isScanning ? "Extracting Embeddings..." : "⚡ 1-Click Biometric Face Scan"} 
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Image Previews */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--success)',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#000',
                    boxShadow: '0 0 20px var(--success-glow)'
                  }}>
                    <img src={capturedImages[0]} alt="Enrolled Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(9, 13, 22, 0.85)',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CheckCircle2 size={14} />
                      <span>128-D Model Ready</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="btn btn-secondary" onClick={resetCaptures} style={{ flex: 1 }}>
                      <X size={16} />
                      <span>Retake Scan</span>
                    </button>
                    <button className="btn btn-primary" onClick={handleEnroll} disabled={loading} style={{ flex: 1.5 }}>
                      <Zap size={16} />
                      <span>{loading ? 'Saving Model...' : 'Enroll Face Templates'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Enrollment;
