import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

/**
 * Captures the student's webcam via WebRTC (getUserMedia), shows a live preview,
 * periodically snapshots a frame to the server, and logs tab-switch events.
 * This is a client-side capture layer — actual face-presence detection happens
 * server-side or can be swapped in here with a model like face-api.js.
 */
export default function ProctoringMonitor({ attemptId, snapshotIntervalMs = 30000 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('initializing'); // initializing | active | denied | error
  const [flags, setFlags] = useState(0);

  useEffect(() => {
    let snapshotTimer;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('active');
        snapshotTimer = setInterval(captureSnapshot, snapshotIntervalMs);
      } catch (err) {
        console.error('Camera access denied:', err);
        setStatus('denied');
        logEvent('no_face', { reason: 'camera_permission_denied' });
      }
    }

    function captureSnapshot() {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append('snapshot', blob, 'snapshot.jpg');
        try {
          await api.post(`/proctoring/${attemptId}/snapshot`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (err) {
          console.error('Snapshot upload failed:', err);
        }
      }, 'image/jpeg', 0.7);
    }

    function logEvent(event_type, metadata) {
      setFlags((f) => f + 1);
      api.post(`/proctoring/${attemptId}/event`, { event_type, metadata }).catch((err) =>
        console.error('Failed to log proctoring event:', err)
      );
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        logEvent('tab_switch', { hiddenAt: new Date().toISOString() });
      }
    }

    startCamera();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(snapshotTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [attemptId, snapshotIntervalMs]);

  return (
    <div style={styles.container}>
      <video ref={videoRef} autoPlay muted playsInline style={styles.video} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={styles.statusBar}>
        <span>
          {status === 'active' && '🟢 Proctoring active'}
          {status === 'initializing' && '⏳ Starting camera...'}
          {status === 'denied' && '🔴 Camera access denied — exam may be flagged'}
          {status === 'error' && '⚠️ Camera error'}
        </span>
        {flags > 0 && <span style={styles.flagBadge}>{flags} flag(s)</span>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    width: 200,
    background: '#111',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  video: { width: '100%', display: 'block' },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    fontSize: 11,
    color: '#fff',
    background: '#222',
  },
  flagBadge: {
    background: '#dc2626',
    borderRadius: 10,
    padding: '1px 6px',
    fontWeight: 600,
  },
};
