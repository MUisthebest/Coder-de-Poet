import React from "react";

const PlayVideo = ({ currentLesson, lessons, getEmbedUrl }) => {
  return (
    <div className="w-full flex gap-3 h-auto transition-all duration-100">
      {/* Current Lesson Section - Chiếm 2/3 */}
      <div className="w-full space-y-1">
        {currentLesson ? (
          <>
            {/* Header */}
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

            {/* Description */}
            {currentLesson.description && (
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
                {currentLesson.description}
              </p>
            )}

            {/* Video Player */}
            <div className="w-[60vw] md:h-[65vh] h-auto aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
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
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-500 text-lg">
              Chưa có bài học nào để hiển thị
            </p>
            <p className="text-gray-400 mt-2">Vui lòng quay lại sau</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayVideo;