import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

const PlayVideo = ({ currentLesson, lessons = [], courseId, getEmbedUrl, isEnrolled }) => {
  const { checkingPermission, canManageCourse, checkCourseOwnership, user } = useAuth();

  useEffect(() => {
    // Chỉ kiểm tra quyền nếu user là Instructor và đã có courseId
    if (user?.role === "Instructor" && courseId) {
      checkCourseOwnership(courseId, user.id);
    }
  }, [user?.role, user?.id, courseId]);

  return (
    <div className="w-full flex gap-3 h-auto transition-all duration-100">
      <div className="w-full space-y-1">
        {currentLesson ? (
          <>
            {/* Nếu đã ghi danh hoặc là chủ khóa học */}
            {isEnrolled || canManageCourse ? (
              <>
                {/* HEADER */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {currentLesson.position && (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Bài {currentLesson.position}
                      </span>
                    )}
                    <h2 className="text-[calc(1vw_+_12px)] font-bold text-gray-800">
                      {currentLesson.title}
                    </h2>
                  </div>

                  <div className="text-sm text-gray-500">
                    Bài {lessons.findIndex((l) => l.id === currentLesson.id) + 1} /{" "}
                    {lessons.length}
                  </div>
                </div>

                {/* DESCRIPTION */}
                {currentLesson.description && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
                    {currentLesson.description}
                  </p>
                )}

                {/* VIDEO PLAYER */}
                <div className="w-[100vw] md:h-[65vh] md:w-[60vw] aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                  {currentLesson.content_url ? (
                    <iframe
                      src={getEmbedUrl(currentLesson.content_url)}
                      title={currentLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-800 to-black">
                      <div className="text-6xl mb-4">🎬</div>
                      <p className="text-xl">Video không khả dụng</p>
                      <p className="text-gray-400 mt-2">Bài học này chưa có video</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* KHÔNG CÓ QUYỀN XEM - CHẾ ĐỘ XEM TRƯỚC */
              <div className="flex-grow bg-gray-50 rounded-xl p-6 border border-gray-200 w-full">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Xem trước khóa học</h2>
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🔒</div>
                      <p className="text-lg">Đăng ký để xem video</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* KHÔNG CÓ BÀI HỌC */
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-500 text-lg">Chưa có bài học nào để hiển thị</p>
            <p className="text-gray-400 mt-2">Vui lòng quay lại sau</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayVideo;
