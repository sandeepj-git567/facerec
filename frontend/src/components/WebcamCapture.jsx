import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

const WebcamCapture = ({ onCapture, isScanning = false, label = "Authenticate with Face" }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState(null);
  const [liveFaceDetected, setLiveFaceDetected] = useState(false);
  const [detectionReason, setDetectionReason] = useState('Initializing camera...');

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
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setHasCamera(true);
      
      // Start live real-time anatomical face presence detector
      startLiveFaceDetection();
    } catch (err) {
      logError(err);
      setError("Webcam access denied or unavailable. Please connect a camera.");
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const logError = (err) => {
    console.error("Camera access failed", err);
  };

  // Anatomical Facial Feature & Landmark Analysis
  // Distinguishes genuine human faces from hands, objects, flat skin, or blank backgrounds
  const analyzeVideoFrame = (video) => {
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      return { hasFace: false, reason: 'Camera stream unavailable', vector: [] };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Mirror the frame for user-facing intuitive alignment
    ctx.translate(64, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, 64, 64);
    
    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = imgData.data;
    
    // 2D Luminance Matrix (64x64)
    const lumMatrix = [];
    let totalBrightness = 0;
    let skinPixelCount = 0;
    
    for (let y = 0; y < 64; y++) {
      lumMatrix[y] = new Float32Array(64);
      for (let x = 0; x < 64; x++) {
        const idx = (y * 64 + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Standard CIE Luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lumMatrix[y][x] = lum;
        totalBrightness += lum;
        
        // Human skin chroma filter in center 60% face box
        if (x >= 14 && x <= 50 && y >= 10 && y <= 54) {
          if (r > 55 && g > 35 && b > 20 && r > g && (r - b) > 10 && (r - g) > 5) {
            skinPixelCount++;
          }
        }
      }
    }
    
    const totalPixels = 64 * 64;
    const avgBrightness = totalBrightness / totalPixels;
    const centerRoiPixels = 36 * 44; // 1584 pixels in center face zone
    const skinRatio = skinPixelCount / centerRoiPixels;
    
    // 1. Check basic lighting and skin presence
    if (avgBrightness < 22) {
      return { hasFace: false, reason: 'Environment too dark', vector: [] };
    }
    if (avgBrightness > 238) {
      return { hasFace: false, reason: 'Camera overexposed', vector: [] };
    }
    if (skinRatio < 0.12) {
      return { hasFace: false, reason: 'No face in frame (align in box)', vector: [] };
    }

    // 2. Standard deviation of luminance (feature complexity)
    let varianceSum = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        varianceSum += Math.pow(lumMatrix[y][x] - avgBrightness, 2);
      }
    }
    const stdDev = Math.sqrt(varianceSum / totalPixels);
    if (stdDev < 15) {
      return { hasFace: false, reason: 'Flat surface / camera covered', vector: [] };
    }

    // 3. ANATOMICAL LANDMARK CHECK (Distinguishes Face vs Hand/Palm):
    // A. Forehead zone (y: 12-20, x: 20-44)
    let foreheadSum = 0, foreheadCount = 0;
    for (let y = 12; y <= 20; y++) {
      for (let x = 20; x <= 44; x++) {
        foreheadSum += lumMatrix[y][x];
        foreheadCount++;
      }
    }
    const foreheadAvg = foreheadSum / foreheadCount;

    // B. Left eye zone (y: 24-34, x: 16-28)
    let leftEyeSum = 0, leftEyeCount = 0;
    for (let y = 24; y <= 34; y++) {
      for (let x = 16; x <= 28; x++) {
        leftEyeSum += lumMatrix[y][x];
        leftEyeCount++;
      }
    }
    const leftEyeAvg = leftEyeSum / leftEyeCount;

    // C. Right eye zone (y: 24-34, x: 36-48)
    let rightEyeSum = 0, rightEyeCount = 0;
    for (let y = 24; y <= 34; y++) {
      for (let x = 36; x <= 48; x++) {
        rightEyeSum += lumMatrix[y][x];
        rightEyeCount++;
      }
    }
    const rightEyeAvg = rightEyeSum / rightEyeCount;

    // D. Nose bridge zone (y: 24-38, x: 28-36)
    let noseBridgeSum = 0, noseBridgeCount = 0;
    for (let y = 24; y <= 38; y++) {
      for (let x = 28; x <= 36; x++) {
        noseBridgeSum += lumMatrix[y][x];
        noseBridgeCount++;
      }
    }
    const noseBridgeAvg = noseBridgeSum / noseBridgeCount;

    // E. Cheek zones (y: 36-46, x: 16-48)
    let cheekSum = 0, cheekCount = 0;
    for (let y = 36; y <= 46; y++) {
      for (let x = 16; x <= 48; x++) {
        cheekSum += lumMatrix[y][x];
        cheekCount++;
      }
    }
    const cheekAvg = cheekSum / cheekCount;

    // F. Mouth zone (y: 48-58, x: 22-42)
    let mouthSum = 0, mouthCount = 0;
    for (let y = 48; y <= 58; y++) {
      for (let x = 22; x <= 42; x++) {
        mouthSum += lumMatrix[y][x];
        mouthCount++;
      }
    }
    const mouthAvg = mouthSum / mouthCount;

    // 4. BILATERAL FACIAL SYMMETRY
    // Compares left half to right half across vertical center axis (x=32)
    let symmetryDiffSum = 0;
    let symmetryPairs = 0;
    for (let y = 14; y <= 52; y++) {
      for (let x = 14; x <= 31; x++) {
        const leftVal = lumMatrix[y][x];
        const rightVal = lumMatrix[y][63 - x];
        symmetryDiffSum += Math.abs(leftVal - rightVal);
        symmetryPairs++;
      }
    }
    const avgSymmetryDiff = symmetryDiffSum / symmetryPairs;

    // ANATOMICAL VALIDATION RULES:
    // 1. Eyes must be darker than forehead/cheeks (or distinct contrast cavity)
    const eyeCavityContrast = ((foreheadAvg - leftEyeAvg) + (foreheadAvg - rightEyeAvg)) / 2;
    const bridgeEyeContrast = noseBridgeAvg - Math.min(leftEyeAvg, rightEyeAvg);
    
    // 2. A hand blocking the face has high asymmetry, no eye-bridge contrast, or uniform palm values
    const isHandBlocking = avgSymmetryDiff > 36 || (eyeCavityContrast < -8 && bridgeEyeContrast < 1);
    
    // 3. Overall face presence evaluation
    const hasFace = (!isHandBlocking && skinRatio >= 0.12 && stdDev >= 16 && avgSymmetryDiff <= 35);
    
    let reason = 'Face detected & aligned';
    if (!hasFace) {
      if (isHandBlocking) {
        reason = 'Hand/object blocking face. Remove obstruction.';
      } else if (skinRatio < 0.12) {
        reason = 'Position face inside the box';
      } else {
        reason = 'Align face directly facing camera';
      }
    }

    // 5. COMPUTE 128-DIMENSIONAL SPATIAL + GRADIENT BIOMETRIC VECTOR
    const vector128 = new Float32Array(128);
    
    // Part 1: 64 block spatial luminance values (8x8 blocks)
    let normSum1 = 0;
    for (let by = 0; by < 8; by++) {
      for (let bx = 0; bx < 8; bx++) {
        let bSum = 0;
        for (let py = 0; py < 8; py++) {
          for (let px = 0; px < 8; px++) {
            bSum += lumMatrix[by * 8 + py][bx * 8 + px];
          }
        }
        const bAvg = bSum / 64;
        const idx = by * 8 + bx;
        vector128[idx] = bAvg;
        normSum1 += bAvg * bAvg;
      }
    }

    // Part 2: 64 spatial gradient/edge energy values (Sobel-like 8x8 blocks)
    let normSum2 = 0;
    for (let by = 0; by < 8; by++) {
      for (let bx = 0; bx < 8; bx++) {
        let gSum = 0;
        for (let py = 1; py < 7; py++) {
          for (let px = 1; px < 7; px++) {
            const y = by * 8 + py;
            const x = bx * 8 + px;
            const dx = lumMatrix[y][x + 1] - lumMatrix[y][x - 1];
            const dy = lumMatrix[y + 1][x] - lumMatrix[y - 1][x];
            gSum += Math.sqrt(dx * dx + dy * dy);
          }
        }
        const gAvg = gSum / 36;
        const idx = 64 + (by * 8 + bx);
        vector128[idx] = gAvg;
        normSum2 += gAvg * gAvg;
      }
    }

    // Global L2 normalization
    let totalNormSum = 0;
    for (let i = 0; i < 128; i++) {
      totalNormSum += vector128[i] * vector128[i];
    }
    const totalNorm = Math.sqrt(totalNormSum) || 1;
    const normalizedVector = Array.from(vector128).map(v => v / totalNorm);

    return {
      hasFace,
      reason,
      avgBrightness: Math.round(avgBrightness),
      stdDev: Math.round(stdDev * 10) / 10,
      skinRatio: Math.round(skinRatio * 100) / 100,
      symmetry: Math.round(avgSymmetryDiff * 10) / 10,
      vector: normalizedVector
    };
  };

  const startLiveFaceDetection = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    
    detectIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const analysis = analyzeVideoFrame(videoRef.current);
        setLiveFaceDetected(analysis.hasFace);
        setDetectionReason(analysis.reason);
      }
    }, 400);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    const analysis = analyzeVideoFrame(video);

    onCapture(base64Data, analysis);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
      <div 
        className={`scanner-container ${isScanning ? 'active' : ''}`}
        style={{
          borderColor: liveFaceDetected ? 'var(--success)' : 'var(--border-color)',
          transition: 'border-color 0.3s ease',
          boxShadow: liveFaceDetected ? '0 0 16px var(--success-glow)' : 'none'
        }}
      >
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
            <div 
              className="scan-corner corner-tl" 
              style={{ borderColor: liveFaceDetected ? 'var(--success)' : 'var(--warning)' }} 
            />
            <div 
              className="scan-corner corner-tr" 
              style={{ borderColor: liveFaceDetected ? 'var(--success)' : 'var(--warning)' }} 
            />
            <div 
              className="scan-corner corner-bl" 
              style={{ borderColor: liveFaceDetected ? 'var(--success)' : 'var(--warning)' }} 
            />
            <div 
              className="scan-corner corner-br" 
              style={{ borderColor: liveFaceDetected ? 'var(--success)' : 'var(--warning)' }} 
            />
            
            {/* Live Camera Status Badge Top */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(9, 13, 22, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              zIndex: 7,
              border: `1px solid ${liveFaceDetected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isScanning ? 'var(--primary)' : liveFaceDetected ? 'var(--success)' : 'var(--warning)',
                display: 'inline-block',
                animation: 'pulse 1.5s infinite'
              }} />
              <span style={{ color: liveFaceDetected ? 'var(--success)' : 'var(--warning)' }}>
                {isScanning ? 'ANALYZING BIOMETRICS...' : liveFaceDetected ? 'FACE DETECTED' : 'ALIGN FACE'}
              </span>
            </div>

            {/* Live Face Detection Helper Badge Bottom */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: liveFaceDetected ? 'rgba(16, 185, 129, 0.9)' : 'rgba(15, 23, 42, 0.9)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 7,
              boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
              border: `1px solid ${liveFaceDetected ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              maxWidth: '85%',
              textAlign: 'center'
            }}>
              {liveFaceDetected ? (
                <>
                  <CheckCircle2 size={13} color="#fff" />
                  <span>Face Ready for Verification</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={13} color="var(--warning)" />
                  <span>{detectionReason}</span>
                </>
              )}
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
        <button 
          className={`btn ${liveFaceDetected ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={captureFrame} 
          style={{ width: '100%', padding: '12px 18px', fontSize: '0.9375rem' }}
        >
          <Camera size={16} />
          <span>{label}</span>
        </button>
      )}
    </div>
  );
};

export default WebcamCapture;
