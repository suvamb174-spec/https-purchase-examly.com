import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function ExamAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get(`/attempts/exam/${id}/analytics`).then(({ data }) => setAnalytics(data));
  }, [id]);

  if (!analytics) return <p style={{ padding: 40 }}>Loading analytics...</p>;
  const { summary, flagged_attempts } = analytics;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <Link to="/exams">&larr; Back to exams</Link>
      <h2>Result Analytics</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Stat label="Attempts" value={summary.attempts} />
        <Stat label="Average" value={Number(summary.avg_score || 0).toFixed(1)} />
        <Stat label="Highest" value={summary.max_score ?? '-'} />
        <Stat label="Lowest" value={summary.min_score ?? '-'} />
      </div>

      <h3>⚠️ Flagged Attempts (proctoring)</h3>
      {flagged_attempts.length ? (
        <ul>
          {flagged_attempts.map((f) => (
            <li key={f.attempt_id}>
              Attempt #{f.attempt_id} — Student #{f.student_id} — {f.flag_count} flag(s)
            </li>
          ))}
        </ul>
      ) : (
        <p>No flagged attempts.</p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
    </div>
  );
}
