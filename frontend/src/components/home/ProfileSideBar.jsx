import React, { useState } from 'react';
import WeeklyActivity from './WeeklyActivity';
import MyCourses from './MyCourses';
import FriendsList from './FriendsList';
import { useSidebar } from "../../contexts/SidebarContext";
import { authService } from '../../services/authService';
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';

const ProfileSidebar = ({ 
  weeklyActivities, 
  myCourses, 
  friends 
}) => {
  const [activeTab, setActiveTab] = useState('activity');
  const { isOpen, setIsOpen } = useSidebar();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'friends', label: 'Friends' },
    { id: 'activity', label: 'Activity' },
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

  // Nếu đã đăng nhập, hiển thị profile bình thường
  return (
    <div className={`rounded-2xl border-[1px] border-[#aaa] bg-[#E3E3E3] border-[1px] border-[#ccc] overflow-hidden h-[96vh] shadow-lg transition-all duration-300 ${isOpen ? 'w-[8vw]' : 'w-[20vw]'}`}>
      <div className={`px-[1vw]  mt-5 w-full transition-all duration-300  ${isOpen ? ' flex flex-col mb-10 w-full items-center gap-3' : 'absolute  flex flex-row items-self-start  gap-[14vw]'}`}>
        <i className='bxr  bx-bell text-[2vw]'></i>
        <i className='bxr  bx-cog text-[2vw]'></i>  
      </div>
      {/* Profile Header */}
      <div className="bg-[#E3E3E3] h-[32vh] p-6 text-center">
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
        
      {/* Button Logout */}
        <button
          onClick={logout}
          className="mt-2 px-4 mb-4 py-2 border-1 bg-white rounded-2xl text-red-700 text-xs   hover:text-white hover:bg-red-600 font-medium transition all duration-200"
        >
          Logout
        </button>

        {/* Tabs */}
        <div className={`flex bg-gray-100 rounded-lg mb-5 ${isOpen ? 'hidden' : ''}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`bg-[#E3E3E3] p-6 mt-4 h-[60vh] ${isOpen ? 'hidden' : ''}`}>
        {activeTab === 'friends' && (
          <FriendsList friends={friends} />
        )}
        
        {activeTab === 'activity' && (
          <WeeklyActivity activities={weeklyActivities} />
        )}
        
        {activeTab === 'courses' && (
          <MyCourses myCoursesProp={myCourses} user={user} />
        )}
      </div>
    </div>
  );
};


export default ProfileSidebar;