import React, { useState, useEffect } from "react";
import instructorService from "../../services/instructorService";
import { FiUploadCloud, FiVideo, FiBook, FiFileText, FiX, FiImage } from "react-icons/fi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import getThumbnailUrl from "../../utils/getThumbnailUrl";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "blockquote", "code-block"],
    ["clean"],
  ],
};

// Helper functions
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
  if (!url) return null;
  return getThumbnailUrl(url);
};

// Tạo placeholder thumbnail nếu không có video
const getPlaceholderThumbnail = () => {
  return "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=450&fit=crop";
};

const InstructorAddLesson = ({ onClose, onSuccess, MyCourse, preSelectedCourse }) => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedCourseData, setSelectedCourseData] = useState(null);

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
      setSelectedCourseData(preSelectedCourse);
    }
  }, [preSelectedCourse]);

  useEffect(() => {
    // Khi courseId thay đổi, tìm thông tin course
    if (courseId) {
      const course = MyCourse.find(c => c.id === courseId);
      setSelectedCourseData(course || null);
    }
  }, [courseId, MyCourse]);

  useEffect(() => {
    // Khi videoUrl thay đổi, tự động tạo thumbnail
    if (videoUrl) {
      const thumbnail = getThumbnail(videoUrl);
      if (thumbnail) {
        setThumbnailUrl(thumbnail);
        console.log("Auto-generated thumbnail:", thumbnail);
      } else {
        // Nếu không thể tạo thumbnail từ video, sử dụng placeholder
        setThumbnailUrl(getPlaceholderThumbnail());
      }
    } else {
      setThumbnailUrl("");
    }
  }, [videoUrl]);

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
      setError(null);
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        { method: "POST", body: formData }
      );
      
      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.secure_url) {
        setVideoUrl(data.secure_url);
        console.log("Video uploaded successfully:", data.secure_url);
      } else {
        throw new Error("Upload failed - no secure_url returned");
      }
    } catch (err) {
      console.error("Video upload error:", err);
      setError(`Video upload failed: ${err.message}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const updateCourseThumbnail = async (courseId, thumbnailUrl) => {
    try {
      console.log(`Updating course ${courseId} thumbnail to:`, thumbnailUrl);
      
      const payload = {
        thumbnailUrl: thumbnailUrl
      };

      const response = await instructorService.updateCourse(courseId, payload);
      console.log("Course thumbnail updated successfully:", response);
      return response;
    } catch (error) {
      console.error("Error updating course thumbnail:", error);
      throw error;
    }
  };

  const handleSaveLesson = async () => {
    if (!courseId || !title) {
      setError("Please fill in all required fields.");
      return;
    }

    // Tạo payload cho lesson
    const payload = {
      courseId,
      title,
      contentType: videoUrl ? "video" : "text",
      position: 1,
    };

    // Only add contentUrl if it's a valid URL
    if (videoUrl && videoUrl.trim()) {
      payload.contentUrl = videoUrl;
    }

    // Only add contentBody if it exists and has content
    if (contentBody && contentBody.trim()) {
      payload.contentBody = contentBody;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Step 1: Tạo lesson trước
      const lessonResponse = await instructorService.createLesson(payload);
      console.log("Lesson created:", lessonResponse);
      
      // Step 2: Nếu có video và có thể tạo thumbnail, cập nhật thumbnail cho course
      if (videoUrl && thumbnailUrl) {
        try {
          // Kiểm tra xem course đã có thumbnail chưa
          const currentCourse = selectedCourseData;
          
          // Chỉ cập nhật thumbnail nếu course chưa có thumbnail
          // hoặc nếu muốn luôn cập nhật khi có lesson video mới
          if (!currentCourse?.thumbnailUrl || true) { // true = luôn cập nhật
            await updateCourseThumbnail(courseId, thumbnailUrl);
            console.log("Course thumbnail auto-updated from lesson video");
          } else {
            console.log("Course already has thumbnail, skipping auto-update");
          }
        } catch (thumbnailError) {
          console.warn("Failed to auto-update course thumbnail, but lesson was created:", thumbnailError);
          // Không throw error ở đây vì lesson đã tạo thành công
        }
      }
      
      setSuccess("Lesson created successfully! Course thumbnail has been auto-updated.");
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            lesson: lessonResponse,
            thumbnailUpdated: !!thumbnailUrl
          });
        } else {
          onClose();
        }
      }, 1500);
    } catch (err) {
      console.error("Save lesson error:", err);
      setError(err.response?.data?.message || "Failed to save lesson. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualThumbnailUpdate = async () => {
    if (!courseId || !thumbnailUrl) {
      setError("No course selected or thumbnail available");
      return;
    }

    try {
      setSaving(true);
      await updateCourseThumbnail(courseId, thumbnailUrl);
      setSuccess("Course thumbnail updated manually!");
    } catch (err) {
      setError("Failed to update thumbnail: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/40 flex justify-center items-center z-50">
      <div className="bg-white shadow-xl w-full max-w-4xl max-h-[100vh] overflow-y-auto p-6 relative animate-fadeIn border border-gray-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <FiX className="text-2xl" />
        </button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
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

        <div className="space-y-5">
          {/* Course Info Preview */}
          {selectedCourseData && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-2">Selected Course</h3>
              <div className="flex items-center gap-3">
                {selectedCourseData.thumbnailUrl ? (
                  <img 
                    src={selectedCourseData.thumbnailUrl} 
                    alt="Course thumbnail" 
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <FiImage className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedCourseData.title}</p>
                  <p className="text-sm text-gray-600">
                    Current thumbnail: {selectedCourseData.thumbnailUrl ? "✅ Set" : "❌ Not set"}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              {MyCourse.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.thumbnailUrl ? " (has thumbnail)" : " (no thumbnail)"}
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

          {/* Upload Video & Thumbnail Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiVideo /> Lesson Video (optional)
              </label>
              {videoUrl ? (
                <div className="space-y-3">
                  <video
                    src={videoUrl}
                    controls
                    className="rounded-lg w-full max-h-64 object-cover"
                  />
                  <p className="text-xs text-green-600">
                    ✅ Video uploaded successfully. Thumbnail will be auto-generated.
                  </p>
                </div>
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
                        <span className="text-xs mt-1">(Will auto-generate course thumbnail)</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            {/* Thumbnail Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiImage /> Auto-generated Thumbnail Preview
              </label>
              <div className="border border-gray-200 rounded-lg p-4 h-full flex flex-col">
                {thumbnailUrl ? (
                  <>
                    <div className="flex-1 mb-3">
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>📌 This thumbnail will be auto-updated to the course</p>
                      <p>🔗 Source: {videoUrl.includes('youtube') ? 'YouTube' : 'Cloudinary'}</p>
                      {courseId && (
                        <button
                          type="button"
                          onClick={handleManualThumbnailUpdate}
                          className="mt-2 text-xs px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                          disabled={saving}
                        >
                          Update thumbnail now
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <FiImage className="text-4xl mb-2" />
                    <p className="text-sm">Upload a video to generate thumbnail</p>
                    <p className="text-xs mt-1">(YouTube or Cloudinary videos only)</p>
                  </div>
                )}
              </div>
            </div>
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

          {/* Course Thumbnail Auto-Update Notice */}
          {videoUrl && thumbnailUrl && courseId && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">ℹ️</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Course Thumbnail Auto-Update</p>
                  <p>When you save this lesson, the course thumbnail will be automatically updated using the first frame of this video.</p>
                  {selectedCourseData?.thumbnailUrl && (
                    <p className="mt-1 text-xs">Note: This will replace the existing thumbnail.</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 border border-gray-300 flex items-center rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || uploading}
              onClick={handleSaveLesson}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 flex items-center text-white rounded-lg font-medium shadow-sm transition"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                "Save Lesson & Update Thumbnail"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorAddLesson;