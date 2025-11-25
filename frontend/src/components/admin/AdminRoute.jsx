// src/components/AdminRoute.jsx
import ProtectedRoute from './ProtectedRoute';
const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requireAdmin={true}>
      {children}
    </ProtectedRoute>
  );
};

export default AdminRoute;