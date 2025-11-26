import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation_PC from "./components/layout/NavigationPC";
import Navigation_Mobile from "./components/layout/NavigationMobile";
import Home from "./pages/public/Home";
import SignIn from "./pages/auth/Signin";
import SignUp from './pages/auth/Signup';
import Unauthorized from './pages/auth/Unauthorized';
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminRoute from './components/admin/AdminRoute';
import { SidebarProvider } from "./contexts/SidebarContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Component để xử lý redirect dựa trên role
function RoleBasedRedirect() {
  const { isAdmin, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  // Nếu là admin → redirect đến /admin
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // Nếu là user thường → redirect đến home
  return <Navigate to="/" replace />;
}

function Layout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Ẩn navigation ở trang login, signup
  const hideNavigation = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="flex flex-col md:flex-row md:items-center min-h-screen md:h-screen md:px-5 bg-[color(var(--bg-color))] text-[color(var(--text-color))] overflow-hidden">
      
      {!hideNavigation && (
        <>
          <div className="block md:hidden w-full p-2">
            <Navigation_Mobile />
          </div>
          <div className="hidden md:block">
            <Navigation_PC />
          </div>
        </>
      )}

      <main className="flex-1 w-full md:px-0 md:h-[100vh] overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected admin routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          <Route 
            path="/admin/courses" 
            element={
              <AdminRoute>
                <AdminCourses />
              </AdminRoute>
            } 
          />
          
          {/* Catch all route - redirect dựa trên role */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={`${process.env.clientId}`}>
        <AuthProvider>
          <SidebarProvider>
            <Layout />
          </SidebarProvider>
        </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;