import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import WebcamCapture from '../components/WebcamCapture';
import axios from 'axios';
import { ShieldAlert, Lock, User, Eye, EyeOff, Mail, Phone, ChevronRight, Check, X, Camera } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  
  // View states: 'login', 'register-profile', 'register-biometrics'
  const [view, setView] = useState('login');
  
  // Login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration form states
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('ROLE_USER'); // ROLE_USER or ROLE_ADMIN
  
  // Biometrics enrollment states
  const [capturedImages, setCapturedImages] = useState([]);
  const [captureStep, setCaptureStep] = useState(0); // 0: not started, 1, 2, 3: capturing, 4: captured all 3

  // UI Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle standard login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(loginUsername, loginPassword);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  // Move from Profile Details to Biometrics view
  const handleProfileNext = (e) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regFirstName || !regLastName || !regPassword) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setView('register-biometrics');
    setCapturedImages([]);
    setCaptureStep(1);
  };

  // Capture face frames during registration flow
  const handleCaptureImage = (base64Data) => {
    if (capturedImages.length >= 3) return;
    const updated = [...capturedImages, base64Data];
    setCapturedImages(updated);

    if (updated.length === 1) {
      setCaptureStep(2);
      setError('');
    } else if (updated.length === 2) {
      setCaptureStep(3);
      setError('');
    } else if (updated.length === 3) {
      setCaptureStep(4);
      setError('');
    }
  };

  const resetCaptures = () => {
    setCapturedImages([]);
    setCaptureStep(1);
  };

  // Submit profile details + biometrics to backend
  const handleRegisterSubmit = async () => {
    if (capturedImages.length < 3) {
      setError('3 webcam captures are required to generate template');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Create User account
      const userPayload = {
        username: regUsername,
        email: regEmail,
        firstName: regFirstName,
        lastName: regLastName,
        phone: regPhone,
        password: regPassword,
        roles: regRole === 'ROLE_ADMIN' ? ['ROLE_ADMIN', 'ROLE_USER'] : ['ROLE_USER']
      };

      const userResponse = await axios.post('/api/users', userPayload);
      const createdUser = userResponse.data;

      // 2. Enroll face images
      await axios.post('/api/faces/enroll', {
        userId: createdUser.id,
        images: capturedImages
      });

      setSuccess('Registration and Biometrics enrollment successful! You can now log in.');
      setView('login');
      
      // Clear forms
      setLoginUsername(regUsername);
      setRegUsername('');
      setRegEmail('');
      setRegFirstName('');
      setRegLastName('');
      setRegPhone('');
      setRegPassword('');
      setCapturedImages([]);
      setCaptureStep(0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Biometric enrollment failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: view === 'register-biometrics' ? '520px' : '450px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'var(--primary)',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--primary-glow)'
          }}>
            <ShieldAlert size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px' }}>FaceSecure<span style={{ color: 'var(--primary)' }}>AI</span></h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {view === 'login' ? 'Enterprise Access Control Console' : 'Biometrics Self-Registration Portal'}
            </p>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div style={{
            backgroundColor: 'var(--danger-glow)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'var(--success-glow)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--success)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: 600
          }}>
            {success}
          </div>
        )}

        {/* VIEW 1: SIGN IN */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '44px' }}
                  placeholder="admin or employee"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '44px', paddingRight: '44px' }}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 18px', fontSize: '0.9375rem', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>New to FaceSecureAI? </span>
              <button 
                type="button"
                onClick={() => { setView('register-profile'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Register Account
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: SIGN UP PROFILE DETAILS */}
        {view === 'register-profile' && (
          <form onSubmit={handleProfileNext} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="reg-first">First Name *</label>
                <input
                  id="reg-first"
                  type="text"
                  required
                  className="form-input"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="reg-last">Last Name *</label>
                <input
                  id="reg-last"
                  type="text"
                  required
                  className="form-input"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="reg-email"
                  type="email"
                  required
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="reg-user">Username *</label>
                <input
                  id="reg-user"
                  type="text"
                  required
                  className="form-input"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="reg-phone">Contact Phone</label>
                <input
                  id="reg-phone"
                  type="text"
                  className="form-input"
                  placeholder="Optional"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-pass">Password *</label>
              <input
                id="reg-pass"
                type="password"
                required
                className="form-input"
                placeholder="Choose security password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Register As *</label>
              <select
                id="reg-role"
                className="form-input"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option value="ROLE_USER">Employee (Standard User)</option>
                <option value="ROLE_ADMIN">System Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 18px', marginTop: '12px' }}
            >
              <span>Next: Capture Biometrics</span>
              <ChevronRight size={16} />
            </button>

            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              style={{ width: '100%' }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* VIEW 3: BIOMETRIC WEBCAM ENROLLMENT WIZARD */}
        {view === 'register-biometrics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              borderLeft: '4px solid var(--primary)',
              textAlign: 'left'
            }}>
              <span style={{ fontWeight: 700 }}>Biometric Enrollment for: </span>
              <span>{regFirstName} {regLastName} (@{regUsername})</span>
            </div>

            {/* Steps indicator */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              {[1, 2, 3].map(stepNum => {
                const isDone = capturedImages.length >= stepNum;
                const isActive = captureStep === stepNum;
                return (
                  <div 
                    key={stepNum}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: isDone ? 'rgba(16, 185, 129, 0.08)' : isActive ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-input)',
                      color: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    {isDone ? <Check size={12} /> : <span>{stepNum}</span>}
                    <span>{stepNum === 1 ? 'Straight' : stepNum === 2 ? 'Left' : 'Right'}</span>
                  </div>
                );
              })}
            </div>

            {/* Instruction prompts based on steps */}
            <div style={{
              fontSize: '0.8125rem',
              color: 'var(--primary)',
              textAlign: 'center',
              fontWeight: 700,
              padding: '4px 0'
            }}>
              {captureStep === 1 && "📸 Look straight into the camera and click capture."}
              {captureStep === 2 && "📸 Turn slightly left and click capture."}
              {captureStep === 3 && "📸 Turn slightly right and click capture."}
              {captureStep === 4 && "✅ 3/3 templates captured successfully!"}
            </div>

            {/* Webcam window */}
            {captureStep > 0 && captureStep < 4 ? (
              <WebcamCapture 
                onCapture={handleCaptureImage}
                label={`Capture Snapshot ${captureStep}`}
              />
            ) : captureStep === 4 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                  {capturedImages.map((img, idx) => (
                    <div key={idx} style={{ flex: 1, aspectRatio: '4/3', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', backgroundColor: '#000' }}>
                      <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={resetCaptures} style={{ flex: 1 }} disabled={loading}>
                    <X size={14} />
                    <span>Retake</span>
                  </button>
                  <button className="btn btn-primary" onClick={handleRegisterSubmit} disabled={loading} style={{ flex: 1.5 }}>
                    {loading ? 'Registering...' : 'Submit Registration'}
                  </button>
                </div>
              </div>
            ) : null}

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { setView('register-profile'); setError(''); }}
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              Back to Details Form
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
