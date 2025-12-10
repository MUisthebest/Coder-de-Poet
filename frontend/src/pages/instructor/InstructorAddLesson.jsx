import React, { useState, useEffect } from "react";
import instructorService from "../../services/instructorService";
import { FiUploadCloud, FiVideo, FiBook, FiFileText, FiX } from "react-icons/fi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "blockquote", "code-block"],
    ["clean"],
  ],
};

const InstructorAddLesson = ({ onClose, preSelectedCourse }) => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      const data = await instructorService.getCourses();
      setCourses(data.items || data || []);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (preSelectedCourse?.id) {
      setCourseId(preSelectedCourse.id);
    }
  }, [preSelectedCourse]);

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      setUploading(true);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) setVideoUrl(data.secure_url);
      else throw new Error("Upload failed");
    } catch (err) {
      console.error(err);
      setError("Video upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!courseId || !title) {
      setError("Please fill in all required fields.");
      return;
    }

    const payload = {
      courseId,
      title,
      contentType: videoUrl ? "video" : "text",
      contentUrl: videoUrl || "",
      contentBody,
      position: 1,
    };

    try {
      setSaving(true);
      await instructorService.createLesson(payload);
      setSuccess("Lesson created successfully!");
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error(err);
      setError("Failed to save lesson.");
    } finally {
      setSaving(false);
    }
  };

  return (
    // 🌟 Overlay sáng + blur mờ nền
    <div className="fixed inset-0 backdrop-blur-sm bg-white/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[100vh] overflow-y-auto p-6 relative animate-fadeIn border border-gray-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <FiX className="text-2xl" />
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2 h-[5vh]">
          <FiBook className="text-blue-600" />
          Add New Lesson
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-md mb-4">
            {success}
          </div>
        )}

        <div className="space-y-5 h-[calc(88vh_-_12px)]">
          {/* Select Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Lesson Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          {/* Upload Video */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FiVideo /> Lesson Video (optional)
            </label>
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="rounded-lg w-full max-h-64 object-cover mb-2"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="videoUpload"
                />
                <label
                  htmlFor="videoUpload"
                  className="cursor-pointer flex flex-col items-center text-gray-500"
                >
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin h-6 w-6 text-blue-500 mb-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FiUploadCloud className="text-blue-400 text-3xl mb-2" />
                      <span className="text-sm">Click to upload video</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Rich Text Editor */}
          <div className="max-h-[250px]"> 
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"> 
                <FiFileText /> Lesson Content 
            </label> 
            <ReactQuill 
                theme="snow" 
                value={contentBody} 
                onChange={setContentBody} 
                modules={quillModules} 
                placeholder="Write lesson content here..." 
                className="bg-white rounded-lg border border-gray-200" 
            /> 
        </div> 
        <style>
            {`
                .ql-container {
                min-height: 150px;
                max-height: 200px;
                }
                .ql-editor {
                max-height: 200px;
                }
            `}
        </style>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 h-[calc(8vh_-_4px)]">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 border border-gray-300 flex items-center rounded-lg hover:bg-gray-100 transition"
            >
              <p>Cancel</p>
            </button>
            <button
              disabled={saving || uploading}
              onClick={handleSaveLesson}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 flex items-center text-white rounded-lg font-medium shadow-sm transition"
            >
              <p>{saving ? "Saving..." : "Save Lesson"}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorAddLesson;
