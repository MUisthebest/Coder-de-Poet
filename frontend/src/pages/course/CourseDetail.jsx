<<<<<<< HEAD
import React, { useState } from "react";
import { useParams } from "react-router-dom";

// MOCK LESSONS (dữ liệu bạn gửi)
const lessons = [
  { id: "1", course_id: "1", title: "OOP JS #1 - Introduction", url: "https://www.youtube.com/watch?v=4l3bTDlT6ZI", position: 1 },
  { id: "2", course_id: "1", title: "OOP JS #2 - Object Literals", url: "https://www.youtube.com/watch?v=7d9H34ZVRPg", position: 2 },
  { id: "3", course_id: "1", title: "OOP JS #3 - Updating Properties", url: "https://www.youtube.com/watch?v=ni9e-lOEw3Q", position: 3 },
  { id: "4", course_id: "1", title: "OOP JS #4 - Classes", url: "https://www.youtube.com/watch?v=Ug4ChzopcE4", position: 4 },
  { id: "5", course_id: "1", title: "OOP JS #5 - Class Constructors", url: "https://www.youtube.com/watch?v=HboT8g_QSGc", position: 5 },
  { id: "1d91...", course_id: "1", title: "OOP JS #6 - Class Methods", url: "https://www.youtube.com/watch?v=hy-C4NY7A_8", position: 6 },
  { id: "0237...", course_id: "1", title: "OOP JS #7 - Method Chaining", url: "https://www.youtube.com/watch?v=8x1fygdWabY", position: 7 },
  { id: "658f...", course_id: "1", title: "OOP JS #8 - Class Inheritance", url: "https://www.youtube.com/watch?v=_cgBvtYT3fQ", position: 8 },
  { id: "a1bd...", course_id: "1", title: "OOP JS #9 - Constructors (under the hood)", url: "https://www.youtube.com/watch?v=3HsLZ7WUUt4", position: 9 },
  { id: "f1fd...", course_id: "1", title: "OOP JS #10 - Prototype", url: "https://www.youtube.com/watch?v=4jb4AYEyhRc", position: 10 },
];

// Convert youtube watch link → embed
const getEmbedUrl = (url) => {
  const id = url.split("v=")[1].split("&")[0];
  return `https://www.youtube.com/embed/${id}`;
};

const getThumbnail = (url) => {
  const id = url.split("v=")[1].split("&")[0];
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};


const CourseDetail = () => {
  const { id } = useParams();

  // Filter lessons theo course_id
  const courseLessons = lessons
    .filter((l) => l.course_id === id)
    .sort((a, b) => a.position - b.position);

  // Lesson đầu tiên làm video mặc định
  const [currentLesson, setCurrentLesson] = useState(courseLessons[0]);

  return (
    <div className="flex max-w-7xl mx-auto mt-10 gap-6 sm:px-5">
      {/* LEFT: VIDEO + TITLE */}
      <div className="flex-1 space-y-4">
        <h1 className="text-2xl font-bold">{currentLesson.title}</h1>

        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={getEmbedUrl(currentLesson.url)}
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </div>

      {/* RIGHT: LESSON LIST */}
      <div className="w-80 bg-white rounded-xl shadow p-4 h-fit">
        <h2 className="font-semibold mb-3 text-lg">Course Lessons</h2>
        <div className="space-y-2 p-1 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-button]:hidden">
            {courseLessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setCurrentLesson(lesson)}
                className={`flex items-center gap-3 w-full text-left p-2 rounded-lg border ${
                  currentLesson.id === lesson.id
                    ? "bg-[#666] text-white border-blue-600"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <img
                  src={getThumbnail(lesson.url)}
                  alt={lesson.title}
                  className="w-20 h-12 object-cover rounded"
                />
                <span className="text-sm">{lesson.position}. {lesson.title}</span>
              </button>
            ))}
          </div>
=======
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";

// Import các component đã code
import CourseInfo from "../../components/course/CourseInfo";
import CoursePlaylist from "../../components/course/CoursePlaylist"; 
import PlayVideo from "../../components/course/PlayVideo";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Convert youtube watch link → embed
const getEmbedUrl = (url) => {
  if (!url) return "";
  if (url.includes("youtube.com/embed")) return url;
  if (url.includes("youtube.com/watch")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }
  return url;
};

// Lấy thumbnail từ youtube
const getThumbnail = (url) => {
  if (!url) return "https://via.placeholder.com/160x90";
  if (url.includes("youtube.com/watch")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return id
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : "https://via.placeholder.com/160x90";
  }
  return "https://via.placeholder.com/160x90";
};

const CourseDetail = () => {
  const { id } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { isOpen } = useSidebar();
  const { user, canManageCourse } = useAuth();
  const [courseLoading, setCourseLoading] = useState(true);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Lấy token từ authService
  const getAccessToken = () => authService.getStoredToken();

  // Check authentication
  const checkAuth = () => {
    const token = getAccessToken();
    if (!token) {
      setError("Bạn cần đăng nhập để xem nội dung khóa học");
      return false;
    }
    return true;
  };

  // Fetch course details (exposed function so we can re-run after enroll)
  const fetchCourseData = async () => {
    try {
      setCourseLoading(true);
      if (!checkAuth()) {
        setCourseLoading(false);
        return;
      }
      const token = getAccessToken();
      const response = await axios.get(`${API_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourseData(response.data);
      setError(null); // Clear any previous error
    } catch (err) {
      console.error("❌ Error fetching course data:", err);
      
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 403) {
        setError("Bạn không có quyền truy cập khóa học này");
      } else if (err.response?.status === 404) {
        setError("Khóa học không tồn tại");
      } else {
        setError("Không thể tải thông tin khóa học");
      }
    } finally {
      setCourseLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch related / popular courses in the same category
  useEffect(() => {
    const fetchRelated = async () => {
      if (!courseData) return;
      const catId = courseData.category?.id || courseData.category_id;
      if (!catId) return;
      setRelatedLoading(true);
      try {
        const res = await axios.get(`${API_URL}/courses/category/${catId}/top?limit=4`);
        let data = res.data;
        if (data?.items) data = data.items;
        if (Array.isArray(data)) {
          const mapped = data.map(c => ({
            id: c.id,
            title: c.title || c.name,
            category: c.category_name || courseData.category?.name || c.category || '',
            students: c.student_count || c.students || 0,
            instructor: c.instructor_name || c.instructor || 'Instructor',
            image: c.thumbnail_url || c.image || 'https://via.placeholder.com/400x225?text=No+Image',
            price: c.access_type === 'premium' ? 'Premium' : 'Free',
            tags: c.tags || c.tag || [],
            status: c.status,
          }));
          setRelatedCourses(mapped.filter(rc => String(rc.id) !== String(id)));
        } else {
          setRelatedCourses([]);
        }
      } catch (err) {
        console.error('Fetch related courses failed', err);
        setRelatedCourses([]);
      } finally {
        setRelatedLoading(false);
      }
    };
    fetchRelated();
  }, [courseData, id]);

  // Fetch lessons (exposed so we can re-run after enroll)
  const fetchLessons = async () => {
    try {
      setLoading(true);
      if (!checkAuth()) {
        setLoading(false);
        return;
      }
      const token = getAccessToken();
      const response = await axios.get(`${API_URL}/lessons`, {
        params: { courseId: id, skip: 0, take: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });

      let lessonsData = [];
      if (Array.isArray(response.data)) lessonsData = response.data;
      else if (response.data?.data) lessonsData = response.data.data;
      else if (response.data?.items) lessonsData = response.data.items;
      else if (response.data?.lessons) lessonsData = response.data.lessons;

      const sortedLessons = [...lessonsData].sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return 0;
      });

      setLessons(sortedLessons);
      if (sortedLessons.length > 0) setCurrentLesson(sortedLessons[0]);
      setError(null); // Clear error on successful fetch
    } catch (err) {
      console.error("❌ Error fetching lessons:", err);
      
      // Xử lý lỗi 403 (Forbidden) đặc biệt - có nghĩa là chưa đăng ký
      if (err.response?.status === 403) {
        // Không set error ở đây, vì đây là trạng thái bình thường khi chưa đăng ký
        console.log("Bạn chưa đăng ký khóa học này");
        setLessons([]); // Reset lessons
      } else if (err.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setError("Không thể tải danh sách bài học. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && getAccessToken()) fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Check enrollment for current user and course (dùng API mới)
  useEffect(() => {
    const checkEnrollment = async () => {
      setCheckingEnrollment(true);
      setIsEnrolled(false);
      try {
        if (!user || !user.id) {
          setCheckingEnrollment(false);
          return;
        }
        const token = getAccessToken();
        const res = await axios.get(`${API_URL}/enrollments/check`, {
          params: { studentId: user.id, courseId: id },
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsEnrolled(!!res.data?.enrolled);
      } catch (err) {
        console.error("Error checking enrollment:", err);
        setIsEnrolled(false);
      } finally {
        setCheckingEnrollment(false);
      }
    };
    if (user && id) checkEnrollment();
  }, [user, id]);

  // Redirect login
  const handleLoginRedirect = () => {
    window.location.href =
      "/login?redirect=" + encodeURIComponent(window.location.pathname);
  };

  // Enroll handler
  const handleEnroll = async () => {
    if (!user || !user.id) return handleLoginRedirect();
    try {
      setEnrolling(true);
      const token = getAccessToken();
      const res = await axios.post(`${API_URL}/enrollments/enroll`, {
        userId: user.id,
        courseId: id,
      }, { headers: { Authorization: `Bearer ${token}` } });

      // After successful enroll, refresh data and lessons
      setIsEnrolled(true);
      await fetchCourseData();
      await fetchLessons();
    } catch (err) {
      console.error('Enroll failed', err);
      alert('Đăng ký khóa học thất bại. Vui lòng thử lại.');
    } finally {
      setEnrolling(false);
    }
  };

  // Loading state
  if (courseLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  // Authentication error state - chỉ show khi lỗi 401 (chưa login)
  if (error && error.includes("đăng nhập") || error?.includes("401")) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Yêu cầu đăng nhập
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleLoginRedirect}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng nhập để tiếp tục
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Quay lại trang trước
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Course not found
  if (!courseData && !courseLoading && !error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Khóa học không tồn tại
          </h2>
          <p className="text-gray-600 mb-4">
            Không tìm thấy khóa học với ID: {id}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Render chính - HIỂN THỊ KHÓA HỌC DÙ CHƯA ĐĂNG KÝ
  return (
    <div className="flex flex-col md:flex-row max-w-8xl mx-auto md:p-4 gap-1 min-h-screen overflow-y-auto md:overflow-hidden w-full">
      <div className={`flex w-full md:w-[66vw] flex-col gap-1 md:px-10`}>
        {/* Course Info - ĐÃ TÍCH HỢP COMPONENT CourseInfo */}
        {courseData && (
          <>
            <div className="flex-grow sm:w-[60vw]">
              <PlayVideo
                currentLesson={currentLesson}
                lessons={lessons}
                courseId={courseData.id}
                getEmbedUrl={getEmbedUrl}
                isEnrolled={isEnrolled}
              />
            </div>
          
            {/* Component CourseInfo đã được tích hợp với đầy đủ props */}
            <div className="mt-1">
              <CourseInfo 
                courseData={courseData} 
                user={user} 
                isEnrolled={isEnrolled} 
                onEnroll={handleEnroll} 
                enrolling={enrolling} 
                currentLesson={currentLesson}
              />
            </div>
          </>
        )}
      </div>
      
      {/* Playlist - Hiển thị cho cả người chưa đăng ký (nhưng chỉ show tên bài học) */}
      <div className={isOpen ? "w-full md:w-[8vw]" : "w-full md:w-[20vw]"}>
        <CoursePlaylist
          lessons={lessons}
          currentLesson={currentLesson}
          setCurrentLesson={isEnrolled || canManageCourse ? setCurrentLesson : () => {}} // Chỉ cho phép click khi đã đăng ký
          loading={loading}
          getThumbnail={getThumbnail}
          isEnrolled={isEnrolled}
        />
>>>>>>> 1d774e27c06a721ddabe3dd334f3fd806cfdcc60
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default CourseDetail;
=======
export default CourseDetail;
>>>>>>> 1d774e27c06a721ddabe3dd334f3fd806cfdcc60
