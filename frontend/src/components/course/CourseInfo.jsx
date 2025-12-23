import React, { useState, useEffect } from "react";
import QuizPanel from "./QuizzPanel";
import InstructorAddLesson from "../../pages/instructor/InstructorAddLesson";
import { useAuth } from "../../contexts/AuthContext";

const CourseInfo = ({ courseData, user, isEnrolled = false, onEnroll, enrolling = false, currentLesson }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const {checkingPermission, canManageCourse, checkCourseOwnership} = useAuth();

  useEffect(() => {
    // Kiểm tra quyền quản lý khóa học nếu user là giáo viên
    if (user?.role === "Instructor" && courseData?.id) {
      checkCourseOwnership(courseData.id, user.id);
    }
  }, [user, courseData]);

  if (!courseData) return null;

  console.log(currentLesson);

  return (
    <>
      <div className="flex w-full flex-col md:flex-row h-fit md:h-[15vh] py-3 px-5 bg-gradient-to-r from-[#E3E3E3] to-[#eee] rounded-xl justify-between transition-all duration-100">
        {/* Left: Course info */}
        <div className="flex flex-col justify-start">
          {/* Title */}
          <h1 className="text-[calc(10px_+_1vw)] font-bold text-gray-900 mb-2">
            {courseData.title}
          </h1>

          {/* Info badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-blue-100 text-[#1B3C53] px-3 py-1 rounded-full text-sm font-medium">
              {courseData.category?.name || "Uncategorized"}
            </span>
            <span className="text-gray-600 text-sm">
              👨‍🏫 {courseData.instructor_name || "Instructor"}
            </span>
            <span className="text-gray-600 text-sm">
              👥 {courseData.student_count || 0} học viên
            </span>
            <span className="text-gray-600 text-sm">
              ⭐ {courseData.rating || "4.5"}/5.0
            </span>
            {courseData.access_type === "premium" ? (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                Premium
              </span>
            ) : (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Miễn phí
              </span>
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex gap-3 items-center full-h">
          {/* Chỉ hiển thị nút Upload nếu là giáo viên VÀ có quyền quản lý khóa học */}
          {user?.role === "Instructor" && canManageCourse && (
            <button 
              onClick={() => setShowAddLesson(true)}
              className="px-4 py-4 bg-blue-600 text-[2vh] text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
              disabled={checkingPermission}
            >
              {checkingPermission ? "Đang kiểm tra..." : "📤 Upload bài học"}
            </button>
          )}

          {/* For students: if not enrolled show enroll button, else show quiz */}
          {user?.role && user.role.includes("Student") && (
            !isEnrolled ? (
              <button
                onClick={onEnroll}
                disabled={enrolling}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 transition"
              >
                {enrolling ? 'Đang đăng ký...' : (courseData?.access_type === 'premium' ? `💎 Đăng ký Premium - ${courseData.price || '$49.99'}` : '🎓 Đăng ký miễn phí')}
              </button>
            ) : (
              <button 
                onClick={() => setShowQuiz(true)}
                className="px-4 py-4 text-[2vh] bg-[#1B3C53] text-white font-bold rounded-lg shadow hover:bg-green-700 transition"
              >
                📝 Quizz
              </button>
            )
          )}
        </div>
      </div>

      {/* Quiz Panel Modal */}
      {showQuiz && (
        <QuizPanel 
          lessonId={currentLesson.id} 
          videoUrl={currentLesson.content_url}
          onClose={() => setShowQuiz(false)} 
        />
      )}

      {/* Add Lesson Panel Modal */}
      {showAddLesson && (
        <InstructorAddLesson
          onClose={() => setShowAddLesson(false)}
          MyCourse={[courseData]}
          preSelectedCourse={courseData}
        />
      )}
    </>
  );
};

export default CourseInfo;