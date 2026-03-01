import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = currentUser?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Block pending verification for students
  if (currentUser?.role === 'student' && currentUser.status === 'pending_verification') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Account Pending Verification</h2>
          <p>Your account is awaiting admin approval. You will be able to access the system once verified.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
