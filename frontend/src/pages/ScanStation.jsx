import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import WebcamCapture from '../components/WebcamCapture';
import { Camera, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const ScanStation = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [autoScan, setAutoScan] = useState(true);
  
  // Flash overlays states: 'success', 'error', 'warning', or null
  const [flashType, setFlashType] = useState(null);

  const webcamRef = useRef(null);
  const scanTimerRef = useRef(null);

  // Function to process a single camera frame snapshot
  const handleCapture = async (base64Image) => {
    if (scanning) return;
    
    setScanning(true);
    setFlashType(null);

    try {
      const response = await axios.post('/api/faces/recognize', {
        image: base64Image,
        deviceInfo: 'Kiosk Camera 01'
      });

      const matchData = response.data;
      setResult(matchData);

      // Trigger flash animations based on response status
      if (matchData.matched) {
        setFlashType('success');
        
        // Auto-pause for 3.5 seconds on successful clock-in to let user walk through
        if (autoScan) {
          stopScanTimer();
          setTimeout(() => {
            setResult(null);
            setFlashType(null);
            startScanTimer();
          }, 3500);
        }
      } else {
        if (matchData.status === 'UNKNOWN') {
          setFlashType('warning');
        } else {
          setFlashType('error');
        }
        
        // Pause 2 seconds for unknown faces
        if (autoScan) {
          stopScanTimer();
          setTimeout(() => {
            setResult(null);
            setFlashType(null);
            startScanTimer();
          }, 2000);
        }
      }
    } catch (error) {
      console.error(error);
      setResult({
        matched: false,
        status: 'FAILURE',
        message: 'Network link error or server overload.'
      });
      setFlashType('error');
    } finally {
      setScanning(false);
    }
  };

  const startScanTimer = () => {
    if (scanTimerRef.current) return;
    
    // Set up continuous frame captures (every 1.8s)
    scanTimerRef.current = setInterval(() => {
      const captureBtn = document.querySelector('.scanner-container + button');
      if (captureBtn) {
        captureBtn.click();
      }
    }, 1800);
  };

  const stopScanTimer = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (autoScan) {
      startScanTimer();
    } else {
      stopScanTimer();
    }

    return () => {
      stopScanTimer();
    };
  }, [autoScan]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Recognition Station</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Biometric Access Control Kiosk Terminal</p>
      </div>

      <div className="grid-cols-2">
        
        {/* Left Side: Camera view */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
          
          {/* Flash Feedback Overlay */}
          {flashType && (
            <div style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              right: '24px',
              bottom: '24px',
              borderRadius: 'var(--radius-lg)',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: flashType === 'success' ? 'inset 0 0 40px var(--success)' :
                         flashType === 'warning' ? 'inset 0 0 40px var(--warning)' : 'inset 0 0 40px var(--danger)',
              border: `3px solid ${
                flashType === 'success' ? 'var(--success)' :
                flashType === 'warning' ? 'var(--warning)' : 'var(--danger)'
              }`,
              animation: 'pulse 1s infinite'
            }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="form-label">Scanner Terminal Feed</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={autoScan} 
                onChange={(e) => setAutoScan(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Auto-Poll Loop</span>
            </label>
          </div>

          <WebcamCapture 
            ref={webcamRef} 
            onCapture={handleCapture} 
            isScanning={scanning} 
            label="Verify Face Now" 
          />
        </div>

        {/* Right Side: Biometric Match Panel */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center' }}>
          
          {!result ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '24px', borderRadius: '50%', color: 'var(--text-muted)' }}>
                <Camera size={48} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Awaiting Face...</h3>
                <p style={{ fontSize: '0.875rem', maxWidth: '280px', margin: '8px auto 0' }}>
                  Please position your face clearly in the camera boundary to trigger verification scan.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Status Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: result.matched ? 'rgba(16, 185, 129, 0.1)' : 
                                result.status === 'UNKNOWN' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${
                  result.matched ? 'rgba(16, 185, 129, 0.2)' : 
                  result.status === 'UNKNOWN' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                }`
              }}>
                {result.matched ? (
                  <CheckCircle2 size={36} color="var(--success)" />
                ) : result.status === 'UNKNOWN' ? (
                  <AlertCircle size={36} color="var(--warning)" />
                ) : (
                  <XCircle size={36} color="var(--danger)" />
                )}
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: result.matched ? 'var(--success)' : 'var(--text-primary)' }}>
                    {result.matched ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Biometric Check Match
                  </span>
                </div>
              </div>

              {/* Match Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                
                {result.matched && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Name</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{result.fullName}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>User ID</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>#{result.userId}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Username</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--primary)' }}>@{result.username}</span>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Similarity Confidence</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: result.matched ? 'var(--success)' : 'var(--danger)' }}>
                    {result.confidence > 0 ? `${result.confidence}%` : '0.0%'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Transaction Detail</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, textAlign: 'right', maxWidth: '220px' }}>
                    {result.message}
                  </span>
                </div>
              </div>

              {/* Auto Poll countdown indicator */}
              {autoScan && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '12px',
                  justifyContent: 'center'
                }}>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Kiosk auto-monitoring is active. Awaiting next scan frame...</span>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ScanStation;
