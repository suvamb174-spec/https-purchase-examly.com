const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createExam,
  publishExam,
  listExams,
  getExam,
  addQuestion,
} = require('../controllers/examController');

router.use(authenticate);

router.get('/', listExams);
router.get('/:id', getExam);
router.post('/', authorize('instructor', 'admin'), createExam);
router.patch('/:id/publish', authorize('instructor', 'admin'), publishExam);
router.post('/:id/questions', authorize('instructor', 'admin'), addQuestion);

module.exports = router;
