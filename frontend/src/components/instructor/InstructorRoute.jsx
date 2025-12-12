// src/components/AdminRoute.jsx
import ProtectedRoute from './ProtectedRoute';
const InstructorRoute = ({ children }) => {
  return (
    <ProtectedRoute requireAdmin={true}>
      {children}
    </ProtectedRoute>
  );
};

export default InstructorRoute;