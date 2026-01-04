import instructorService from "../../services/instructorService";
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, Globe, Lock, Unlock, Upload, Image, Trash2 } from 'lucide-react';
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';

const InstructorAddCourse = ({ onClose, onSuccess, categories = [] }) => {
  const { user: instructorId} = useAuth();
  const fileInputRef = useRef(null);

  // State chính - chỉ chứa các trường trong DTO
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    accessType: 'free',
    status: 'draft',
    tag: {}, // Để trống object hoặc null
    thumbnailUrl: '', // Thêm thumbnailUrl
  });

  // State cho UI (không gửi lên API)
  const [uiData, setUiData] = useState({
    tagsInput: '', // Chỉ để nhập tags từ UI
    price: '', // Chỉ để hiển thị (nếu cần)
    thumbnailPreview: null, // URL preview cho thumbnail
    thumbnailFile: null, // File thumbnail để upload
    uploadProgress: 0, // Tiến độ upload
    isUploading: false, // Trạng thái upload
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/instructor/dashboard';

  // Auto-generate slug từ title
  useEffect(() => {
    if (formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }));
    }
  }, [formData.title]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Nếu là field của formData
    if (name in formData) {
      setFormData({
        ...formData,
        [name]: value,
      });
    } else {
      // Nếu là field của uiData
      setUiData({
        ...uiData,
        [name]: value,
      });
    }
    
    // Clear error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Xử lý upload thumbnail
  const handleThumbnailUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUiData(prev => ({ 
      ...prev, 
      isUploading: true, 
      uploadProgress: 0 
    }));

    try {
      // Tạo preview URL
      const previewUrl = URL.createObjectURL(file);
      setUiData(prev => ({ 
        ...prev, 
        thumbnailPreview: previewUrl,
        thumbnailFile: file 
      }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUiData(prev => {
          if (prev.uploadProgress >= 90) {
            clearInterval(progressInterval);
            return { ...prev, uploadProgress: 90 };
          }
          return { ...prev, uploadProgress: prev.uploadProgress + 10 };
        });
      }, 100);

      // Upload file lên server
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await instructorService.uploadThumbnail(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUiData(prev => ({ ...prev, uploadProgress: percentCompleted }));
        }
      });

      clearInterval(progressInterval);
      
      // Cập nhật thumbnailUrl trong formData
      if (response.data && response.data.url) {
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: response.data.url
        }));
        setUiData(prev => ({ 
          ...prev, 
          uploadProgress: 100,
          isUploading: false 
        }));
        
        setTimeout(() => {
          setUiData(prev => ({ ...prev, uploadProgress: 0 }));
        }, 1000);
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      setUiData(prev => ({ 
        ...prev, 
        isUploading: false,
        thumbnailPreview: null,
        thumbnailFile: null 
      }));
      alert('Failed to upload thumbnail. Please try again.');
    }
  };

  // Xử lý khi click vào thumbnail area
  const handleThumbnailClick = () => {
    if (!uiData.isUploading) {
      fileInputRef.current.click();
    }
  };

  // Xử lý khi chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleThumbnailUpload(file);
    }
  };

  // Xóa thumbnail
  const handleRemoveThumbnail = () => {
    if (uiData.thumbnailPreview) {
      URL.revokeObjectURL(uiData.thumbnailPreview);
    }
    setUiData(prev => ({ 
      ...prev, 
      thumbnailPreview: null,
      thumbnailFile: null,
      uploadProgress: 0,
      isUploading: false 
    }));
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: ''
    }));
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Kéo và thả file
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleThumbnailUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Xử lý tags input
  const handleTagsChange = (e) => {
    const value = e.target.value;
    setUiData(prev => ({ ...prev, tagsInput: value }));
    
    // Chuyển tags string thành object
    if (value.trim()) {
      const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag);
      setFormData(prev => ({
        ...prev,
        tag: { tags: tagsArray }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        tag: {}
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    
    if (!formData.accessType) {
      newErrors.accessType = 'Please select access type';
    }

    // Validate thumbnail (optional)
    if (!formData.thumbnailUrl) {
      console.log('Thumbnail is optional, but recommended');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Chuẩn bị payload đúng với DTO
      // Không gửi instructorId - sẽ được thêm từ backend qua req.user.id
      // thumbnailUrl sẽ được tự động lấy từ video của lesson đầu tiên
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        categoryId: formData.categoryId,
        accessType: formData.accessType,
        status: formData.status,
        tag: Object.keys(formData.tag).length > 0 ? formData.tag : undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined, // Thêm thumbnailUrl
      };

      console.log('Sending payload:', payload);

      // Gọi API
      const response = await createCourse(payload);
      
      // Clean up preview URL
      if (uiData.thumbnailPreview) {
        URL.revokeObjectURL(uiData.thumbnailPreview);
      }
      
      // Thông báo thành công
      alert('Course created successfully!');
      
      // Gọi callback để refetch courses và đóng modal
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
      
      navigate('/instructor/dashboard', {replace: true});

    } catch (error) {
      console.error('Error creating course:', error);
      
      // Xử lý lỗi từ API
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        // Xử lý validation errors từ backend
        const backendErrors = error.response.data.errors;
        const errorMessages = Object.values(backendErrors).flat().join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert('Failed to create course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mẫu categories - nên truyền từ props
  const defaultCategories = categories.length > 0 ? categories : [
    { id: 'web-development', name: 'Web Development' },
    { id: 'mobile-development', name: 'Mobile Development' },
    { id: 'data-science', name: 'Data Science' },
    { id: 'design', name: 'Design' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto modal-scroll">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
            <p className="text-gray-500 text-sm mt-1">Fill in the required information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
            disabled={loading || uiData.isUploading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Thumbnail Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Image size={20} />
                Course Thumbnail
                <span className="text-sm font-normal text-gray-500">(Recommended)</span>
              </h3>
              
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={uiData.isUploading}
                />
                
                <div
                  className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${
                    uiData.thumbnailPreview 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                  } ${uiData.isUploading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={handleThumbnailClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {uiData.thumbnailPreview ? (
                    <div className="relative">
                      <img
                        src={uiData.thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveThumbnail();
                        }}
                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        disabled={uiData.isUploading}
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      {/* Upload progress */}
                      {uiData.isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">Uploading... {uiData.uploadProgress}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-blue-100 rounded-full">
                          <Upload size={32} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Click to upload thumbnail
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            PNG, JPG, WebP or GIF (max. 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                {uiData.isUploading && uiData.uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Uploading...</span>
                      <span className="font-medium">{uiData.uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uiData.uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Thumbnail tips */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Tips:</strong> Use a high-quality image (1280×720 pixels recommended). 
                    This will be the first thing students see when browsing your course.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={20} />
                Basic Information
              </h3>
              
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Complete Web Development Bootcamp"
                  disabled={loading || uiData.isUploading}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Slug (read-only, tự động generate) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Course Slug *
                  <span className="text-gray-400 ml-1">(auto-generated)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-gray-50 ${
                      errors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="auto-generated-slug"
                    disabled={loading || uiData.isUploading}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const slug = prompt('Enter custom slug:', formData.slug);
                      if (slug && slug.trim()) {
                        setFormData(prev => ({ ...prev, slug: slug.trim() }));
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm"
                    disabled={loading || uiData.isUploading}
                  >
                    Edit
                  </button>
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe what students will learn in this course..."
                  disabled={loading || uiData.isUploading}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Category & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || uiData.isUploading}
                  required
                >
                  <option value="">Select a category</option>
                  {defaultCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-red-600">{errors.categoryId}</p>
                )}
              </div>

              {/* Access Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Access Type *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accessType: 'free' }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition ${
                      formData.accessType === 'free' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    } ${uiData.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading || uiData.isUploading}
                  >
                    <Globe size={18} />
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accessType: 'premium' }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition ${
                      formData.accessType === 'premium' 
                        ? 'bg-purple-50 border-purple-500 text-purple-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    } ${uiData.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading || uiData.isUploading}
                  >
                    <Lock size={18} />
                    Premium
                  </button>
                </div>
                <input type="hidden" name="accessType" value={formData.accessType} />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={loading || uiData.isUploading}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag size={16} />
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  name="tagsInput"
                  value={uiData.tagsInput}
                  onChange={handleTagsChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="javascript, react, web-development"
                  disabled={loading || uiData.isUploading}
                />
                <p className="text-xs text-gray-500">Separate tags with commas</p>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
              disabled={loading || uiData.isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uiData.isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : uiData.isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Calendar size={18} />
                  <span>Create Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hàm API createCourse
const createCourse = async (payload) => {
  // Import hoặc định nghĩa apiCourse từ module của bạn
  const response = await instructorService.createCourse(payload);
  return response.data;
};

// Animation CSS
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out;
}

.modal-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.modal-scroll::-webkit-scrollbar {
  width: 3px;
}

.modal-scroll::-webkit-scrollbar-track {
  background: #0294f5ff;
}

.modal-scroll::-webkit-scrollbar-thumb {
    background-color: #2a91ffff;
    border-radius: 3px;
}

.modal-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #a0aec0;
}
`;

// Thêm styles vào head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default InstructorAddCourse;