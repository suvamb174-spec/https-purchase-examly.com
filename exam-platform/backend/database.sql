-- ============================================
-- Online Examination & Proctoring Platform
-- PostgreSQL Schema
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE question_type AS ENUM ('mcq', 'short_answer');
CREATE TYPE proctoring_event_type AS ENUM ('tab_switch', 'no_face', 'multiple_faces', 'snapshot');

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role NOT NULL DEFAULT 'student',
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exams (
    id                SERIAL PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    duration_minutes  INTEGER NOT NULL,
    created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_time        TIMESTAMP,
    end_time          TIMESTAMP,
    is_published      BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questions (
    id            SERIAL PRIMARY KEY,
    exam_id       INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type          question_type NOT NULL DEFAULT 'mcq',
    options       JSONB,              -- e.g. ["A", "B", "C", "D"] for mcq
    correct_answer TEXT,              -- index or text, used for auto-grading
    marks         INTEGER DEFAULT 1,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_attempts (
    id            SERIAL PRIMARY KEY,
    exam_id       INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    student_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    started_at    TIMESTAMP DEFAULT NOW(),
    submitted_at  TIMESTAMP,
    score         NUMERIC(6,2),
    total_marks   NUMERIC(6,2),
    status        VARCHAR(20) DEFAULT 'in_progress', -- in_progress | submitted | auto_submitted
    UNIQUE(exam_id, student_id)
);

CREATE TABLE answers (
    id          SERIAL PRIMARY KEY,
    attempt_id  INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    response    TEXT,
    is_correct  BOOLEAN,
    marks_awarded NUMERIC(6,2) DEFAULT 0,
    UNIQUE(attempt_id, question_id)
);

CREATE TABLE proctoring_events (
    id          SERIAL PRIMARY KEY,
    attempt_id  INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
    event_type  proctoring_event_type NOT NULL,
    snapshot_path TEXT,               -- path/URL to stored image, if applicable
    metadata    JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_attempts_student ON exam_attempts(student_id);
CREATE INDEX idx_proctoring_attempt ON proctoring_events(attempt_id);
