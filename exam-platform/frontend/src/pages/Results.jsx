import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Results() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get('/attempts/my-results').then(({ data }) => setResults(data));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <Link to="/exams">&larr; Back to exams</Link>
      <h2>My Results</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Exam</th>
            <th style={th}>Score</th>
            <th style={th}>Status</th>
            <th style={th}>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.title}</td>
              <td style={td}>{r.score ?? '-'} / {r.total_marks ?? '-'}</td>
              <td style={td}>{r.status}</td>
              <td style={td}>{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!results.length && <p>No attempts yet.</p>}
    </div>
  );
}

const th = { textAlign: 'left', borderBottom: '2px solid #333', padding: 8 };
const td = { borderBottom: '1px solid #ddd', padding: 8 };
