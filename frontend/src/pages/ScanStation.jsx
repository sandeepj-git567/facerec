import React, { useState, useEffect, useRef } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { apiService } from '../services/apiService';
import { Camera, CheckCircle2, XCircle, AlertCircle, RefreshCw, Volume2, Radio, ShieldCheck, Zap } from 'lucide-react';

const ScanStation = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [autoScan, setAutoScan] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashType, setFlashType] = useState(null);
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString());

  const scanTimerRef = useRef(null);

  // Live Digital Clock ticker
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Web Audio API Sound Synthesizer
  const playAudioFeedback = (type = 'success') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn('Audio chime warning:', e);
    }
  };

  // Function to process a camera frame snapshot
  const handleCapture = async (base64Image, analysis) => {
    if (scanning) return;
    
    // Strict face presence check
    if (analysis && analysis.hasFace === false) {
      setResult({
        matched: false,
        status: 'FAILURE',
        message: `⚠️ ${analysis.reason || 'Obstruction detected. Remove hand or align face in frame.'}`
      });
      setFlashType('warning');
      playAudioFeedback('error');
      return;
    }

    setScanning(true);
    setFlashType(null);

    try {
      const matchData = await apiService.recognizeFace(base64Image, {
        vector: analysis?.vector,
        hasFace: analysis?.hasFace,
        deviceInfo: 'Kiosk Terminal 01'
      });

      setResult(matchData);

      if (matchData.matched) {
        setFlashType('success');
        playAudioFeedback('success');
        
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
        playAudioFeedback('error');
        
        if (autoScan) {
          stopScanTimer();
          setTimeout(() => {
            setResult(null);
            setFlashType(null);
            startScanTimer();
          }, 2500);
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
      playAudioFeedback('error');
    } finally {
      setScanning(false);
    }
  };

  const startScanTimer = () => {
    if (scanTimerRef.current) return;
    scanTimerRef.current = setInterval(() => {
      const captureBtn = document.querySelector('.scanner-container + button');
      if (captureBtn) {
        captureBtn.click();
      }
    }, 2200);
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
    return () => stopScanTimer();
  }, [autoScan]);

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      maxWidth: '720px',
      margin: '0 auto',
      width: '100%'
    }}>
      
      {/* Header with Terminal Live Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Kiosk Terminal</h1>
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
              <span>Supabase Cloud Online</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Touch-free facial attendance scanner • Live shift logging
          </p>
        </div>

        {/* Live Digital Clock Badge */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
            {liveClock}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Kiosk Camera Station Panel */}
      <div className="glass-panel" style={{
        padding: '28px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative'
      }}>
        
        {/* Toggle Mode Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Terminal ID: KIOSK-HQ-01</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={soundEnabled} 
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <Volume2 size={14} />
              <span>Audio Chime</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem', color: autoScan ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={autoScan} 
                onChange={(e) => setAutoScan(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <Zap size={14} />
              <span>Auto-Scan Radar</span>
            </label>
          </div>
        </div>

        {/* Live Camera Scanner Element */}
        <div style={{ width: '100%', maxWidth: '520px', position: 'relative' }}>
          <WebcamCapture 
            onCapture={handleCapture}
            isScanning={scanning}
            label={scanning ? "Matching Facial Vector..." : "⚡ Scan Face to Clock-In / Out"}
          />

          {/* Flash Result Overlays */}
          {flashType && result && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: flashType === 'success' ? 'rgba(9, 13, 22, 0.94)' : 'rgba(9, 13, 22, 0.94)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '24px',
              textAlign: 'center',
              zIndex: 20,
              animation: 'fadeIn 0.25s ease'
            }}>
              {flashType === 'success' ? (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: '16px',
                  borderRadius: '50%',
                  border: '2px solid var(--success)'
                }}>
                  <CheckCircle2 size={48} color="var(--success)" />
                </div>
              ) : flashType === 'warning' ? (
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  padding: '16px',
                  borderRadius: '50%',
                  border: '2px solid var(--warning)'
                }}>
                  <AlertCircle size={48} color="var(--warning)" />
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  padding: '16px',
                  borderRadius: '50%',
                  border: '2px solid var(--danger)'
                }}>
                  <XCircle size={48} color="var(--danger)" />
                </div>
              )}

              <div>
                <h3 style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  margin: 0,
                  color: flashType === 'success' ? 'var(--success)' : flashType === 'warning' ? 'var(--warning)' : 'var(--danger)'
                }}>
                  {flashType === 'success' ? 'Biometric Match Verified' : flashType === 'warning' ? 'Access Attention' : 'Access Denied'}
                </h3>
                
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', marginTop: '6px' }}>
                  {result.message}
                </p>

                {result.matched && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Identity: {result.fullName} (@{result.username}) • Confidence: {result.confidence}%
                  </span>
                )}
              </div>

              {!autoScan && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setResult(null); setFlashType(null); }}
                  style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.8125rem' }}
                >
                  <span>Ready Next Scan</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ScanStation;
