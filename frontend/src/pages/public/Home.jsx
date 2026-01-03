import React, { useState, useEffect, useCallback } from 'react';
import CourseCard from '../../components/home/CourseCard';
import ProfileSidebar from '../../components/home/ProfileSideBar';
import PopularCategories from '../../components/home/PopularCategories';
import CategorySlider from '../../components/home/CategorySlider';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from "../../contexts/SidebarContext";
import { authService } from '../../services/authService';
import axios from 'axios';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const { isOpen, setIsOpen } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popularCourses, setPopularCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [myCourses, setMyCourses] = useState([]); // Thêm state cho courses của user

  const [popularLoading, setPopularLoading] = useState(false);
  const { user, isAuthenticated, getUserRole } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const categoryImages = {
    'python': 'https://cdn-icons-png.flaticon.com/512/5968/5968350.png',
    'python-tutorials': 'https://cdn-icons-png.flaticon.com/512/5968/5968350.png',
    'web-design': 'https://cdn-icons-png.flaticon.com/512/3244/3244367.png',
    'web-development': 'https://cdn-icons-png.flaticon.com/512/2282/2282188.png',
    'computer-science': 'https://cdn-icons-png.flaticon.com/512/2103/2103794.png',
    'software-engineering': 'https://cdn-icons-png.flaticon.com/512/2115/2115955.png',
    'javascript': 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
    'data-science': 'https://cdn-icons-png.flaticon.com/512/2103/2103655.png',
    'internet-of-things': 'https://cdn-icons-png.flaticon.com/512/3094/3094931.png',
    'all': 'https://cdn-icons-png.flaticon.com/512/3037/3037444.png',
  };

  const defaultCategoryImage = 'https://res.cloudinary.com/drjlezbo7/image/upload/v1763998803/menu_13984545_qzoaog.png';

  const extractCoursesFromResponse = (responseData) => {
    if (!responseData) return [];

    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (typeof responseData === "object") {
      if (Array.isArray(responseData?.courses?.items)) {
        return responseData.courses.items;
      }

      if (Array.isArray(responseData?.courses)) {
        return responseData.courses;
      }

      if (Array.isArray(responseData?.items)) {
        return responseData.items;
      }

      if (Array.isArray(responseData?.data)) {
        return responseData.data;
      }
    }

    return [];
  };

    const fetchMyCourses = useCallback(async () => {
    if (!user || !user.id) {
      setMyCourses([]);
      return;
    }

    try {
      const token = authService.getStoredToken();
      let data = null;

      if (user.role === "Instructor") {
        // Instructor: fetch courses của họ tạo
        const res = await axios.get(`${API_URL}/courses/instructor/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        data = res.data;
      } else {
        // Student: fetch courses mà họ đã enroll
        const res = await axios.get(`${API_URL}/enrollments/user/${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        data = res.data;
      }

      // Xử lý data trả về
      if (data?.items) data = data.items;
      if (!Array.isArray(data)) {
        if (data?.courses) data = data.courses;
        else if (data?.data) data = data.data;
        else data = [];
      }

      // Map data
      const mapped = data.map(c => ({
        id: c.id || c.course_id,
        title: c.title || c.name || c.course_title || 'Untitled',
        category: c.category?.name || c.category_name || c.category || 'Uncategorized',
        students: c.student_count || c.students || 0,
        progress: c.completion_percentage || c.progress || 0,
        timeLeft: c.time_left || '',
        nextLesson: c.nextLesson || null,
        thumbnail: c.thumbnail_url || c.thumbnail || '',
        rating: c.rating || 4.5,
        tags: c.tag || []
      }));

      setMyCourses(mapped);
    } catch (err) {
      console.error('Failed to fetch my courses:', err);
      setMyCourses([]);
    } finally {
    }
  }, [API_URL, user]);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);


  // Chỉ chặn scroll trên mobile khi sidebar mở
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    
    if (isMobile && isOpen) {
      // Chỉ chặn scroll trên mobile khi sidebar mở
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Cho phép scroll
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }

    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

useEffect(() => {
  let intervalId;

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/categories`);

      if (response.data?.categories) {
        const allCategory = {
          id: 'all',
          name: 'All',
          slug: 'all',
          image: defaultCategoryImage
        };

        const apiCategories = response.data.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: categoryImages[cat.slug] || defaultCategoryImage,
          description: cat.description
        }));

        setCategories([allCategory, ...apiCategories]);

        // ✅ FETCH THÀNH CÔNG → DỪNG RETRY
        clearInterval(intervalId);
      }
    } catch (err) {
        setError('Failed to load categories. Please try again later.');
        clearInterval(intervalId);
    } finally {
      setIsLoading(false);
    }
  };

  // gọi ngay lần đầu
  fetchCategories();

  // retry mỗi 3s nếu fail
  intervalId = setInterval(fetchCategories, 3000);

  return () => clearInterval(intervalId);
}, [API_URL]);



  useEffect(() => {
    const fetchPopularCourses = async () => {
      setPopularLoading(true);
      try {
        let url = '';
        
        if (activeCategory === 'All') {
          url = `${API_URL}/courses/top?limit=4`;
        } else {
          const categoryObj = categories.find(cat => cat.name === activeCategory);
          if (categoryObj && categoryObj.id !== 'all') {
            url = `${API_URL}/courses/category/${categoryObj.id}/top?limit=4`;
          } else {
            url = `${API_URL}/courses/top?limit=4`;
          }
        }

        const response = await axios.get(url);
        
        let coursesData = extractCoursesFromResponse(response.data);
        
        if (Array.isArray(coursesData) && coursesData.length > 0) {
          const transformedCourses = coursesData.map(course => {
            const courseCategory = categories.find(cat => cat.id === course.category_id);
            
            return {
              id: course.id,
              title: course.title,
              category: activeCategory === 'All' ? (courseCategory?.name || 'Uncategorized') : activeCategory,
              students: course.student_count || 0,
              rating: 4.5,
              instructor: 'Instructor',
              friends: Math.floor(Math.random() * 300) + 50,
              duration: '12h 30m',
              progress: 0,
              featured: false,
              image: course.thumbnail_url || 
                     (courseCategory ? categoryImages[courseCategory.slug] : defaultCategoryImage) || 
                     defaultCategoryImage,
              price: course.access_type === 'premium' ? 'Premium' : 'Free',
              tags: course.tag || [],
              status: course.status
            };
          });
          
          setPopularCourses(transformedCourses);
        } else {
          console.log('No popular courses found');
          setPopularCourses([]);
        }
      } catch (err) {
        console.error('Error fetching popular courses:', err);
        setPopularCourses([]);
      } finally {
        setPopularLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchPopularCourses();
    }
  }, [activeCategory, categories, API_URL]);

  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        let url = `${API_URL}/courses`;
        
        if (activeCategory !== 'All') {
          const categoryObj = categories.find(cat => cat.name === activeCategory);
          if (categoryObj && categoryObj.id !== 'all') {
            url = `${API_URL}/courses/by-category/${categoryObj.id}`;
          }
        }

        const response = await axios.get(url);

        console.log(response.data);

        let coursesData = extractCoursesFromResponse(response.data);

        const transformedCourses = coursesData.map(course => {
          const courseCategory = categories.find(cat => cat.id === course.category_id);

          
          return {
            id: course.id,
            title: course.title,
            category: courseCategory?.name || 'Uncategorized',
            students: course.student_count || 0,
            rating: 4.5,
            instructor: 'Instructor',
            friends: Math.floor(Math.random() * 300) + 50,
            duration: '12h 30m',
            progress: 0,
            featured: false,
            image: course.thumbnail_url || 
                   (courseCategory ? categoryImages[courseCategory.slug] : defaultCategoryImage) || 
                   defaultCategoryImage,
            price: course.access_type === 'premium' ? 'Premium' : 'Free',
            status: course.status,
            description: course.description || '',
            tags: course.tag || [],
            updated_at: course.updated_at
          };
        });
        
        const publishedCourses = transformedCourses.filter(course => course.status === 'published');
        setCourses(publishedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchCourses();
    }
  }, [activeCategory, categories, API_URL]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile View - Chỉ áp dụng chặn scroll khi isOpen trên mobile */}
      <div className={`md:hidden flex flex-col min-h-screen ${isOpen ? 'overflow-hidden fixed inset-0' : ''}`}>
        <div className={`sticky top-0 z-40 bg-white pt-4 pb-2 px-4 shadow-sm ${isOpen ? 'pointer-events-none' : ''}`}>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Invest in your education
          </h1>
          
          <CategorySlider 
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        <div className={`flex-1 px-4 ${isOpen ? 'overflow-hidden pointer-events-none opacity-50' : ''}`}>
          <PopularCategories 
            courses={popularCourses} 
            loading={popularLoading}
            activeCategory={activeCategory}
            showTitle={activeCategory === 'All' ? 'Top Courses' : `Top in ${activeCategory}`}
          />

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {activeCategory === 'All' ? 'All Courses' : `${activeCategory} Courses`}
            </h2>
            
            {coursesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No courses found in "{activeCategory}" category.</p>
                <button 
                  onClick={() => setActiveCategory('All')}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all courses
                </button>
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer hiển thị trên mobile */}
        <footer className={`bg-gray-50 border-t border-gray-200 py-4 px-4 mt-6 ${isOpen ? 'hidden' : ''}`}>
          <h2 className="text-center text-gray-600">© 2024 Learning Platform. All rights reserved.</h2>
        </footer>
      </div>

      {/* Desktop View - Luôn cho phép scroll, không bị ảnh hưởng bởi isOpen */}
      <div className="hidden md:flex mx-auto px-5 flex-row gap-5 max-w-8xl items-start min-h-screen">
        {/* Frame 1: Courses Section */}
        <div className={`flex flex-col flex-1  gap-2 p-6 max-h-screen overflow-y-auto custom-scrollbar ${isOpen ? 'w-[36vw]' : 'w-[66vw]'}`}>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start justify-center">
            <h1 className="md:text-[calc(25px_+_2vw)] text-[calc(15px_+_2vw)] font-bold text-gray-900 mb-4 sm:mb-0 md:ml-0 ml-5">
              Invest in your education
            </h1>
          </div>

          {/* Categories Filter */}
          <CategorySlider 
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
          
          {/* Popular Courses */}
          <PopularCategories 
            courses={popularCourses} 
            loading={popularLoading}
            activeCategory={activeCategory}
            showTitle={activeCategory === 'All' ? 'Top Courses' : `Top in ${activeCategory}`}
          />

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {activeCategory === 'All' ? 'All Courses' : `${activeCategory} Courses`}
            </h2>
            
            {/* Courses Grid */}
            <div className={`${coursesLoading || courses.length === 0 ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 py-3'}`}>
              {coursesLoading ? (
                <div className="col-span-2 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-500">No courses found in "{activeCategory}" category.</p>
                  <button 
                    onClick={() => setActiveCategory('All')}
                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all courses
                  </button>
                </div>
              ) : (                 
                courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Frame 2: Profile Sidebar */}
        <div className="flex h-screen justify-center items-center sticky top-0">
          <ProfileSidebar 
            user={user}
            myCourses={myCourses}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
      
      {/* Global Styles */}
      <style jsx>{`
        @media (min-width: 768px) {
          /* Đảm bảo sidebar sticky */
          .sticky {
            position: -webkit-sticky;
            position: sticky;
            top: 0;
          }
          
          /* Custom scrollbar cho desktop */
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
        }
      `}</style>
    </div>
  );
};

export default Home;