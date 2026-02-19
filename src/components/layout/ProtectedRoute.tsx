import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Layout } from './Layout';

interface ProtectedRouteProps {
  adminOnly?: boolean;
  noLayout?: boolean;
}

export function ProtectedRoute({ adminOnly = false, noLayout = false }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, isPlatformAdmin, company } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // New user with no company yet — send to onboarding (unless already heading there)
  if (!noLayout && !company && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (adminOnly && !isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (noLayout) {
    return <Outlet />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
