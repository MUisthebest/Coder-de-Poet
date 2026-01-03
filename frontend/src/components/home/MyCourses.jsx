import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { authService } from '../../services/authService';
import { getThumbnailUrl } from '../../utils/thumbnailHelper';
import { NavLink } from 'react-router-dom';

const MyCourses = ({ courses: coursesProp = [], user }) => {
  // Sử dụng trực tiếp coursesProp, không cần state nội bộ
  const courses = coursesProp;
  
  const [unenrollingCourseId, setUnenrollingCourseId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  
  // State để lưu thumbnails riêng
  const [courseThumbnails, setCourseThumbnails] = useState({});
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  
  const carouselRef = useRef(null);
  const thumbnailCacheRef = useRef({});

  // Memoize các hàm helper
  const getPopularTags = useCallback((courseTags, limit = 3) => {
    if (!courseTags || !Array.isArray(courseTags)) return [];
    const uniqueTags = [...new Set(courseTags)];
    return uniqueTags.slice(0, limit);
  }, []);

  const formatTag = useCallback((tag) => {
    if (!tag) return '';
    const formatted = tag.replace(/-/g, ' ');
    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  // Hàm fetch thumbnails
  const fetchCourseThumbnails = useCallback(async (courseList) => {
    if (!courseList || courseList.length === 0) return;

    const thumbnailPromises = courseList.map(async (course) => {
      const courseId = course.id;
      
      // Kiểm tra cache trước
      if (thumbnailCacheRef.current[courseId] && 
          Date.now() - thumbnailCacheRef.current[courseId].timestamp < 30000) {
        return { courseId, thumbnail: thumbnailCacheRef.current[courseId].url };
      }
      
      try {
        const token = authService.getStoredToken();
        const response = await axios.get(`${API_URL}/courses/${courseId}/thumbnail`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        
        const thumbnailUrl = response.data.thumbnail_url || course.thumbnail;
        
        // Lưu vào cache
        thumbnailCacheRef.current[courseId] = {
          url: thumbnailUrl,
          timestamp: Date.now()
        };
        
        return { courseId, thumbnail: thumbnailUrl };
      } catch (error) {
        console.error(`Failed to fetch thumbnail for course ${courseId}:`, error);
        return { courseId, thumbnail: course.thumbnail || '' };
      }
    });

    try {
      const results = await Promise.allSettled(thumbnailPromises);
      const newThumbnails = {};
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          newThumbnails[result.value.courseId] = result.value.thumbnail;
        }
      });
      
      setCourseThumbnails(prev => ({ ...prev, ...newThumbnails }));
    } catch (error) {
      console.error('Error fetching thumbnails:', error);
    }
  }, [API_URL]);

  // Fetch thumbnails khi courses thay đổi
  useEffect(() => {
    if (courses && courses.length > 0) {
      fetchCourseThumbnails(courses);
    }
  }, [courses, fetchCourseThumbnails]);

  // Theo dõi sự thay đổi của thumbnails
  useEffect(() => {
    if (!courses || courses.length === 0) return;

    const checkThumbnailUpdates = async () => {
      const coursesNeedingUpdate = courses.filter(course => {
        const courseId = course.id;
        const cacheEntry = thumbnailCacheRef.current[courseId];
        
        return !cacheEntry || (Date.now() - cacheEntry.timestamp > 10000);
      });

      if (coursesNeedingUpdate.length > 0) {
        await fetchCourseThumbnails(coursesNeedingUpdate);
      }
    };

    // Kiểm tra mỗi 5 giây
    const interval = setInterval(checkThumbnailUpdates, 5000);

    // Lắng nghe storage events
    const handleStorageChange = (e) => {
      if (e.key?.includes('thumbnail') || e.key?.includes('course')) {
        thumbnailCacheRef.current = {};
        checkThumbnailUpdates();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [courses, fetchCourseThumbnails]);

  // Hàm refresh thumbnail cụ thể
  const refreshCourseThumbnail = useCallback(async (courseId) => {
    try {
      const token = authService.getStoredToken();
      const response = await axios.get(`${API_URL}/courses/${courseId}/thumbnail`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        params: { t: Date.now() }
      });
      
      const newThumbnail = response.data.thumbnail_url;
      
      // Cập nhật cache
      thumbnailCacheRef.current[courseId] = {
        url: newThumbnail,
        timestamp: Date.now()
      };
      
      // Cập nhật state
      setCourseThumbnails(prev => ({
        ...prev,
        [courseId]: newThumbnail
      }));
      
      return newThumbnail;
    } catch (error) {
      console.error(`Failed to refresh thumbnail for course ${courseId}:`, error);
      return null;
    }
  }, [API_URL]);

  // Hàm hủy đăng ký
  const handleUnenroll = useCallback(async (courseId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !user.id) return;
    
    if (user.role === "Instructor" || user.role === "Admin") return;
    
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký khóa học này?')) {
      return;
    }
    
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

      // Xóa thumbnail khỏi cache
      delete thumbnailCacheRef.current[courseId];
      setCourseThumbnails(prev => {
        const newThumbnails = { ...prev };
        delete newThumbnails[courseId];
        return newThumbnails;
      });
      
      alert('Hủy đăng ký khóa học thành công!');
      
      // Thông báo cho parent component để cập nhật courses
      // Nếu parent component có callback để xử lý unenroll
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('course-unenrolled', { 
          detail: { courseId }
        }));
      }
      
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
  }, [API_URL, user]);

  // Hàm chuyển slide
  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
    
    if (index === 3 && startIndex + 4 < courses.length) {
      setStartIndex(startIndex + 4);
      setCurrentIndex(0);
    } else if (index === 3 && startIndex + 4 >= courses.length) {
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
  }, [courses?.length, startIndex]);

  // Lấy thumbnail cho course
  const getCourseThumbnail = useCallback((course) => {
    const courseId = course.id;
    
    // Ưu tiên sử dụng thumbnail từ courseThumbnails
    if (courseThumbnails[courseId]) {
      return getThumbnailUrl(courseThumbnails[courseId]);
    }
    
    // Nếu không có, sử dụng thumbnail từ course object
    if (course.thumbnail) {
      return getThumbnailUrl(course.thumbnail);
    }
    
    return null;
  }, [courseThumbnails]);

  // Xử lý lỗi ảnh
  const handleImageError = useCallback(async (e, courseId) => {
    const newThumbnail = await refreshCourseThumbnail(courseId);
    
    if (newThumbnail) {
      e.target.src = getThumbnailUrl(newThumbnail);
    } else {
      e.target.src = "https://via.placeholder.com/300x160?text=No+Image";
    }
  }, [refreshCourseThumbnail]);

  // Memoize displayed courses
  const displayedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    return courses.slice(startIndex, startIndex + 4);
  }, [courses, startIndex]);

  // Kiểm tra loading state - chỉ loading nếu courses chưa được truyền vào
  const isLoading = useMemo(() => {
    return courses === undefined; // undefined có nghĩa là đang loading
  }, [courses]);

  // Reset carousel khi courses thay đổi
  useEffect(() => {
    setStartIndex(0);
    setCurrentIndex(0);
  }, [courses]);

  // Debug log để kiểm tra sự thay đổi của courses
  useEffect(() => {
    console.log("Courses updated:", courses?.length);
  }, [courses]);

  if (isLoading) {
    return (
      <div>
        <h3 className="text-[calc(2vh_+_6px)] font-semibold text-gray-900 mb-4">My Courses</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading Course...</span>
        </div>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div>
        <h3 className="text-[calc(2vh_+_6px)] font-semibold text-gray-900 mb-4">My Courses</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Bạn chưa đăng ký khóa học nào.</p>
          <button 
            onClick={() => window.location.href = '/courses'}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Khám phá khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[calc(2vh_+_6px)] font-semibold text-gray-900 mb-4">My Courses</h3>

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
          
          {displayedCourses.map((course) => {
            const thumbnailUrl = getCourseThumbnail(course);
            
            return (
              <NavLink 
                to={`/courses/${course.id}`}
                key={course.id} 
                className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex-shrink-0 w-full snap-center relative"
              >
                {/* Course Thumbnail */}
                <div className="relative h-40 bg-gradient-to-r from-blue-400 to-blue-600 overflow-hidden">
                  {thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => handleImageError(e, course.id)}
                      onLoad={() => {
                        thumbnailCacheRef.current[course.id] = {
                          url: course.thumbnail || thumbnailUrl,
                          timestamp: Date.now()
                        };
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-600">
                      <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747m0-13c5.5 0 10 4.745 10 10.747" />
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

                <div className="p-4">
                  {/* Header với title và nút hủy đăng ký */}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 line-clamp-2">
                      {course.title}
                    </h4>
                    {user?.role !== "Instructor" && user?.role !== "Admin" && (
                      <button
                        onClick={(e) => handleUnenroll(course.id, e)}
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
                    )}
                  </div>
                  
                  {/* Category và Students */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {course.category}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 12a6 6 0 11-12 0 6 6 0 0112 0z" />
                      </svg>
                      {course.students?.toLocaleString() || 0}
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
            );
          })}
        </div>

        {/* Carousel Indicators */}
        {courses.length > 1 && (
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
        )}
      </div>
    </div>
  );
};

export default React.memo(MyCourses);