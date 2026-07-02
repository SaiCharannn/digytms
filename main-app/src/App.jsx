import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ProfilePage from './pages/ProfilePage';
import StudentsPage from './pages/StudentsPage';
import StudentRegisterPage from './pages/StudentRegisterPage';

import CourseListPage from './pages/enrollment/CourseListPage';
import CoursePreviewPage from './pages/enrollment/CoursePreviewPage';
import EnrollPage from './pages/enrollment/EnrollPage';
import MyEnrollmentsPage from './pages/enrollment/MyEnrollmentsPage';
import OperatorDashboardPage from './pages/enrollment/OperatorDashboardPage';
import CourseDetailPage from './pages/enrollment/CourseDetailPage';

// ── Numbering Patterns ──
import NumberingPatternsPage from './pages/numbering/NumberingPatternsPage';
import NumberingPatternFormPage from './pages/numbering/NumberingPatternFormPage';
import NumberingPatternDetailsPage from './pages/numbering/NumberingPatternDetailsPage';

function ProtectedRoute({ children, superAdminOnly }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (superAdminOnly && user && !user.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<StudentRegisterPage />} />

      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute superAdminOnly><ManageUsersPage /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/courses" element={<ProtectedRoute><CourseListPage /></ProtectedRoute>} />
      <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
      <Route path="/courses/:courseId/preview" element={<ProtectedRoute><CoursePreviewPage /></ProtectedRoute>} />
      <Route path="/courses/:courseId/enroll" element={<ProtectedRoute><EnrollPage /></ProtectedRoute>} />
      <Route path="/my-enrollments" element={<ProtectedRoute><MyEnrollmentsPage /></ProtectedRoute>} />
      <Route path="/operator-dashboard" element={<ProtectedRoute><OperatorDashboardPage /></ProtectedRoute>} />

      {/* Numbering Patterns — superAdminOnly is optional, remove if any staff should manage these */}
      <Route path="/numbering" element={<ProtectedRoute superAdminOnly><NumberingPatternsPage /></ProtectedRoute>} />
      <Route path="/numbering/new" element={<ProtectedRoute superAdminOnly><NumberingPatternFormPage /></ProtectedRoute>} />
      <Route path="/numbering/:id" element={<ProtectedRoute superAdminOnly><NumberingPatternDetailsPage /></ProtectedRoute>} />
      <Route path="/numbering/:id/edit" element={<ProtectedRoute superAdminOnly><NumberingPatternFormPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}