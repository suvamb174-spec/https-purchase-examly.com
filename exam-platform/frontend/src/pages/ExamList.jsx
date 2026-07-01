import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ExamList() {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/exams')
      .then(({ data }) => setExams(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load exams'));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Exams</h2>
        <div>
          <span style={{ marginRight: 12 }}>{user?.name} ({user?.role})</span>
          {user?.role === 'student' && <Link to="/results" style={{ marginRight: 12 }}>My Results</Link>}
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {exams.map((exam) => (
          <li key={exam.id} style={cardStyle}>
            <div>
              <strong>{exam.title}</strong>
              <p style={{ color: '#555', margin: '4px 0' }}>{exam.description}</p>
              <small>{exam.duration_minutes} minutes</small>
            </div>
            {user?.role === 'student' ? (
              <Link to={`/exam/${exam.id}`}>
                <button>Start</button>
              </Link>
            ) : (
              <Link to={`/exam/${exam.id}/analytics`}>
                <button>View Analytics</button>
              </Link>
            )}
          </li>
        ))}
        {!exams.length && <p>No exams available yet.</p>}
      </ul>
    </div>
  );
}

const cardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};
