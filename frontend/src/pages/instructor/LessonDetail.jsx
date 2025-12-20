import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiVideo,
  FiFileText,
  FiClock,
  FiCalendar,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";
import instructorService from "../../services/instructorService";
import { useAuth } from "../../contexts/AuthContext";
import ProfileSidebar from "../../components/home/ProfileSideBar";

const LessonDetailPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [myCourses, setMyCourses] = useState([]);

  const weeklyActivities = [
    { day: "Mon", hours: 2.5, type: "learning" },
    { day: "Tue", hours: 1.8, type: "practice" },
    { day: "Wed", hours: 3.2, type: "learning" },
    { day: "Thu", hours: 2.0, type: "project" },
    { day: "Fri", hours: 4.1, type: "learning" },
    { day: "Sat", hours: 1.5, type: "review" },
    { day: "Sun", hours: 2.8, type: "practice" },
  ];
  const friends = [
    { id: 1, name: "Alex Johnson", course: "React Native" },
    { id: 2, name: "Maria Garcia", course: "UI/UX Design" },
    { id: 3, name: "Tom Wilson", course: "Data Science" },
    { id: 4, name: "Sarah Chen", course: "Web Development" },
    { id: 5, name: "Mike Brown", course: "Cloud Computing" },
  ];

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

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

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const storedLesson = JSON.parse(sessionStorage.getItem("currentLesson"));
      const storedCourse = JSON.parse(sessionStorage.getItem("currentCourse"));
      if (storedLesson) {
        setLesson(storedLesson);
        setEditData(storedLesson);
      }
      if (storedCourse) {
        setCourse(storedCourse);
      }
      const quizzesData = await instructorService.getQuizzesByLesson(lessonId);
      setQuizzes(quizzesData || []);
    } catch (err) {
      console.error("Error fetching lesson data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(lesson);
    }
    setIsEditing(!isEditing);
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleSaveLesson = async () => {
    try {
      await instructorService.updateLesson(lesson.id, {
        title: editData.title,
        description: editData.description,
        content_url: editData.content_url,
      });
      setLesson(editData);
      setIsEditing(false);
      alert("Lesson đã được cập nhật thành công!");
    } catch (err) {
      console.error("Error updating lesson:", err);
      alert("Có lỗi khi cập nhật lesson");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Bạn có chắc muốn xóa quiz này?")) return;
    try {
      await instructorService.deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      alert("Xóa quiz thành công!");
    } catch (err) {
      console.error("Error deleting quiz:", err);
      alert("Có lỗi khi xóa quiz");
    }
  };

  const renderVideoPlayer = () => {
    const videoUrl = editData.content_url || lesson?.content_url;
    if (!videoUrl) return null;
    
    // Check for YouTube URLs
    const isYoutube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    if (isYoutube) {
      let videoId = "";
      
      // Handle youtube.com/watch?v=ID format
      if (videoUrl.includes("youtube.com/watch?v=")) {
        const params = videoUrl.split("?")[1];
        const vParam = params?.split("&").find(p => p.startsWith("v="));
        videoId = vParam?.replace("v=", "");
      } 
      // Handle youtu.be/ID format
      else if (videoUrl.includes("youtu.be/")) {
        videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
      }
      
      if (videoId) {
        return (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={lesson?.title || "YouTube video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
      }
    }
    
    // Fallback: display as regular video
    return (
      <video className="w-full rounded-lg" controls src={videoUrl}>
        Your browser does not support the video tag.
      </video>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-500 mb-4">Không tìm thấy lesson</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"><FiArrowLeft className="text-lg" /></button>
          {!isEditing ? (
            <button onClick={handleEditToggle} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><FiEdit /> Chỉnh sửa</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSaveLesson} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Lưu</button>
              <button onClick={handleEditToggle} className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400">Hủy</button>
            </div>
          )}
        </div>

        {/* Content */}
        <section className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                {isEditing ? (
                  <input type="text" value={editData.title} onChange={(e) => handleEditChange("title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-800">{lesson.title}</h1>
                )}
              </div>

              {/* Course Info + Meta */}
              <div className="space-y-3 pb-4 border-b border-gray-200">
                {course && (
                  <div className="text-sm text-gray-600"><p>Khóa học: <span className="font-semibold">{course.title}</span></p></div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700"><FiFileText /><span>Loại: {lesson.content_type}</span></div>
                  <div className="flex items-center gap-2 text-gray-700"><FiCalendar /><span>Cập nhật: {new Date(lesson.updated_at).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-2 text-gray-700"><FiClock /><span>Thời lượng: {lesson.duration || "N/A"}</span></div>
                </div>
              </div>

              {/* Video Player */}
              {(editData.content_url || lesson.content_url) && (
                <div className="bg-gray-900 rounded-lg overflow-hidden">{renderVideoPlayer()}</div>
              )}

              {/* Video URL */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                  <input type="text" value={editData.content_url || ""} onChange={(e) => handleEditChange("content_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://youtube.com/watch?v=... hoặc Cloudinary URL" />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                {isEditing ? (
                  <textarea value={editData.description || ""} onChange={(e) => handleEditChange("description", e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {lesson.description ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
                    ) : (
                      <p className="text-gray-400 italic">Chưa có mô tả</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quizzes Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold text-gray-800">Quiz của bài học</h3><span className="text-sm text-gray-500">{quizzes.length} quiz</span></div>
                {quizzes.length === 0 ? (
                  <div className="text-center text-gray-400 py-8"><p className="mb-2">Chưa có quiz nào cho bài học này</p></div>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz, index) => (
                      <div key={quiz.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800">{quiz.title}</h4>
                              {quiz.status === "published" && (<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Published</span>)}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1"><FiFileText className="text-gray-400" /><span>{quiz.questions?.length || 0} câu hỏi</span></div>
                              <div className="flex items-center gap-1"><FiClock className="text-gray-400" /><span>{quiz.duration || 15} phút</span></div>
                              {quiz.total_points && (<div className="flex items-center gap-1"><FiCheckCircle className="text-gray-400" /><span>{quiz.total_points} điểm</span></div>)}
                            </div>
                            {quiz.description && (<p className="text-sm text-gray-600">{quiz.description}</p>)}
                            <button onClick={() => setSelectedQuiz(selectedQuiz?.id === quiz.id ? null : quiz)} className="text-sm text-blue-600 hover:underline mt-2">{selectedQuiz?.id === quiz.id ? "Ẩn câu hỏi" : "Xem câu hỏi"}</button>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button onClick={() => {}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Chỉnh sửa"><FiEdit /></button>
                            <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa"><FiTrash2 /></button>
                          </div>
                        </div>
                        {selectedQuiz?.id === quiz.id && quiz.questions && (
                          <div className="mt-4 border-t pt-4 space-y-3">
                            <h5 className="font-medium text-gray-700 mb-2">Danh sách câu hỏi:</h5>
                            {quiz.questions.map((q, qIndex) => (
                              <div key={qIndex} className="bg-gray-50 rounded-lg p-3">
                                <p className="font-medium text-gray-800 mb-2">
                                  {qIndex + 1}. {q.content || q.text}
                                  <span className="text-sm text-gray-500 ml-2">({q.points || 1} điểm)</span>
                                </p>
                                <p className="text-xs text-gray-500 mb-2">
                                  Loại: {q.type === "multiple-choice" ? "Trắc nghiệm" : q.type === "true-false" ? "Đúng/Sai" : "Tự luận ngắn"}
                                </p>
                                {q.options && (
                                  <div className="space-y-1 ml-4">
                                    {q.options.map((opt, oIndex) => (
                                      <div key={oIndex} className={`text-sm flex items-center gap-2 ${opt === q.correctAnswer || q.correct_answer === opt ? "text-green-600 font-medium" : "text-gray-600"}`}>
                                        <span className="w-4">{String.fromCharCode(65 + oIndex)}.</span>
                                        <span>{opt}</span>
                                        {(opt === q.correctAnswer || q.correct_answer === opt) && (<FiCheckCircle className="text-green-600" />)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Right sticky profile sidebar */}
      <div className="flex justify-center items-start sticky top-0">
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

export default LessonDetailPage;
