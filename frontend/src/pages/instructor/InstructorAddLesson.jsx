import React, { useState, useEffect } from "react";
import instructorService from "../../services/instructorService";
import { FiUploadCloud, FiVideo, FiBook, FiFileText, FiX, FiImage } from "react-icons/fi";
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

// Cải tiến hàm lấy thumbnail
const getThumbnail = (url) => {
  if (!url) return "";
  
  // YouTube video
  if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
    let videoId = "";
    
    // Xử lý nhiều định dạng YouTube URL
    if (url.includes("youtube.com/watch")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }
    
    if (videoId) {
      // Các lựa chọn thumbnail chất lượng khác nhau
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return "";
  }
  
  // Cloudinary video - Cải tiến để có nhiều tùy chọn
  if (url.includes("cloudinary.com") && url.includes("/video/upload/")) {
    // Tách URL để xử lý
    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) return "";
    
    const transformation = urlParts[1];
    
    // Các tùy chọn thumbnail khác nhau từ Cloudinary:
    // 1. Thumbnail từ frame đầu tiên (so_0)
    // 2. Thumbnail từ frame giữa (so_50)
    // 3. Thumbnail với chất lượng tốt
    const baseUrl = `${urlParts[0]}/upload/`;
    
    // Tạo thumbnail với các transformation tốt hơn
    const thumbnailOptions = [
      `w_800,h_450,c_fill,so_0/${transformation.replace(/\.[^/.]+$/, '.jpg')}`, // Frame đầu
      `w_800,h_450,c_fill,so_50/${transformation.replace(/\.[^/.]+$/, '.jpg')}`, // Frame giữa
      `c_thumb,w_800,h_450,g_face/${transformation.replace(/\.[^/.]+$/, '.jpg')}`, // Face detection
    ];
    
    // Thử lấy thumbnail từ frame đầu tiên
    return `${baseUrl}${thumbnailOptions[0]}`;
  }
  
  // Cloudinary image (đã là ảnh)
  if (url.includes("cloudinary.com") && url.includes("/image/upload/")) {
    // Optimize existing image for thumbnail
    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) return url;
    
    const transformation = urlParts[1];
    const baseUrl = `${urlParts[0]}/upload/`;
    
    // Thêm transformation để tối ưu cho thumbnail
    return `${baseUrl}w_800,h_450,c_fill/${transformation}`;
  }
  
  // Nếu là video từ nguồn khác, thử lấy poster/thumbnail
  if (url.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
    // Đối với video file trực tiếp, không thể lấy thumbnail trực tiếp
    // Cần upload thumbnail riêng hoặc sử dụng placeholder
    return "";
  }
  
  return "";
};

// Tạo placeholder thumbnail chất lượng cao
const getPlaceholderThumbnail = (type = "video") => {
  const placeholders = {
    video: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=450&fit=crop&auto=format",
    course: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=450&fit=crop&auto=format",
    lesson: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop&auto=format"
  };
  
  return placeholders[type] || placeholders.video;
};

// Hàm upload thumbnail riêng biệt lên Cloudinary
const uploadThumbnailToCloudinary = async (file) => {
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "course_thumbnails");
  formData.append("transformation", "w_800,h_450,c_fill"); // Tối ưu cho thumbnail
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    
    if (!response.ok) throw new Error("Upload failed");
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    throw error;
  }
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
  const [thumbnailType, setThumbnailType] = useState("auto"); // "auto", "custom", "placeholder"
  const [customThumbnailFile, setCustomThumbnailFile] = useState(null);
  const [customThumbnailPreview, setCustomThumbnailPreview] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      const data = await instructorService.getCourses();
      setCourses(data.items || data || []);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const course = MyCourse[0];
    if (course) {
      setCourseId(course.id);
      setSelectedCourseData(course);
    }
    else {
      setCourseId("");
      setSelectedCourseData(null);
    }
  }, [MyCourse]);

  useEffect(() => {
    // Khi videoUrl thay đổi, tự động tạo thumbnail nếu đang ở chế độ auto
    if (thumbnailType === "auto" && videoUrl) {
      const thumbnail = getThumbnail(videoUrl);
      if (thumbnail) {
        setThumbnailUrl(thumbnail);
        console.log("Auto-generated thumbnail:", thumbnail);
      } else {
        // Nếu không thể tạo thumbnail từ video, sử dụng placeholder
        setThumbnailUrl(getPlaceholderThumbnail("video"));
      }
    } else if (thumbnailType === "placeholder") {
      setThumbnailUrl(getPlaceholderThumbnail("course"));
    }
    // custom thumbnail được xử lý riêng
  }, [videoUrl, thumbnailType]);

  // Xử lý upload custom thumbnail
  const handleCustomThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file for thumbnail");
      return;
    }

    // Giới hạn kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Thumbnail size should be less than 5MB");
      return;
    }

    setCustomThumbnailFile(file);
    
    // Tạo preview
    const previewUrl = URL.createObjectURL(file);
    setCustomThumbnailPreview(previewUrl);
    setThumbnailUrl(previewUrl); // Set preview tạm thời
    setThumbnailType("custom");
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "course_videos");
    formData.append("resource_type", "video");

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
        
        // Tự động chuyển sang chế độ auto thumbnail
        setThumbnailType("auto");
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

    let finalThumbnailUrl = thumbnailUrl;

    // Nếu có custom thumbnail file, upload lên Cloudinary trước
    if (thumbnailType === "custom" && customThumbnailFile) {
      try {
        setSaving(true);
        setError(null);
        
        const uploadedUrl = await uploadThumbnailToCloudinary(customThumbnailFile);
        finalThumbnailUrl = uploadedUrl;
        console.log("Custom thumbnail uploaded:", uploadedUrl);
      } catch (err) {
        console.error("Custom thumbnail upload failed:", err);
        setError("Failed to upload custom thumbnail. Please try again.");
        setSaving(false);
        return;
      }
    }

    // Tạo payload cho lesson
    const payload = {
      courseId,
      title,
      contentType: videoUrl ? "video" : "text",
      position: 1,
    };

    if (videoUrl && videoUrl.trim()) {
      payload.contentUrl = videoUrl;
    }

    if (contentBody && contentBody.trim()) {
      payload.contentBody = contentBody;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Step 1: Tạo lesson trước
      const lessonResponse = await instructorService.createLesson(payload);
      console.log("Lesson created:", lessonResponse);
      
      // Step 2: Cập nhật thumbnail cho course nếu có
      if (finalThumbnailUrl) {
        try {
          await updateCourseThumbnail(courseId, finalThumbnailUrl);
          console.log("Course thumbnail updated from lesson:", finalThumbnailUrl);
        } catch (thumbnailError) {
          console.warn("Failed to auto-update course thumbnail, but lesson was created:", thumbnailError);
        }
      }
      
      setSuccess("Lesson created successfully! Course thumbnail has been updated.");
      
      // Cleanup preview URL
      if (customThumbnailPreview) {
        URL.revokeObjectURL(customThumbnailPreview);
      }
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            lesson: lessonResponse,
            thumbnailUpdated: !!finalThumbnailUrl,
            thumbnailUrl: finalThumbnailUrl
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

  const handleThumbnailTypeChange = (type) => {
    setThumbnailType(type);
    
    switch(type) {
      case "auto":
        if (videoUrl) {
          const autoThumbnail = getThumbnail(videoUrl);
          setThumbnailUrl(autoThumbnail || getPlaceholderThumbnail("video"));
        }
        break;
      case "placeholder":
        setThumbnailUrl(getPlaceholderThumbnail("course"));
        break;
      case "custom":
        // Giữ nguyên custom thumbnail preview nếu có
        if (customThumbnailPreview) {
          setThumbnailUrl(customThumbnailPreview);
        }
        break;
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

          {/* Upload Video */}
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
                  ✅ Video uploaded successfully.
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
                      <span className="text-xs mt-1">Supports: MP4, WebM, MOV, AVI (max 500MB)</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Thumbnail Selection Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiImage /> Course Thumbnail Selection
            </label>
            
            {/* Thumbnail Type Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleThumbnailTypeChange("auto")}
                className={`px-3 py-2 text-sm rounded-md border ${
                  thumbnailType === "auto" 
                    ? "bg-blue-50 border-blue-500 text-blue-700" 
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Auto from Video
              </button>
              <button
                type="button"
                onClick={() => handleThumbnailTypeChange("custom")}
                className={`px-3 py-2 text-sm rounded-md border ${
                  thumbnailType === "custom" 
                    ? "bg-blue-50 border-blue-500 text-blue-700" 
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Custom Upload
              </button>
              <button
                type="button"
                onClick={() => handleThumbnailTypeChange("placeholder")}
                className={`px-3 py-2 text-sm rounded-md border ${
                  thumbnailType === "placeholder" 
                    ? "bg-blue-50 border-blue-500 text-blue-700" 
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Use Placeholder
              </button>
            </div>
            
            {/* Thumbnail Preview Area */}
            <div className="mt-4">
              {thumbnailType === "custom" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Custom Thumbnail
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomThumbnailUpload}
                      className="hidden"
                      id="thumbnailUpload"
                    />
                    <label
                      htmlFor="thumbnailUpload"
                      className="cursor-pointer flex flex-col items-center text-gray-500"
                    >
                      <FiUploadCloud className="text-blue-400 text-2xl mb-2" />
                      <span className="text-sm">Click to upload custom thumbnail</span>
                      <span className="text-xs mt-1">Recommended: 800x450px, JPG/PNG (max 5MB)</span>
                    </label>
                  </div>
                  
                  {customThumbnailPreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <img
                        src={customThumbnailPreview}
                        alt="Custom thumbnail preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="relative">
                    <img
                      src={thumbnailUrl || getPlaceholderThumbnail("course")}
                      alt="Thumbnail preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {thumbnailType === "auto" ? "Auto-generated" : "Placeholder"}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {thumbnailType === "auto" 
                      ? "Thumbnail will be automatically generated from the video" 
                      : "Using high-quality placeholder image"}
                  </p>
                </div>
              )}
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

          {/* Thumbnail Auto-Update Notice */}
          {thumbnailUrl && courseId && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">ℹ️</span>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Course Thumbnail Update</p>
                  <p>When you save this lesson, the course thumbnail will be updated using the selected thumbnail above.</p>
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