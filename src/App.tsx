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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="text-center">
          <Loader size={48} className="text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
