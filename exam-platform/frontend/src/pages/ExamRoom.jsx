import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Timer from '../components/Timer';
import ProctoringMonitor from '../components/ProctoringMonitor';

export default function ExamRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    async function init() {
      const { data: examData } = await api.get(`/exams/${id}`);
      setExam(examData);
      const { data: attemptData } = await api.post(`/attempts/exam/${id}/start`);
      setAttempt(attemptData);
    }
    init();
  }, [id]);

  function handleChange(questionId, value) {
    setResponses((r) => ({ ...r, [questionId]: value }));
    if (attempt) {
      api.post(`/attempts/${attempt.id}/answer`, { question_id: questionId, response: value }).catch(() => {});
    }
  }

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!attempt || submittingRef.current) return;
      submittingRef.current = true;
      const { data } = await api.post(`/attempts/${attempt.id}/submit`, { auto });
      setSubmitted(true);
      setTimeout(() => navigate('/results'), 1500);
      return data;
    },
    [attempt, navigate]
  );

  if (!exam || !attempt) return <p style={{ padding: 40 }}>Loading exam...</p>;
  if (submitted) return <p style={{ padding: 40 }}>✅ Exam submitted! Redirecting to your results...</p>;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif', paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{exam.title}</h2>
        <Timer durationMinutes={exam.duration_minutes} onExpire={() => handleSubmit(true)} />
      </div>

      {exam.questions.map((q, idx) => (
        <div key={q.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <p><strong>Q{idx + 1}.</strong> {q.question_text} <small>({q.marks} mark{q.marks > 1 ? 's' : ''})</small></p>
          {q.type === 'mcq' ? (
            (q.options || []).map((opt, i) => (
              <label key={i} style={{ display: 'block', margin: '4px 0' }}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={i}
                  checked={responses[q.id] === String(i)}
                  onChange={() => handleChange(q.id, String(i))}
                />{' '}
                {opt}
              </label>
            ))
          ) : (
            <textarea
              rows={3}
              style={{ width: '100%' }}
              value={responses[q.id] || ''}
              onChange={(e) => handleChange(q.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <button onClick={() => handleSubmit(false)} style={{ padding: '10px 20px' }}>
        Submit Exam
      </button>

      <ProctoringMonitor attemptId={attempt.id} />
    </div>
  );
}
