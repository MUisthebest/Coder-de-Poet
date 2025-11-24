import React, { useState } from 'react';
import WeeklyActivity from './WeeklyActivity';
import MyCourses from './MyCourses';
import FriendsList from './FriendsList';
import { useSidebar } from "../../contexts/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';

const ProfileSidebar = ({ 
  weeklyActivities, 
  myCourses, 
  friends 
}) => {
  const [activeTab, setActiveTab] = useState('activity');
  const { isOpen, setIsOpen } = useSidebar();
  const { user, isAuthenticated, loading } = useAuth();
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
      <div className={`rounded-2xl bg-[#EFE9E3] overflow-hidden h-[96vh] shadow-lg transition-all duration-300 ${isOpen ? 'w-[8vw]' : 'w-[20vw]'}`}>
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
      <div className={`rounded-2xl bg-[#EFE9E3] overflow-hidden h-[96vh] shadow-lg transition-all duration-300 ${isOpen ? 'w-[8vw]' : 'w-[20vw]'}`}>
        {/* Login Prompt */}
        <div className="bg-[#EFE9E3] h-full p-6 text-center flex flex-col items-center justify-center">
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
    <div className={`rounded-2xl bg-[#EFE9E3] overflow-hidden h-[96vh] shadow-lg transition-all duration-300 ${isOpen ? 'w-[8vw]' : 'w-[20vw]'}`}>
      {/* Profile Header */}
      <div className="bg-[#EFE9E3] h-[32vh] p-6 text-center">
        {/* Avatar */}
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </span>
        </div>
        
        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {user?.name || 'User'}
        </h2>
        
        {/* Friends Count */}
        <div className="text-gray-600 mb-4">274 Friends</div>

        {/* Tabs */}
        <div className={`flex bg-gray-100 rounded-lg p-1 ${isOpen ? 'hidden' : ''}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`bg-[#EFE9E3] p-6 h-[60vh] ${isOpen ? 'hidden' : ''}`}>
        {activeTab === 'friends' && (
          <FriendsList friends={friends} />
        )}
        
        {activeTab === 'activity' && (
          <WeeklyActivity activities={weeklyActivities} />
        )}
        
        {activeTab === 'courses' && (
          <MyCourses courses={myCourses} />
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar;