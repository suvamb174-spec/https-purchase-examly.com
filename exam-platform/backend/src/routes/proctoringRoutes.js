const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload, logEvent, uploadSnapshot, listEvents } = require('../controllers/proctoringController');

router.use(authenticate);

router.post('/:attemptId/event', authorize('student'), logEvent);
router.post('/:attemptId/snapshot', authorize('student'), upload.single('snapshot'), uploadSnapshot);
router.get('/:attemptId/events', authorize('instructor', 'admin'), listEvents);

module.exports = router;
