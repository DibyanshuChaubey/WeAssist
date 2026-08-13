import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicHome } from './pages/PublicHome';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { EventsDashboard } from './pages/EventsDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminIssuesManagement } from './pages/AdminIssuesManagement';
import { AdminEventsManagement } from './pages/AdminEventsManagement';
import { AdminStudentsManagement } from './pages/AdminStudentsManagement';
import { AssistantPage } from './pages/AssistantPage';
import { FloatingChatbot } from './components/FloatingChatbot';
import { Loader } from 'lucide-react';

function AppContent() {
  const { isLoading } = useAuth();
  
  // Show loading screen while verifying token
  if (isLoading) {
    return (
      <div className="app-shell flex items-center justify-center p-6">
        <div className="ios-surface-strong rounded-[30px] px-10 py-9 text-center animate-float-in">
          <Loader size={44} className="text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-800 text-lg font-semibold tracking-tight">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        {/* Test route */}
        <Route path="/test" element={<div className="p-8 text-center"><h1 className="text-4xl font-bold">React is Working! ✓</h1></div>} />
        
        {/* Public Routes */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Student Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/events"
          element={
            <ProtectedRoute requiredRole="student">
              <EventsDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <AssistantPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/issues"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminIssuesManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEventsManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminStudentsManagement />
            </ProtectedRoute>
          }
        />
      </Routes>
      <FloatingChatbot />
    </div>
  );
}

function App() {
  console.log('App component rendering...');
  
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
