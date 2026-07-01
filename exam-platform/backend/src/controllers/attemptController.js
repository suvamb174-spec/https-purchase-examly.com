const pool = require('../config/db');

// Student starts an attempt
async function startAttempt(req, res) {
  try {
    const { examId } = req.params;
    const existing = await pool.query(
      'SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2',
      [examId, req.user.id]
    );
    if (existing.rows.length) {
      return res.json(existing.rows[0]); // resume existing attempt
    }
    const totalMarksResult = await pool.query(
      'SELECT COALESCE(SUM(marks), 0) AS total FROM questions WHERE exam_id = $1',
      [examId]
    );
    const result = await pool.query(
      `INSERT INTO exam_attempts (exam_id, student_id, total_marks)
       VALUES ($1, $2, $3) RETURNING *`,
      [examId, req.user.id, totalMarksResult.rows[0].total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start attempt' });
  }
}

// Student saves/updates an answer during the exam
async function saveAnswer(req, res) {
  try {
    const { attemptId } = req.params;
    const { question_id, response } = req.body;

    const attempt = await pool.query('SELECT * FROM exam_attempts WHERE id = $1 AND student_id = $2', [
      attemptId,
      req.user.id,
    ]);
    if (!attempt.rows.length) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.rows[0].status !== 'in_progress') {
      return res.status(400).json({ error: 'Exam already submitted' });
    }

    await pool.query(
      `INSERT INTO answers (attempt_id, question_id, response)
       VALUES ($1, $2, $3)
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET response = EXCLUDED.response`,
      [attemptId, question_id, response]
    );
    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save answer' });
  }
}

// Auto-grade MCQs and finalize the attempt
async function submitAttempt(req, res) {
  try {
    const { attemptId } = req.params;
    const attemptResult = await pool.query(
      'SELECT * FROM exam_attempts WHERE id = $1 AND student_id = $2',
      [attemptId, req.user.id]
    );
    if (!attemptResult.rows.length) return res.status(404).json({ error: 'Attempt not found' });
    const attempt = attemptResult.rows[0];
    if (attempt.status !== 'in_progress') {
      return res.json(attempt); // already submitted
    }

    const answers = await pool.query(
      `SELECT a.*, q.correct_answer, q.marks, q.type
       FROM answers a JOIN questions q ON a.question_id = q.id
       WHERE a.attempt_id = $1`,
      [attemptId]
    );

    let score = 0;
    for (const ans of answers.rows) {
      let isCorrect = false;
      let awarded = 0;
      if (ans.type === 'mcq' && ans.correct_answer !== null) {
        isCorrect = String(ans.response).trim() === String(ans.correct_answer).trim();
        awarded = isCorrect ? ans.marks : 0;
      }
      // short_answer questions are left for manual review (awarded stays 0 until graded)
      score += awarded;
      await pool.query(
        'UPDATE answers SET is_correct = $1, marks_awarded = $2 WHERE id = $3',
        [isCorrect, awarded, ans.id]
      );
    }

    const status = req.body.auto ? 'auto_submitted' : 'submitted';
    const updated = await pool.query(
      `UPDATE exam_attempts SET score = $1, submitted_at = NOW(), status = $2 WHERE id = $3 RETURNING *`,
      [score, status, attemptId]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit attempt' });
  }
}

// Result analytics for an exam (instructor view)
async function examAnalytics(req, res) {
  try {
    const { examId } = req.params;
    const stats = await pool.query(
      `SELECT
         COUNT(*) AS attempts,
         AVG(score) AS avg_score,
         MAX(score) AS max_score,
         MIN(score) AS min_score
       FROM exam_attempts WHERE exam_id = $1 AND status != 'in_progress'`,
      [examId]
    );
    const flagged = await pool.query(
      `SELECT ea.id AS attempt_id, ea.student_id, COUNT(pe.id) AS flag_count
       FROM exam_attempts ea
       JOIN proctoring_events pe ON pe.attempt_id = ea.id
       WHERE ea.exam_id = $1 AND pe.event_type != 'snapshot'
       GROUP BY ea.id, ea.student_id
       ORDER BY flag_count DESC`,
      [examId]
    );
    res.json({ summary: stats.rows[0], flagged_attempts: flagged.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

// Student's own results
async function myResults(req, res) {
  try {
    const result = await pool.query(
      `SELECT ea.id, ea.score, ea.total_marks, ea.status, ea.submitted_at, e.title
       FROM exam_attempts ea JOIN exams e ON ea.exam_id = e.id
       WHERE ea.student_id = $1 ORDER BY ea.started_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
}

module.exports = { startAttempt, saveAnswer, submitAttempt, examAnalytics, myResults };
