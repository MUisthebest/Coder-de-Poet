import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import QuizPanel from "./QuizzPanel";
import InstructorAddLesson from "../../pages/instructor/InstructorAddLesson";
import { useAuth } from "../../contexts/AuthContext";

const CourseInfo = ({ courseData, instructorData, user, isEnrolled = false, onEnroll, enrolling = false, currentLesson, onLessonAdded, averageRating = 0, reviewCount = 0, onOpenReview }) => {
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

  // Lấy thông tin instructor với fallback an toàn
  const instructorAvatar = instructorData?.data?.data?.avatarUrl || "https://d2opxh93rbxzdn.cloudfront.net/original/2X/4/40cfa8ca1f24ac29cfebcb1460b5cafb213b6105.png";
  const instructorName = instructorData?.data?.data?.fullName || "Instructor";
  const instructorEmail = instructorData?.data?.data?.email || "No email provided";

  console.log(currentLesson);

  return (
    <>
      <div className="flex w-full flex-col md:flex-row h-fit md:h-auto py-1 px-3 bg-gradient-to-r from-[#E3E3E3] to-[#eee] rounded-xl justify-between transition-all duration-100 gap-3">
        {/* Left: Course info */}
        <div className="flex flex-col justify-start">
          {/* Title */}
          <h1 className="text-[calc(10px_+_1vw)] font-bold text-gray-900 mb-1">
            {courseData.title}
          </h1>

          {/* Info badges */}
          <div className="flex flex-wrap items-center gap-1 mb-2 text-xs md:text-sm">
            <span className="bg-blue-100 text-[#1B3C53] rounded-full text-sm font-medium w-12 h-12 flex items-center justify-center">
              <img 
                src={instructorAvatar || 'https://d2opxh93rbxzdn.cloudfront.net/original/2X/4/40cfa8ca1f24ac29cfebcb1460b5cafb213b6105.png'} 
                alt="category" 
                className="rounded-full w-10 h-10 object-cover"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "/default-avatar.png";
                }}
              />
            </span>
            <span className="text-gray-600 text-xs md:text-sm hidden md:inline-block">
              👨‍🏫 {instructorName}
            </span>
            <span className="text-gray-600 text-xs md:text-sm hidden lg:inline-block">
              👥 {courseData.student_count || 0} học viên
            </span>
            <span className="text-gray-600 text-xs md:text-sm hidden lg:inline-block">
              📧 {instructorEmail}
            </span>
            <span className="text-gray-600 text-xs md:text-sm flex items-center gap-1">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star 
                    key={idx} 
                    size={14} 
                    className="text-yellow-500"
                    fill={idx < Math.round(averageRating) ? "currentColor" : "none"} 
                  />
                ))}
              </div>
              <span className="font-semibold text-xs">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500 text-xs hidden md:inline">({reviewCount})</span>
            </span>
            {courseData.access_type === "premium" ? (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                Premium
              </span>
            ) : (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Free
              </span>
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-row gap-2 items-center justify-end">
          {/* Chỉ hiển thị nút Upload nếu là giáo viên VÀ có quyền quản lý khóa học */}
          {user?.role === "Instructor" && canManageCourse && (
            <button 
              onClick={() => setShowAddLesson(true)}
              className="px-3 py-2 bg-blue-600 text-xs md:text-sm text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
              disabled={checkingPermission}
            >
              {checkingPermission ? "Checking..." : "📤 Upload"}
            </button>
          )}

          {/* For students: if not enrolled show enroll button, else show quiz */}
          {user?.role && user.role.includes("Student") && (
            !isEnrolled ? (
              <>
                <button
                  onClick={onEnroll}
                  disabled={enrolling}
                  className="px-2 md:px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-sm rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 transition flex-shrink-0 whitespace-nowrap"
                >
                  {enrolling ? 'Enrolling...' : (courseData?.access_type === 'premium' ? `💎 Premium` : '🎓 Enroll')}
                </button>
                <button 
                  onClick={onOpenReview}
                  className="px-2 md:px-3 py-2 text-xs md:text-sm bg-amber-600 text-white font-bold rounded-lg shadow hover:bg-amber-700 transition flex-shrink-0 whitespace-nowrap"
                >
                  ⭐ Reviews
                </button>
              </>
            ) : (
              currentLesson?.id && (
                <>
                  <button 
                    onClick={() => setShowQuiz(true)}
                    className="px-2 md:px-3 py-2 text-xs md:text-sm bg-[#1B3C53] text-white font-bold rounded-lg shadow hover:bg-green-700 transition flex-shrink-0 whitespace-nowrap"
                  >
                    📝 Quiz
                  </button>
                  <button 
                    onClick={onOpenReview}
                    className="px-2 md:px-3 py-2 text-xs md:text-sm bg-amber-600 text-white font-bold rounded-lg shadow hover:bg-amber-700 transition flex-shrink-0 whitespace-nowrap"
                  >
                    ⭐ Review
                  </button>
                </>
              )
            )
          )}
        </div>
      </div>

      {/* Quiz Panel Modal - Chỉ hiển thị nếu có currentLesson */}
      {showQuiz && currentLesson?.id && (
        <QuizPanel 
          lessonId={currentLesson.id} 
          courseId={courseData.id}
          videoUrl={currentLesson.content_url}
          onClose={() => setShowQuiz(false)} 
        />
      )}

      {/* Add Lesson Panel Modal */}
      {showAddLesson && (
        <InstructorAddLesson
          onClose={() => setShowAddLesson(false)}
          onSuccess={() => {
            setShowAddLesson(false);
            if (onLessonAdded) onLessonAdded();
          }}
          MyCourse={[courseData]}
          preSelectedCourse={courseData}
        />
      )}
    </>
  );
};

export default CourseInfo;