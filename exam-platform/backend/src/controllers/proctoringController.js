const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/db');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'snapshots');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${req.params.attemptId}-${Date.now()}${path.extname(file.originalname) || '.jpg'}`;
    cb(null, unique);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Log a non-image proctoring event (tab switch, no_face, multiple_faces)
async function logEvent(req, res) {
  try {
    const { attemptId } = req.params;
    const { event_type, metadata } = req.body;
    if (!['tab_switch', 'no_face', 'multiple_faces'].includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event_type' });
    }
    const result = await pool.query(
      `INSERT INTO proctoring_events (attempt_id, event_type, metadata)
       VALUES ($1, $2, $3) RETURNING *`,
      [attemptId, event_type, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log proctoring event' });
  }
}

// Upload a webcam snapshot (periodic capture)
async function uploadSnapshot(req, res) {
  try {
    const { attemptId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const relPath = `/uploads/snapshots/${req.file.filename}`;
    const result = await pool.query(
      `INSERT INTO proctoring_events (attempt_id, event_type, snapshot_path)
       VALUES ($1, 'snapshot', $2) RETURNING *`,
      [attemptId, relPath]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload snapshot' });
  }
}

async function listEvents(req, res) {
  try {
    const { attemptId } = req.params;
    const result = await pool.query(
      'SELECT * FROM proctoring_events WHERE attempt_id = $1 ORDER BY created_at',
      [attemptId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

module.exports = { upload, logEvent, uploadSnapshot, listEvents };
