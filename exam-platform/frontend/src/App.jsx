import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ExamList from './pages/ExamList';
import ExamRoom from './pages/ExamRoom';
import Results from './pages/Results';
import ExamAnalytics from './pages/ExamAnalytics';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
          <Route path="/exam/:id" element={<ProtectedRoute><ExamRoom /></ProtectedRoute>} />
          <Route path="/exam/:id/analytics" element={<ProtectedRoute><ExamAnalytics /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/exams" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
