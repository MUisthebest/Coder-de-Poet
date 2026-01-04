import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";

export default function Navigation_Mobile() {
  const { isOpen, setIsOpen } = useSidebar();
  const { user, isAuthenticated, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login page after successful logout
      navigate('/login');
      setIsOpen(false); // Close mobile menu after logout
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
      setIsOpen(false);
    }
  };

  const getNavLinkClasses = ({ isActive }) =>
    `font-medium transition-colors ${
      isActive
        ? "text-indigo-600"
        : "text-gray-700 hover:text-indigo-600"
    }`;

  const getMobileNavLinkClasses = ({ isActive }) =>
    `block py-2 px-4 rounded-md transition-colors ${
      isActive
        ? "text-indigo-600 bg-indigo-50"
        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
    }`;

  const handleMobileLinkClick = () => {
    setIsOpen(false);
  };

  return (
    // NAV CHÍNH (HEADER)
    // CẬP NHẬT: Thêm 'relative' để làm neo cho menu absolute
    <nav className="bg-[#E3E3E3] shadow-lg rounded-3xl p-4 w-full relative">
      {/* CẬP NHẬT: Thêm 'relative z-20' để luôn nổi lên trên menu blur */}
      <div className="container mx-auto flex justify-between items-center relative z-90">
        
        {/* 1. User Avatar - Link to Profile or Login */}
        {isAuthenticated && user ? (
          <NavLink to="/profile" onClick={handleMobileLinkClick}>
            <img
              src={user.avatarUrl || "https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-1/537187856_1444879253437802_3963755224737322732_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=107&ccb=1-7&_nc_sid=e99d92&_nc_ohc=L7OzKlm4yxwQ7kNvwFpE3nB&_nc_oc=Adk-URB0xXkMOoRZRxJKF_yd0nOSjiabcU1vXTkzvkYxHbewcqHrZGgwyYIcIKBAo0c&_nc_zt=24&_nc_ht=scontent.fsgn2-3.fna&_nc_gid=wzfftZI3TpNEWd6-9lQRXw&oh=00_AfiGppeoDDWfCczl-zVpycPpuwCD3VNo1FH5buw2-f4Hlw&oe=691F7CCC"}
              alt="avatar"
              className="object-cover rounded-full h-12 w-12"
            />
          </NavLink>
        ) : (
          <NavLink to="/login" onClick={handleMobileLinkClick}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">?</span>
            </div>
          </NavLink>
        )}

        {/* 2. Menu cho Desktop (md trở lên) */}
        <ul className="hidden md:flex items-center space-x-6">
          <li>
            <NavLink to="/" className={getNavLinkClasses}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/courses" className={getNavLinkClasses}>
              Courses
            </NavLink>
          </li>
          <li>
            <NavLink to="/ide" className={getNavLinkClasses}>
              Coding IDE
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className={getNavLinkClasses}>
              Calendar
            </NavLink>
          </li>
          <li>
            <NavLink to="/setting" className={getNavLinkClasses}>
              Settings
            </NavLink>
          </li>
          
          {/* Desktop Auth Buttons */}
          {isAuthenticated ? (
            <li className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{user?.fullName || user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border-1 bg-white rounded-2xl text-red-700 text-xs hover:text-white hover:bg-red-600 font-medium transition-all duration-200"
              >
                Logout
              </button>
            </li>
          ) : (
            <li className="flex items-center space-x-2">
              <NavLink to="/login" className="text-white hover:underline bg-[#D25D5D] border-[1px] border-gray-800 px-3 py-1.5 rounded-lg text-sm">
                Login
              </NavLink>
              <NavLink to="/signup" className="text-blue-600 hover:underline bg-white border-[1px] border-blue-400 px-3 py-1.5 rounded-lg text-sm">
                Sign Up
              </NavLink>
            </li>
          )}
        </ul>

        {/* 3. Nút Bấm Mobile (Chỉ hiện trên mobile) */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            className="text-gray-700 hover:text-indigo-600 p-2 rounded-full border border-gray-300 hover:border-indigo-300 transition-all duration-200"
            aria-label="Notifications"
          >
            <i className="bx bx-bell text-3xl"></i>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 hover:text-indigo-600 p-2 rounded-md"
            aria-label="Toggle menu"
          >
            <i className={`bx ${isOpen ? 'bx-x' : 'bx-menu'} text-3xl`}></i>
          </button>
        </div>
      </div>

      {/* 4. Menu xổ xuống cho Mobile */}
      <div 
        className={`
          absolute top-0 left-0 w-full h-screen bg-[#EFE9E3]/90 backdrop-blur-sm z-10 
          md:hidden transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
      >
        <ul className="flex flex-col space-y-2 pt-24 px-4">
          <li>
            <NavLink 
              to={`${user === null ? '/' : user.role === "Admin" ? '/admin': user.role === "Instructor" ? '/instructor/dashboard':'/'}`} 
              className={getMobileNavLinkClasses} 
              onClick={handleMobileLinkClick}
            >
              {`${isAdmin ? 'Total': 'Dashboard'}`}
            </NavLink>
          </li>

          <li>
            <NavLink 
              to={`${isAdmin ? '/admin/courses': '/courses'}`} 
              className={getMobileNavLinkClasses} 
              onClick={handleMobileLinkClick}
            >
              {`${isAdmin ? 'Manage Courses': 'Courses'}`}
            </NavLink>
          </li>

          <li>
            <NavLink to="/book" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>
              {`${isAdmin ? 'Manage Library': 'Library'}`}
            </NavLink>
          </li>

          <li>
            <NavLink to="/chat" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>
              Chat
            </NavLink>
          </li>

          <li>
            <NavLink to="/setting" className={getMobileNavLinkClasses} onClick={handleMobileLinkClick}>
              Settings
            </NavLink>
          </li>

          {/* Mobile Auth Buttons */}
          <li className="mt-4 pt-4 border-t border-gray-300">
            {isAuthenticated ? (
              <div className="flex flex-col space-y-2">
                <div className="px-4 py-2 text-gray-700">
                  <p className="font-semibold">{user?.fullName || "User"}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 rounded-md text-red-700 hover:text-white hover:bg-red-600 font-medium transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <NavLink 
                  to="/login" 
                  className={getMobileNavLinkClasses} 
                  onClick={handleMobileLinkClick}
                >
                  Login
                </NavLink>
                <NavLink 
                  to="/signup" 
                  className={getMobileNavLinkClasses} 
                  onClick={handleMobileLinkClick}
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}