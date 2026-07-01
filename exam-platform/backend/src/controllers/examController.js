const pool = require('../config/db');

// Instructor/Admin: create an exam
async function createExam(req, res) {
  try {
    const { title, description, duration_minutes, start_time, end_time } = req.body;
    if (!title || !duration_minutes) {
      return res.status(400).json({ error: 'title and duration_minutes are required' });
    }
    const result = await pool.query(
      `INSERT INTO exams (title, description, duration_minutes, created_by, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || null, duration_minutes, req.user.id, start_time || null, end_time || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
}

async function publishExam(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE exams SET is_published = TRUE WHERE id = $1 AND created_by = $2 RETURNING *`,
      [id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Exam not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to publish exam' });
  }
}

// Students see only published exams; instructors see their own
async function listExams(req, res) {
  try {
    let query, params;
    if (req.user.role === 'student') {
      query = `SELECT id, title, description, duration_minutes, start_time, end_time
                FROM exams WHERE is_published = TRUE ORDER BY created_at DESC`;
      params = [];
    } else {
      query = `SELECT * FROM exams WHERE created_by = $1 ORDER BY created_at DESC`;
      params = [req.user.id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
}

// Get exam + questions (hide correct_answer for students)
async function getExam(req, res) {
  try {
    const { id } = req.params;
    const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [id]);
    if (!examResult.rows.length) return res.status(404).json({ error: 'Exam not found' });

    const fields = req.user.role === 'student'
      ? 'id, question_text, type, options, marks'
      : '*';
    const questionsResult = await pool.query(
      `SELECT ${fields} FROM questions WHERE exam_id = $1 ORDER BY id`,
      [id]
    );
    res.json({ ...examResult.rows[0], questions: questionsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
}

async function addQuestion(req, res) {
  try {
    const { id } = req.params; // exam id
    const { question_text, type, options, correct_answer, marks } = req.body;
    if (!question_text) return res.status(400).json({ error: 'question_text is required' });

    const result = await pool.query(
      `INSERT INTO questions (exam_id, question_text, type, options, correct_answer, marks)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, question_text, type || 'mcq', JSON.stringify(options || []), correct_answer || null, marks || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add question' });
  }
}

module.exports = { createExam, publishExam, listExams, getExam, addQuestion };
