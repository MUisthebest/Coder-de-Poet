import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiX,
  FiBookOpen,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiVideo,
  FiPlus,
  FiArrowLeft,
} from "react-icons/fi";
import instructorService from "../../services/instructorService";
import CreateQuizPage from "./CreateQuizPage";
import { useAuth } from "../../contexts/AuthContext";
import ProfileSidebar from '../../components/home/ProfileSideBar';
import InstructorAddLesson from "./InstructorAddLesson";

const CourseDetailRoute = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [showAddLesson, setShowAddLesson] = useState(false);

  const weeklyActivities = [
    { day: 'Mon', hours: 2.5, type: 'learning' },
    { day: 'Tue', hours: 1.8, type: 'practice' },
    { day: 'Wed', hours: 3.2, type: 'learning' },
    { day: 'Thu', hours: 2.0, type: 'project' },
    { day: 'Fri', hours: 4.1, type: 'learning' },
    { day: 'Sat', hours: 1.5, type: 'review' },
    { day: 'Sun', hours: 2.8, type: 'practice' }
  ];
  const friends = [
    { id: 1, name: 'Alex Johnson', course: 'React Native' },
    { id: 2, name: 'Maria Garcia', course: 'UI/UX Design' },
    { id: 3, name: 'Tom Wilson', course: 'Data Science' },
    { id: 4, name: 'Sarah Chen', course: 'Web Development' },
    { id: 5, name: 'Mike Brown', course: 'Cloud Computing' }
  ];

  // State cho modal Add Quiz
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Fetch course từ sessionStorage hoặc từ API
  useEffect(() => {
    const storedCourse = sessionStorage.getItem("currentCourse");
    if (storedCourse) {
      try {
        const parsedCourse = JSON.parse(storedCourse);
        setCourse(parsedCourse);
        setCourseLoading(false);
      } catch (err) {
        console.error("Error parsing stored course:", err);
        setCourseLoading(false);
      }
    } else {
      // Nếu không có trong sessionStorage, có thể fetch từ API (tuỳ chọn)
      // instructorService.getCourseById(courseId) nếu có method này
      setCourseLoading(false);
    }
  }, [courseId]);

  // Fetch lessons
  const fetchLessons = async () => {
    if (!course?.id && !courseId) return;
    try {
      setLoading(true);
      const id = course?.id || courseId;
      const data = await instructorService.getLessonsByCourse(id);
      setLessons(data);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [course?.id, courseId]);

  // Sidebar: fetch instructor courses for profile panel
  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        if (!user?.id) return;
        const data = await instructorService.getCoursesByInstructor(user.id);
        const courseList = data?.courses?.items || [];
        setMyCourses(courseList);
      } catch (err) {
        console.error("Error fetching my courses for sidebar:", err);
      }
    };
    fetchMyCourses();
  }, [user?.id]);

  // Hàm mở modal thêm quiz cho lesson cụ thể
  const openAddQuizModal = (lesson) => {
    setSelectedLesson(lesson);
    setShowQuizModal(true);
  };

  // Hàm xử lý khi quiz được tạo thành công
  const handleQuizCreated = (quizInfo) => {
    // Cập nhật lessons để hiển thị có quiz
    setLessons(lessons.map(l =>
      l.id === quizInfo.lessonId ? { ...l, hasQuiz: true } : l
    ));
  };

  // Hàm mở trang chi tiết lesson
  const openLessonDetail = (lesson) => {
    // Navigate đến trang chi tiết với courseId và lessonId
    navigate(`/instructor/courses/${courseId}/lesson/${lesson.id}`);
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Course not found</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 font-medium"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <div className="flex-1 mx-auto bg-gray-50 py-6 px-4 max-w-6xl flex flex-col">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 font-medium"
        >
          <FiArrowLeft /> Back
        </button>
        

        {/* Main card */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Top summary */}
                <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                  <img
                    src={course.thumbnail_url || "https://via.placeholder.com/100"}
                    alt="Course"
                    className="w-28 h-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-1 truncate">
                    <FiBookOpen className="text-blue-500" /> {course.title}
                    </h1>
                    <p className="text-sm text-gray-500 truncate">{course.category} • {course.status}</p>
                  </div>
                  </div>
                  <button className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition whitespace-nowrap" onClick={() => setShowAddLesson(true)}>
                  Add Lesson
                  </button>
                </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                  <FiUsers className="text-blue-500" /> {course.student_count || 0} students
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FiCalendar className="text-green-500" /> Updated: {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : "N/A"}
                </div>
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Lessons</span>
                  <span className="text-lg font-bold text-blue-600">{lessons.length}</span>
                </div>
                </div>

                {/* Description */}
          <div className="mb-8 text-gray-700 text-sm leading-relaxed">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p>{course.description || "This course currently has no description."}</p>
          </div>

          {/* Lessons List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lessons ({lessons.length})</h2>
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading lessons...</div>
            ) : lessons.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">No lessons found.</div>
            ) : (
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                {lessons.map((lesson, i) => (
                  <div
                    key={lesson.id || i}
                    className="flex justify-between items-center p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {lesson.content_type === "video" ? (
                        <FiVideo className="text-blue-500 text-lg flex-shrink-0" />
                      ) : (
                        <FiFileText className="text-gray-500 text-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{lesson.title}</p>
                        <p className="text-xs text-gray-500">
                          {lesson.content_type} • {lesson.updated_at ? new Date(lesson.updated_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <button
                        onClick={() => openLessonDetail(lesson)}
                        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition whitespace-nowrap"
                      >
                        View Detail
                      </button>
                      <button
                        onClick={() => openAddQuizModal(lesson)}
                        className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition flex items-center gap-1 whitespace-nowrap"
                      >
                        <FiPlus /> Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

              {/* Quiz Modal */}
              {showQuizModal && selectedLesson && (
                <CreateQuizPage
                  lesson={selectedLesson}
                  course={course}
                  onBack={() => { setShowQuizModal(false); setSelectedLesson(null); }}
                  onQuizCreated={handleQuizCreated}
                />
              )}

              {showAddLesson && (
                <InstructorAddLesson
                  onClose={() => setShowAddLesson(false)}
                  onSuccess={() => {
                    setShowAddLesson(false);
                    fetchLessons();
                  }}
                  preSelectedCourse={course}
                  MyCourse={[course]}
                />
              )}

              {/* Footer */}
          <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 mt-8">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Inline Quiz handled above; modal removed */}
      </div>

      {/* Right sticky profile sidebar */}
      <div className="flex justify-center items-center sticky top-0">
        <ProfileSidebar 
          weeklyActivities={weeklyActivities}
          myCourses={myCourses}
          friends={friends}
          user={user}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
};

export default CourseDetailRoute;
