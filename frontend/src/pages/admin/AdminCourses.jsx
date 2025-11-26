// components/AdminCourses.js
import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

function AdminCourses() {
  const [coursesData, setCoursesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sử dụng AuthContext
  const { isAdmin, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      checkAccessAndLoadData();
    }
  }, [authLoading]);

  const checkAccessAndLoadData = async () => {
    // Kiểm tra role từ AuthContext
    if (!isAdmin) {
      setError('Bạn không có quyền quản lý khóa học. Cần role Admin hoặc Instructor.');
      setLoading(false);
      return;
    }

    await loadCoursesData();
  };

  const loadCoursesData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await adminService.getAdminCourses();
      
      if (result.success) {
        setCoursesData(result.data);
      } else {
        setError(result.error || 'Failed to load courses data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <p className="text-gray-600 mt-2">
          {coursesData?.message || 'Manage your courses'}
        </p>
        <p className="text-sm text-gray-500">
          Your role: {coursesData?.userRole}
        </p>
      </div>

      {/* Courses List */}
      {coursesData?.courses && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Total Courses: {coursesData.totalCourses}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {coursesData.courses.map((course) => (
              <div key={course.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {course.title}
                    </h3>
                    <p className="text-gray-600">Instructor: {course.instructor}</p>
                    <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                      <span>Students: {course.students}</span>
                      <span>Price: ${course.price}</span>
                      <span className={`px-2 py-1 rounded ${
                        course.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Created: {course.createdDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Access Info:</strong> Accessed by {coursesData?.userRole} at {new Date(coursesData?.accessTime).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default AdminCourses;