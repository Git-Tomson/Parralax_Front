import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';

import LoginPage from 'src/pages/auth/LoginPage';
import RegisterPage from 'src/pages/auth/RegisterPage';
import AppLayout from 'src/components/layout/AppLayout';

import ChercheurDashboard from 'src/pages/chercheur/ChercheurDashboard';
import ImportPage from 'src/pages/chercheur/ImportPage';
import ProgrammeDetailPage from 'src/pages/chercheur/ProgrammeDetailPage';

import ClusterDashboard from 'src/pages/gestionnaire/ClusterDashboard';
import NodeDetailPage from 'src/pages/gestionnaire/NodeDetailPage';
import AdminProgrammesPage from 'src/pages/gestionnaire/AdminProgrammesPage';
import AdminProgrammeDetailPage from 'src/pages/gestionnaire/AdminProgrammeDetailPage';

const CHERCHEUR_ROLES = new Set(['chercheur', 'etudiant']);

function getHomeRoute(role) {
  return role === 'gestionnaire' ? '/cluster' : '/dashboard';
}

function PrivateRoute({ children, allowedRole }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-400 text-sm">Chargement de PARALLAX…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // allowedRole peut être 'chercheur' (accepte chercheur + etudiant) ou 'gestionnaire'
  if (allowedRole) {
    const allowed =
      allowedRole === 'chercheur'
        ? CHERCHEUR_ROLES.has(user?.role)
        : user?.role === allowedRole;
    if (!allowed) {
      return <Navigate to={getHomeRoute(user?.role)} replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        {/* Routes chercheur + etudiant */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRole="chercheur">
              <ChercheurDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/programmes/import"
          element={
            <PrivateRoute allowedRole="chercheur">
              <ImportPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/programmes/:id"
          element={
            <PrivateRoute allowedRole="chercheur">
              <ProgrammeDetailPage />
            </PrivateRoute>
          }
        />

        {/* Routes gestionnaire */}
        <Route
          path="/cluster"
          element={
            <PrivateRoute allowedRole="gestionnaire">
              <ClusterDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/cluster/nodes/:uuid"
          element={
            <PrivateRoute allowedRole="gestionnaire">
              <NodeDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cluster/programmes"
          element={
            <PrivateRoute allowedRole="gestionnaire">
              <AdminProgrammesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cluster/programmes/:id"
          element={
            <PrivateRoute allowedRole="gestionnaire">
              <AdminProgrammeDetailPage />
            </PrivateRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
