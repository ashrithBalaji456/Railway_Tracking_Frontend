import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('accessToken');
  const location = useLocation();

  if (!token) {
    // User is not authenticated, redirect to login page preserving current path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
