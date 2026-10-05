import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    // User is not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
