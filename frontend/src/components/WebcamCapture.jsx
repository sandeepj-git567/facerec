import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

const WebcamCapture = ({ onCapture, isScanning = false, label = "Capture Face" }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setHasCamera(true);
    } catch (err) {
      logError(err);
      setError("Webcam access denied or unavailable. Please connect a camera.");
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const logError = (err) => {
    console.error("Camera access failed", err);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror the canvas horizontally so it acts like a mirror (intuitive for users)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(base64Data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
      <div className={`scanner-container ${isScanning ? 'active' : ''}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)' // Mirror effect
          }}
        />

        {/* HUD Scanner Overlays */}
        {hasCamera && (
          <>
            <div className="scan-hud" />
            <div className="scan-corner corner-tl" />
            <div className="scan-corner corner-tr" />
            <div className="scan-corner corner-bl" />
            <div className="scan-corner corner-br" />
            
            {/* Blinking camera active dot */}
            <div style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              zIndex: 7
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isScanning ? 'var(--primary)' : 'var(--success)',
                display: 'inline-block',
                animation: 'pulse 1.5s infinite'
              }} />
              <span>{isScanning ? 'ANALYZING...' : 'LIVE FEED'}</span>
            </div>
          </>
        )}

        {isScanning && <div className="scanning-line" />}

        {error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(9, 13, 22, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            gap: '16px',
            zIndex: 15
          }}>
            <span style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}>{error}</span>
            <button className="btn btn-secondary" onClick={startCamera}>
              <RefreshCw size={16} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}
      </div>

      {hasCamera && !isScanning && (
        <button className="btn btn-primary" onClick={captureFrame} style={{ width: '100%' }}>
          <Camera size={16} />
          <span>{label}</span>
        </button>
      )}
    </div>
  );
};

export default WebcamCapture;
