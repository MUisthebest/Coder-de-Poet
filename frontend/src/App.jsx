import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation_PC from "./components/layout/NavigationPC";
import Navigation_Mobile from "./components/layout/NavigationMobile";
import Home from "./pages/public/Home";
import SignIn from "./pages/auth/Signin";
import SignUp from './pages/auth/Signup';
import { SidebarProvider } from "./contexts/SidebarContext";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
      <AuthProvider>
        <SidebarProvider>
          <div className="flex flex-col md:flex-row md:items-center min-h-screen md:h-screen md:px-5 bg-[color(var(--bg-color))] text-[color(var(--text-color))]">
            
            <div className="block md:hidden w-full p-2">
              <Navigation_Mobile />
            </div>
            <div className="hidden md:block">
              <Navigation_PC />
            </div>
            
            <main className="flex-1 w-full md:px-0 md:h-[96vh]">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                {/* Thêm các route khác nếu cần */}
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </AuthProvider>
  );
}

export default App;