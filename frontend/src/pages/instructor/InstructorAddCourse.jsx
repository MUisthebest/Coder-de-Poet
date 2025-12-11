import instructorService from "../../services/instructorService";
import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, Tag, Globe, Lock, Unlock } from 'lucide-react';
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';

const InstructorAddCourse = ({ onClose, categories = [] }) => {
  const { user: instructorId} = useAuth();

  // State chính - chỉ chứa các trường trong DTO
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    accessType: 'free',
    status: 'draft',
    thumbnailUrl: '',
    tag: {}, // Để trống object hoặc null
  });

  // State cho UI (không gửi lên API)
  const [uiData, setUiData] = useState({
    tagsInput: '', // Chỉ để nhập tags từ UI
    price: '', // Chỉ để hiển thị (nếu cần)
  });

  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
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

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          thumbnailUrl: 'Image size should be less than 5MB'
        }));
        return;
      }

      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          thumbnailUrl: 'Please upload an image file'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: reader.result // Base64 string
        }));
        setErrors(prev => ({
          ...prev,
          thumbnailUrl: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: ''
    }));
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

    // Validate URL nếu có thumbnail
    if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
      newErrors.thumbnailUrl = 'Please enter a valid URL or upload an image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      // Kiểm tra base64 string
      if (string.startsWith('data:image')) {
        return true;
      }
      
      // Kiểm tra URL thông thường
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
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
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        categoryId: formData.categoryId,
        accessType: formData.accessType,
        status: formData.status,
        thumbnailUrl: formData.thumbnailUrl || undefined, // Gửi undefined nếu rỗng
        tag: Object.keys(formData.tag).length > 0 ? formData.tag : undefined,
        // Không gửi updatedAt - sẽ tự động cập nhật
      };

      console.log('Sending payload:', payload);

      // Gọi API
      const response = await createCourse(payload);
      
      // Thông báo thành công
      alert('Course created successfully!');
      
      // Đóng modal
      onClose();
      
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
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
            <p className="text-gray-500 text-sm mt-1">Fill in the required information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
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
                  disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                    }`}
                    disabled={loading}
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
                    }`}
                    disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">Separate tags with commas</p>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Thumbnail (Optional)</h3>
              
              <div className="space-y-3">
                {thumbnailPreview ? (
                  <div className="relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                      <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag & drop or click to upload thumbnail
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Recommended: 1280x720px, max 5MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={loading}
                      />
                    </div>
                    
                    {/* Hoặc nhập URL */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Or enter thumbnail URL:
                      </label>
                      <input
                        type="url"
                        name="thumbnailUrl"
                        value={formData.thumbnailUrl}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                          errors.thumbnailUrl ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="https://example.com/thumbnail.jpg"
                        disabled={loading || thumbnailPreview}
                      />
                      {errors.thumbnailUrl && (
                        <p className="text-sm text-red-600">{errors.thumbnailUrl}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
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