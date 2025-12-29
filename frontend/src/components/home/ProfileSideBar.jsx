import React, { useState } from 'react';
import MyCourses from './MyCourses';
import { useSidebar } from "../../contexts/SidebarContext";
import { authService } from '../../services/authService';
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';

const ProfileSidebar = ({ 
  weeklyActivities, 
  myCourses, 
  friends 
}) => {
  const [activeTab, setActiveTab] = useState('courses');
  const { isOpen, setIsOpen } = useSidebar();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'courses', label: 'My Courses' }
  ];

  // Hiển thị loading state
  if (loading) {
    return (
      <div className={`rounded-2xl bg-[#E3E3E3] overflow-hidden h-[96vh] shadow-lg transition-all duration-300 ${isOpen ? 'w-[8vw]' : 'w-[20vw]'}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị login prompt
  if (!isAuthenticated) {
    return (
      <div className={`rounded-2xl bg-[#E3E3E3] border-[1px] border-[#aaa] overflow-hidden h-[96vh] shadow-lg transition-all duration-300 ${isOpen ? 'w-[8vw]' : 'w-[20vw]'}`}>
        {/* Login Prompt */}
        <div className="bg-[#E3E3E3] h-full p-6 text-center flex flex-col items-center justify-center">
          {/* Default Avatar */}
          <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">?</span>
          </div>
          
          {/* Login Message */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600 text-sm mb-6">Please login to view your profile</p>

          {/* Login Button */}
          <button
            onClick={() => navigate('/login', { state: { from: location } })}
            className="bg-[#FF5656] text-white px-6 py-3 rounded-lg hover:bg-white border-[#FF5656] hover:text-[#FF5656] transition-all duration-300 border-1 transition-colors font-medium"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  console.log('My Courses:', myCourses);

  // Nếu đã đăng nhập, hiển thị profile bình thường
  return (
    <div className={`rounded-2xl border-[1px] border-[#aaa] bg-[#E3E3E3] border-[1px] border-[#ccc] overflow-hidden h-[96vh] shadow-lg transition-all duration-300 ${isOpen ? 'w-[8vw]' : 'w-[20vw]'}`}>
      <div className={`px-[1vw]  mt-5 w-full transition-all duration-300  ${isOpen ? ' flex flex-col mb-10 w-full items-center gap-3' : 'absolute  flex flex-row items-self-start  gap-[14vw]'}`}>
        <i className='bxr  bx-bell text-[2vw]'></i>
        <i className='bxr  bx-cog text-[2vw]'></i>  
      </div>
      {/* Profile Header */}
      <div className="bg-[#E3E3E3] h-[27vh] p-6 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-[calc(1vw_+_2px)] font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
        
        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {user?.fullName || 'User'}
        </h2>

        <h4 className={`text-l text-gray-800 ${isOpen ? 'hidden' : ''}`}>{user?.email}</h4>
        
      {/* Button Logout */}
        <button
          onClick={logout}
          className="mt-2 px-4 mb-4 py-2 border-1 bg-white rounded-2xl text-red-700 text-xs   hover:text-white hover:bg-red-600 font-medium transition all duration-200"
        >
          Logout
        </button>
      </div>

      {/* Tab Content */}
      <div className={`bg-[#E3E3E3] p-6 mt-1 h-[62vh] ${isOpen ? 'hidden' : ''}`}>
        <MyCourses myCoursesProp={myCourses} user={user} />
      </div>
    </div>
  );
};


export default ProfileSidebar;