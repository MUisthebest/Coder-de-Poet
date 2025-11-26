import React, { useState, useEffect } from 'react';
import CourseCard from '../../components/home/CourseCard';
import ProfileSidebar from '../../components/home/ProfileSideBar';
import PopularCategories from '../../components/home/PopularCategories';
import { useAuth } from '../../contexts/AuthContext';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const { user, isAuthenticated, getUserRole } = useAuth();

  const categories = [
    {
      id: 0,
      name: 'All',
      image: 'https://res.cloudinary.com/drjlezbo7/image/upload/v1763998803/menu_13984545_qzoaog.png'
    },
    {
      id: 1,
      name: 'Internet of Things',
      image: 'https://res.cloudinary.com/drjlezbo7/image/upload/v1764001094/iot_1185915_vnnpug.png'
    },
    {
      id: 2,
      name: 'Data Science',
      image: 'https://res.cloudinary.com/drjlezbo7/image/upload/v1764001094/data-science_9304571_umtgjl.png'
    }
  ];

  const courses = [
    {
      id: 1,
      title: 'Crawler with Python for Beginners',
      category: 'Data Science',
      students: 9530,
      rating: 4.9,
      instructor: 'Annette Black',
      friends: 274,
      duration: '12h 30m',
      progress: 75,
      featured: false
    },
    {
      id: 2,
      title: 'Ardunio for Beginners',
      category: 'Internet of Things',
      students: 8500,
      rating: 3.5,
      instructor: 'John Smith',
      friends: 128,
      duration: '8h 15m',
      progress: 45,
      featured: false
    },
    {
      id: 3,
      title: 'Machine Learning A-Z™: Hands-On Python & R In Data Science',
      category: 'Data Science',
      students: 15000,
      rating: 4.7,
      instructor: 'Mike Johnson',
      friends: 315,
      duration: '15h 20m',
      progress: 90,
      featured: false
    },
    {
      id: 4,
      title: 'ESP32 with Interior Design Projects',
      category: 'Internet of Things',
      students: 6735,
      rating: 4.8,
      instructor: 'Sarah Wilson',
      friends: 189,
      duration: '6h 45m',
      progress: 30,
      featured: false
    },
    {
      id: 5,
      title: 'Data Analysis with Python and Pandas',
      category: 'Data Science',
      students: 9530,
      rating: 4.8,
      instructor: 'David Brown',
      friends: 421,
      duration: '25h 10m',
      progress: 60,
      featured: true
    }
  ];

  // Dữ liệu hoạt động trong tuần
  const weeklyActivities = [
    { day: 'Mon', hours: 2.5, type: 'learning' },
    { day: 'Tue', hours: 1.8, type: 'practice' },
    { day: 'Wed', hours: 3.2, type: 'learning' },
    { day: 'Thu', hours: 2.0, type: 'project' },
    { day: 'Fri', hours: 4.1, type: 'learning' },
    { day: 'Sat', hours: 1.5, type: 'review' },
    { day: 'Sun', hours: 2.8, type: 'practice' }
  ];

  // Khóa học của bạn
  const myCourses = [
    {
      id: 1,
      title: 'Crawler with Python for Beginners',
      category: 'Data Science',
      progress: 85,
      students: 9530,
      nextLesson: 'State Management',
      timeLeft: '2h 15m'
    },
    {
      id: 2,
      title: 'Ardunio for Beginners',
      category: 'Internet of Things',
      progress: 60,
      students: 8500,
      nextLesson: 'Market Analysis',
      timeLeft: '4h 30m'
    },
    {
      id: 3,
      title: 'Machine Learning A-Z™: Hands-On Python & R In Data Science',
      category: 'Data Science',
      progress: 45,
      students: 15000,
      nextLesson: 'SEO Basics',
      timeLeft: '6h 45m'
    }
  ];

  // Bạn bè đang học
  const friends = [
    { id: 1, name: 'Alex Johnson', course: 'React Native' },
    { id: 2, name: 'Maria Garcia', course: 'UI/UX Design' },
    { id: 3, name: 'Tom Wilson', course: 'Data Science' },
    { id: 4, name: 'Sarah Chen', course: 'Web Development' },
    { id: 5, name: 'Mike Brown', course: 'Cloud Computing' }
  ];

  const filteredCourses = activeCategory === 'All' 
    ? courses 
    : courses.filter(course => course.category === activeCategory);

  // Lấy thêm ảnh của category từ categories để hiển thị trên nút
  filteredCourses.forEach(course => {
    const category = categories.find(cat => cat.name === course.category);
    if (category) {
      course.image = category.image;
    }
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="mx-auto sm:px-5 flex flex-row gap-5 max-w-8xl align-center items-center">
        {/* Frame 1: Courses Section */}
        <div className='flex flex-col md:w-[66vw] w-full pt-4 pb-8 gap-8 overflow-y-auto custom-scrollbar p-0 md:p-2' style={{ maxHeight: '90vh' }}>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h1 className="md:text-[calc(25px_+_2vw)] text-[calc(15px_+_2vw)] font-bold text-gray-900 mb-4 sm:mb-0 md:ml-0 ml-5">
              Invest in your education
            </h1>
            
            {/* Hiển thị user info nếu đã login */}
            {isAuthenticated && (
              <div className="bg-green-100 px-4 py-2 rounded-full">
                <span className="text-green-800 font-medium">
                  👋 Welcome, {user?.fullName || user?.email}!
                </span>
              </div>
            )}
          </div>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-3 max-w-full mb-4 px-2 max-h-[15vh]">
            {categories.map(({name, image}) => (
              <button
                key={name}
                className={`px-1 py-1 rounded-full items-center justify-center border flex gap-1 flex-row transition-colors ${
                  activeCategory === name
                    ? 'bg-[#333] text-white border-white'
                    : 'bg-[#EFE9E3] text-gray-600 border-gray-300 hover:border-blue-600'
                }`}
                onClick={() => setActiveCategory(name)}
              >
              <div
                className="md:h-[calc(2vw+10px)] h-[calc(5vw+10px)]  rounded-full flex items-center justify-center bg-white"
              >
                <img src={image} className="h-full w-auto object-contain" />
              </div>
                <p className='md:text-[calc(1vw_+_5px)] text-[calc(1vw_+_7px)] px-3 font-bold'>{name}</p>
              </button>
            ))}
          </div>

          {/* Modular Ratings */}
          <PopularCategories courses={filteredCourses} />

          {/* Courses Grid */}
          <div className="space-y-6 ">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Frame 2: Profile Sidebar */}
        <div className="flex-1 flex h-screen justify-center items-center md:flex hidden">
          <ProfileSidebar 
            weeklyActivities={weeklyActivities}
            myCourses={myCourses}
            friends={friends}
            user={user}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.3);
          border-radius: 10px;
          margin: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 10px;
          border: 1px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.3);
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
};

export default Home;