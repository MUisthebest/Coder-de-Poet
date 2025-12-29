// src/components/instructor/InstructorRoute.jsx
import ProtectedRoute from '../admin/ProtectedRoute';
import { InstructorProvider } from '../../contexts/InstructorContext';

const InstructorRoute = ({ children }) => {
  return (
    <ProtectedRoute>
      <InstructorProvider>
        {children}
      </InstructorProvider>
    </ProtectedRoute>
  );
};

export default InstructorRoute;