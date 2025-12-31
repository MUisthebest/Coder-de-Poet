import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { authService } from "../../services/authService";
import CourseInfo from "../../components/course/CourseInfo";
import CoursePlaylist from "../../components/course/CoursePlaylist";
import PlayVideo from "../../components/course/PlayVideo";
import CourseReviewModal from "../../components/course/CourseReviewModal";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Convert youtube watch link  embed
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
  const { isOpen } = useSidebar();
  const { user, canManageCourse } = useAuth();

  const [courseData, setCourseData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [courseLoading, setCourseLoading] = useState(true);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [instructorData, setInstructorData] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const getAccessToken = () => authService.getStoredToken();
  const checkAuth = () => {
    const token = getAccessToken();
    if (!token) {
      setError("Bạn cần đăng nhập để xem nội dung khóa học");
      return false;
    }
    return true;
  };

  const fetchCourseData = async () => {
    try {
      setCourseLoading(true);
      if (!checkAuth()) {
        setCourseLoading(false);
        return;
      }
      const token = getAccessToken();
      const res = await axios.get(`${API_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourseData(res.data);
      authService
        .getInstructorById(res.data.instructor_id)
        .then((data) => setInstructorData(data))
        .catch((e) => console.error("Error fetching instructor data:", e));
      setError(null);
    } catch (err) {
      console.error(" Error fetching course data:", err);
      if (err.response?.status === 401) setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      else if (err.response?.status === 403) setError("Bạn không có quyền truy cập khóa học này");
      else if (err.response?.status === 404) setError("Khóa học không tồn tại");
      else setError("Không thể tải thông tin khóa học");
    } finally {
      setCourseLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
          const mapped = data.map((c) => ({
            id: c.id,
            title: c.title || c.name,
            category: c.category_name || courseData.category?.name || c.category || "",
            students: c.student_count || c.students || 0,
            instructor: c.instructor_name || c.instructor || "Instructor",
            image: c.thumbnail_url || c.image || "https://via.placeholder.com/400x225?text=No+Image",
            price: c.access_type === "premium" ? "Premium" : "Free",
            tags: c.tags || c.tag || [],
            status: c.status,
          }));
          setRelatedCourses(mapped.filter((rc) => String(rc.id) !== String(id)));
        } else {
          setRelatedCourses([]);
        }
      } catch (err) {
        console.error("Fetch related courses failed", err);
        setRelatedCourses([]);
      } finally {
        setRelatedLoading(false);
      }
    };
    fetchRelated();
  }, [courseData, id]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      if (!checkAuth()) {
        setLoading(false);
        return;
      }
      const token = getAccessToken();
      const res = await axios.get(`${API_URL}/lessons`, {
        params: { courseId: id, skip: 0, take: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });

      let lessonsData = [];
      if (Array.isArray(res.data)) lessonsData = res.data;
      else if (res.data?.data) lessonsData = res.data.data;
      else if (res.data?.items) lessonsData = res.data.items;
      else if (res.data?.lessons) lessonsData = res.data.lessons;

      const sorted = [...lessonsData].sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) return a.position - b.position;
        if (a.createdAt && b.createdAt) return new Date(a.createdAt) - new Date(b.createdAt);
        return 0;
      });

      setLessons(sorted);
      if (sorted.length > 0) setCurrentLesson(sorted[0]);
      setError(null);
    } catch (err) {
      console.error(" Error fetching lessons:", err);
      if (err.response?.status === 403) {
        setLessons([]);
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

  const fetchReviews = async () => {
    try {
      const token = getAccessToken();
      const res = await axios.get(`${API_URL}/reviews`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const data = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.reviews || [];
      const courseReviews = data.filter((r) => String(r.courseId ?? r.course_id) === String(id));
      const avg = courseReviews.length ? courseReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / courseReviews.length : 0;
      setReviews(courseReviews);
      setAverageRating(Number(avg.toFixed(1)));
    } catch (err) {
      console.error("Error fetching reviews", err);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLoginRedirect = () => {
    window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
  };

  const handleEnroll = async () => {
    if (!user || !user.id) return handleLoginRedirect();
    try {
      setEnrolling(true);
      const token = getAccessToken();
      await axios.post(
        `${API_URL}/enrollments/enroll`,
        { userId: user.id, courseId: id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsEnrolled(true);
      await fetchCourseData();
      await fetchLessons();
    } catch (err) {
      console.error("Enroll failed", err);
      alert("Đăng ký khóa học thất bại. Vui lòng thử lại.");
    } finally {
      setEnrolling(false);
    }
  };

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

  if ((error && error.includes("đăng nhập")) || error?.includes("401")) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu đăng nhập</h2>
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

  if (!courseData && !courseLoading && !error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Khóa học không tồn tại</h2>
          <p className="text-gray-600 mb-4">Không tìm thấy khóa học với ID: {id}</p>
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

  return (
    <div className="flex flex-col md:flex-row max-w-8xl mx-auto md:p-2 gap-1 min-h-screen overflow-y-auto md:overflow-hidden w-full">
      <div className="flex w-full md:w-[66vw] flex-col gap-1 md:px-10">
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

            <div className="mt-1">
              <CourseInfo
                courseData={courseData}
                instructorData={instructorData}
                user={user}
                isEnrolled={isEnrolled}
                onEnroll={handleEnroll}
                enrolling={enrolling}
                currentLesson={currentLesson}
                onLessonAdded={fetchLessons}
              />
            </div>

            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Đánh giá khóa học</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">{averageRating || 0}</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={20} fill={idx < Math.round(averageRating) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">({reviews.length} đánh giá)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                    {isEnrolled ? "Đã đăng ký" : "Chưa đăng ký"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
                  >
                    Đánh giá khóa học
                  </button>
                </div>
              </div>
            </div>

            {showReviewModal && (
              <CourseReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                courseId={id}
                user={user}
                isEnrolled={isEnrolled}
                onReviewSubmitted={fetchReviews}
              />
            )}
          </>
        )}
      </div>

      <div className={isOpen ? "w-full md:w-[8vw]" : "w-full md:w-[20vw]"}>
        <CoursePlaylist
          lessons={lessons}
          currentLesson={currentLesson}
          setCurrentLesson={isEnrolled || canManageCourse ? setCurrentLesson : () => {}}
          loading={loading}
          getThumbnail={getThumbnail}
          isEnrolled={isEnrolled}
        />
      </div>
    </div>
  );
};

export default CourseDetail;