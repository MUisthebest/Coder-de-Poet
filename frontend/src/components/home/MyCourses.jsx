import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { authService } from '../../services/authService';

const MyCourses = ({ courses: coursesProp = [], user }) => {
  const [courses, setCourses] = useState(coursesProp || []);
  const [loading, setLoading] = useState(false);
  const [unenrollingCourseId, setUnenrollingCourseId] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  
  // Sử dụng ref để theo dõi lần fetch cuối cùng
  const lastFetchRef = useRef({
    userId: null,
    timestamp: 0
  });
  
  // Sử dụng ref để tránh fetch lại nếu đang loading
  const isFetchingRef = useRef(false);

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
    
    // Nếu có coursesProp từ props, sử dụng chúng và không fetch từ API
    if (coursesProp && coursesProp.length > 0) {
      console.log("Using courses from props, skipping API fetch");
      setCourses(coursesProp);
      return;
    }

    // Nếu không có user, clear courses và return
    if (!user || !user.id) {
      console.log("No user, clearing courses");
      setCourses([]);
      return;
    }

    // Kiểm tra xem có cần fetch không
    const shouldFetch = 
      !isFetchingRef.current && 
      (lastFetchRef.current.userId !== user.id || 
       Date.now() - lastFetchRef.current.timestamp > 60000); // Cache 1 phút

    if (!shouldFetch) {
      console.log("Skipping fetch - already fetching or recent fetch");
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
        isFetchingRef.current = false;
      }
    };

    // Gọi hàm fetch
    fetchMyCourses();
    
    // Cleanup function
    return () => {
      console.log("MyCourses cleanup");
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

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading Course...</span>
        </div>
      ) : courses.length === 0 ? (
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
        <div className="space-y-6 max-h-70 overflow-y-auto custom-scrollbar mb-6 px-2 w-[100%]">
          {Object.entries(coursesByCategory).map(([category, data]) => (
            <div key={category} className="space-y-3">

              {/* Courses List */}
              <div className="space-y-3">
                {data.courses.map((course) => (
                  <div key={course.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    {/* Header with title and unenroll button */}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                        {course.title}
                      </h4>
                      <button
                        onClick={() => handleUnenroll(course.id)}
                        disabled={unenrollingCourseId === course.id}
                        className="ml-2 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
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
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-500 text-xs">
                        {course.students.toLocaleString()} students
                      </span>
                      <span className="text-gray-500 text-xs">{course.timeLeft}</span>
                    </div>

                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {getPopularTags(course.tags, 2).map((tag, tagIndex) => (
                          <span 
                            key={tagIndex} 
                            className="px-2 py-1 bg-white/70 rounded-md text-xs text-gray-700 font-medium border border-gray-200/50"
                          >
                            #{formatTag(tag)}
                          </span>
                        ))}
                        
                        {course.tags && course.tags.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium">
                            +{course.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {course.progress > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Category footer */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 font-medium">
                          {course.category}
                        </span>
                        {course.rating && (
                          <span className="flex items-center text-xs text-amber-600">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {course.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Button */}
      <button 
        onClick={() => window.location.href = '/my-courses'}
        className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        View All Courses
      </button>
    </div>
  );
};

export default MyCourses;