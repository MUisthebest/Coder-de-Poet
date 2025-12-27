// src/components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!user.role === "Instructor") {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;