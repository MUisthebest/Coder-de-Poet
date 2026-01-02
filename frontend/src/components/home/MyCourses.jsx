import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { authService } from '../../services/authService';
import { getThumbnailUrl } from '../../utils/thumbnailHelper';
import { NavLink } from 'react-router-dom';

const MyCourses = ({ courses: coursesProp = [], user }) => {
  const [courses, setCourses] = useState(coursesProp || []);
  const [loading, setLoading] = useState(true); // Thay đổi: Mặc định là true để hiển thị loading
  const [unenrollingCourseId, setUnenrollingCourseId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true); // Thêm state để theo dõi lần load đầu tiên
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  
  // Sử dụng ref để theo dõi lần fetch cuối cùng
  const lastFetchRef = useRef({
    userId: null,
    timestamp: 0
  });
  
  // Sử dụng ref để tránh fetch lại nếu đang loading
  const isFetchingRef = useRef(false);
  const carouselRef = useRef(null);

  const getPopularTags = (courseTags, limit = 3) => {
    if (!courseTags || !Array.isArray(courseTags)) return [];
    const uniqueTags = [...new Set(courseTags)];
    return uniqueTags.slice(0, limit);
  };

  const formatTag = (tag) => {
      if (!tag) return '';
      const formatted = tag.replace(/-/g, ' ');
      return formatted
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  };

  useEffect(() => {
    console.log("MyCourses useEffect - coursesProp:", coursesProp?.length, "user:", user?.id);
    
    // Nếu có coursesProp từ props và không phải là mảng rỗng, sử dụng chúng
    if (coursesProp && coursesProp.length > 0) {
      console.log("Using courses from props, skipping API fetch");
      setCourses(coursesProp);
      setLoading(false);
      setInitialLoad(false);
      return;
    }

    // Nếu không có user, clear courses và return
    if (!user || !user.id) {
      console.log("No user, clearing courses");
      setCourses([]);
      setLoading(false);
      setInitialLoad(false);
      return;
    }

    // Kiểm tra xem có cần fetch không
    const shouldFetch = 
      !isFetchingRef.current && 
      (lastFetchRef.current.userId !== user.id || 
       Date.now() - lastFetchRef.current.timestamp > 60000); // Cache 1 phút

    if (!shouldFetch) {
      console.log("Skipping fetch - already fetching or recent fetch");
      // Nếu đã có courses từ lần fetch trước, không hiển thị loading
      if (courses.length > 0) {
        setLoading(false);
      }
      setInitialLoad(false);
      return;
    }

    // Hàm fetch courses
    const fetchMyCourses = async () => {
      console.log("Starting fetchMyCourses for user:", user.id);
      
      // Đánh dấu đang fetching
      isFetchingRef.current = true;
      lastFetchRef.current = {
        userId: user.id,
        timestamp: Date.now()
      };
      
      setLoading(true);
      try {
        let data = null;
        const token = authService.getStoredToken();
        if (user && user.role === "Instructor") {
          const res = await axios.get(`${API_URL}/courses/instructor/${user.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          data = res.data;
          console.log("API response:", data);
        }
        else {
          const res = await axios.get(`${API_URL}/enrollments/user/${user.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          data = res.data;
          console.log("API response:", data);
        }

        if (data?.items) data = data.items;
        if (!Array.isArray(data)) {
          if (data?.courses) data = data.courses;
          else if (data?.data) data = data.data;
          else data = [];
        }

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
          tags: c.tag
        }));

        console.log("Mapped courses:", mapped.length);
        setCourses(mapped);
      } catch (err) {
        console.error('Failed to fetch my courses', err);
        setCourses([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
        isFetchingRef.current = false;
      }
    };

    // Gọi hàm fetch
    fetchMyCourses();
    
    // Cleanup function
    return () => {
      console.log("MyCourses cleanup");
      // KHÔNG reset courses ở đây để giữ state khi unmount/remount
    };
  }, [coursesProp, user]); // Chỉ phụ thuộc vào coursesProp và user

  // Hàm hủy đăng ký khóa học
  const handleUnenroll = async (courseId) => {
    if (!user || !user.id) return;
    
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký khóa học này?')) {
      return;
    }

    if(user.role === "Instructor" || user.role === "Admin") return;
    
    setUnenrollingCourseId(courseId);
    try {
      const token = authService.getStoredToken();
      await axios.delete(`${API_URL}/enrollments/unenroll`, {
        data: {
          userId: user.id,
          courseId: courseId,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Cập nhật danh sách courses sau khi hủy đăng ký
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      
      alert('Hủy đăng ký khóa học thành công!');
    } catch (err) {
      console.error('Unenroll failed', err);
      if (err.response?.status === 404) {
        alert('Bạn chưa đăng ký khóa học này');
      } else {
        alert('Hủy đăng ký khóa học thất bại. Vui lòng thử lại.');
      }
    } finally {
      setUnenrollingCourseId(null);
    }
  };

  // Hàm xử lý chuyển đến khóa học tiếp theo
  const goToSlide = (index) => {
    setCurrentIndex(index);
    
    // Nếu click vào dấu gạch cuối (index 3) và vẫn còn khóa học
    if (index === 3 && startIndex + 4 < courses.length) {
      // Chuyển sang nhóm khóa học tiếp theo
      setStartIndex(startIndex + 4);
      setCurrentIndex(0);
    } else if (index === 3 && startIndex + 4 >= courses.length) {
      // Nếu không còn khóa học nữa, quay lại đầu
      setStartIndex(0);
      setCurrentIndex(0);
    }
    
    if (carouselRef.current) {
      const scrollAmount = index * carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Nhóm courses theo category
  const coursesByCategory = courses.reduce((acc, course) => {
    if (!acc[course.category]) {
      acc[course.category] = {
        courses: [],
        totalStudents: 0,
        averageRating: 0
      };
    }
    acc[course.category].courses.push(course);
    acc[course.category].totalStudents += course.students;
    return acc;
  }, {});

  // Tính rating trung bình cho mỗi category
  Object.keys(coursesByCategory).forEach(category => {
    const categoryCourses = coursesByCategory[category].courses;
    const avgRating = categoryCourses.reduce((sum, course) => sum + course.rating, 0) / categoryCourses.length;
    coursesByCategory[category].averageRating = avgRating.toFixed(1);
  });

  console.log("Rendering MyCourses - total courses:", courses.length, "loading:", loading);

  // Lấy tối đa 4 khóa học từ vị trí startIndex
  const displayedCourses = courses.slice(startIndex, startIndex + 4);

  return (
    <div>
      <h3 className="text-[calc(2vh_+_6px)] font-semibold text-gray-900 mb-4">My Courses</h3>

      {loading && initialLoad ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading Course...</span>
        </div>
      ) : !loading && courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Bạn chưa đăng ký khóa học nào.</p>
          <button 
            onClick={() => window.location.href = '/courses'}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Khám phá khóa học
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Carousel Container */}
          <div 
            ref={carouselRef}
            className="flex overflow-x-auto scroll-smooth gap-6 pb-4 snap-x snap-mandatory"
            style={{ 
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}
          >
            <style>{`
              [data-carousel]::-webkit-scrollbar {
                height: 6px;
              }
              [data-carousel]::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 10px;
              }
              [data-carousel]::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 10px;
              }
              [data-carousel]::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
              [data-carousel]::-webkit-scrollbar-button {
                display: none;
              }
            `}</style>
            {displayedCourses.map((course) => (
              <NavLink 
                to={`/courses/${course.id}`}
                key={course.id} 
                className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex-shrink-0 w-full snap-center relative"
              >
                {/* Course Thumbnail */}
                <div className="relative h-40 bg-gradient-to-r from-blue-400 to-blue-600 overflow-hidden">
                  {course.thumbnail ? (
                    <img 
                      src={getThumbnailUrl(course.thumbnail)} 
                      alt={course.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-600">
                      <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747m0-13c5.5 0 10 4.745 10 10.747M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747m0-13c5.5 0 10 4.745 10 10.747" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Progress Badge */}
                  {course.progress > 0 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {course.progress}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Header with title and unenroll button */}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 line-clamp-2">
                      {course.title}
                    </h4>
                    <button
                      onClick={() => handleUnenroll(course.id)}
                      disabled={unenrollingCourseId === course.id}
                      className="ml-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Hủy đăng ký"
                    >
                      {unenrollingCourseId === course.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Category and Students */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {course.category}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 12a6 6 0 11-12 0 6 6 0 0112 0z" />
                      </svg>
                      {course.students.toLocaleString()}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {getPopularTags(course.tags, 2).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex} 
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs text-gray-700 font-medium border border-gray-300 transition-colors"
                        >
                          #{formatTag(tag)}
                        </span>
                      ))}
                      
                      {course.tags && course.tags.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-200 rounded-md text-xs text-gray-600 font-medium">
                          +{course.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {course.progress > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="font-medium">Progress</span>
                        <span className="font-bold text-blue-600">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </NavLink>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-4 w-full">
            {displayedCourses.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 w-[calc(20%)] rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-black w-6' 
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;