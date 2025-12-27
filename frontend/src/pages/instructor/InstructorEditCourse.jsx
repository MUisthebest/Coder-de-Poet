import React, { useState, useEffect } from 'react';
import instructorService from "../../services/instructorService";
import { X, Upload, Calendar, Tag, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";

const InstructorEditCourse = ({ onClose, course, categories = [] }) => {
  const navigate = useNavigate();
  const { user: instructorId} = useAuth();

  const [formData, setFormData] = useState({
    title: course?.title || '',
    slug: course?.slug || '',
    description: course?.description || '',
    categoryId: course?.category_id || '',
    accessType: course?.access_type || 'free',
    status: course?.status || 'draft',
    thumbnailUrl: course?.thumbnail_url || '',
    tag: Array.isArray(course?.tag) ? { tags: course.tag } : {},
  });

  const [uiData, setUiData] = useState({
    tagsInput: Array.isArray(course?.tag) ? course.tag.join(', ') : '',
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(course?.thumbnail_url || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    setUiData((prev) => ({ ...prev, tagsInput: value }));
    const tagsArray = value.split(',').map((t) => t.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, tag: { tags: tagsArray } }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
        setFormData((prev) => ({ ...prev, thumbnailUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.categoryId) newErrors.categoryId = "Please select a category";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const tags = formData.tag?.tags?.filter(Boolean) ?? [];

      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        categoryId: formData.categoryId,   // UUID
        accessType: formData.accessType,   // free | premium
        status: formData.status || undefined,
        tag: tags.length ? { tags } : undefined,
      };

      await instructorService.updateCourse(course.id, payload);
      alert("Course updated successfully!");
      onClose();
      navigate(0);
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Failed to update course. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  if (!categories || categories.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto modal-scroll">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Edit Course</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg"
              disabled={loading}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border rounded-lg"
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category *
            </label>

            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg"
              disabled={loading}
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Tag size={16} /> Tags (comma separated)
            </label>
            <input
              type="text"
              name="tagsInput"
              value={uiData.tagsInput}
              onChange={handleTagsChange}
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>

          {/* Thumbnail */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Thumbnail</h3>
            {thumbnailPreview ? (
              <div className="relative">
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                  disabled={loading}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleThumbnailChange} />
            )}
          </div>

          {/* Footer */}
          <div className="pt-6 border-t flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border rounded-lg text-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {loading ? (
                <span>Updating...</span>
              ) : (
                <>
                  <Calendar size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorEditCourse;
