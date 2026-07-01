const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  startAttempt,
  saveAnswer,
  submitAttempt,
  examAnalytics,
  myResults,
} = require('../controllers/attemptController');

router.use(authenticate);

router.post('/exam/:examId/start', authorize('student'), startAttempt);
router.post('/:attemptId/answer', authorize('student'), saveAnswer);
router.post('/:attemptId/submit', authorize('student'), submitAttempt);
router.get('/exam/:examId/analytics', authorize('instructor', 'admin'), examAnalytics);
router.get('/my-results', authorize('student'), myResults);

module.exports = router;
