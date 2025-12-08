import React, { useEffect, useState } from "react";
import {
  FiX,
  FiBookOpen,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiVideo,
} from "react-icons/fi";
import instructorService from "../../services/instructorService";

const CourseDetailModal = ({ course, onClose }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch lessons when modal opens
  useEffect(() => {
    const fetchLessons = async () => {
      if (!course?.id) return;
      try {
        setLoading(true);
        const data = await instructorService.getLessonsByCourse(course.id);
        setLessons(data);
        console.log("Fetched lessons:", data);
      } catch (err) {
        console.error("Error fetching lessons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [course]);

  if (!course) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative border border-gray-100 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FiX className="text-2xl" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={course.thumbnail_url || "https://via.placeholder.com/100"}
            alt="Course"
            className="w-28 h-20 rounded-lg object-cover"
          />
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FiBookOpen className="text-blue-500" />
              {course.title}
            </h2>
            <p className="text-sm text-gray-500">
              {course.category} • {course.status}
            </p>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-5">
          <div className="flex items-center gap-2 text-gray-700">
            <FiUsers /> {course.student_count || 0} students
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <FiCalendar /> Updated:{" "}
            {new Date(course.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* Description */}
        <div className="border-t pt-4 mb-6 text-gray-700 text-sm leading-relaxed">
          <p>
            {course.description ||
              "This course currently has no description. The instructor can update it later."}
          </p>
        </div>

        {/* Lessons List */}
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          Lessons
        </h3>
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading lessons...</div>
        ) : lessons.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            No lessons found for this course.
          </div>
        ) : (
          <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
            {lessons.map((lesson, i) => (
              <div
                key={lesson.id || i}
                className="flex justify-between items-center p-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  {lesson.content_type === "video" ? (
                    <FiVideo className="text-blue-500 text-lg" />
                  ) : (
                    <FiFileText className="text-gray-500 text-lg" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{lesson.title}</p>
                    <p className="text-xs text-gray-500">
                      {lesson.content_type} •{" "}
                      {new Date(lesson.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {lesson.content_url && (
                  <a
                    href={lesson.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Close
          </button>
          <button
            onClick={() => alert("Navigate to edit")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Edit Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailModal;
