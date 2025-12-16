// components/AdminCourses.js
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

function AdminCourses() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const instructorId = searchParams.get('instructorId') || '';

  useEffect(() => {
    if (!authLoading) {
      init();
    }
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading && instructorId) {
      loadCourses(instructorId);
    }
  }, [authLoading, instructorId]);

  const init = async () => {
    if (!isAdmin) {
      setError('Bạn không có quyền quản lý khóa học. Cần role Admin.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getInstructors();
      if (!res.success) throw new Error(res.error || 'Failed to load instructors');
      setInstructors(res.data);

      // Default to first instructor if none selected
      if (!instructorId && res.data.length > 0) {
        setSearchParams({ instructorId: res.data[0].instructorId });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (id) => {
    try {
      setLoading(true);
      const res = await adminService.getInstructorCourses(id);
      if (!res.success) throw new Error(res.error || 'Failed to load courses');
      setCourses(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedInstructor = useMemo(() => {
    return instructors.find((i) => i.instructorId === instructorId);
  }, [instructors, instructorId]);

  const handleSelectInstructor = (e) => {
    const id = e.target.value;
    setSearchParams({ instructorId: id });
  };

  const handleDelete = async (courseId) => {
    const confirmed = window.confirm('Are you sure you want to delete this course? This action cannot be undone.');
    if (!confirmed) return;
    const res = await adminService.deleteCourse(courseId);
    if (!res.success) {
      alert(res.error || 'Failed to delete course');
      return;
    }
    await loadCourses(instructorId);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  console.log(error);

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-2">Manage courses by instructor</p>
        </div>
        <div>
          <label className="mr-2 text-sm text-gray-600">Instructor:</label>
          <select
            value={instructorId}
            onChange={handleSelectInstructor}
            className="border rounded px-3 py-2 text-sm"
          >
            {instructors.map((i) => (
              <option key={i.instructorId} value={i.instructorId}>
                {i.instructorId} ({i.courseCount} courses)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedInstructor ? `Courses of ${selectedInstructor.instructorId}` : 'Courses'}
          </h2>
          <div className="text-sm text-gray-500">Total: {courses.length}</div>
        </div>

        <div className="divide-y divide-gray-200">
          {courses.map((course) => (
            <div key={course.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                    <span>Status: {course.status || 'draft'}</span>
                    {typeof course.student_count === 'number' && (
                      <span>Students: {course.student_count}</span>
                    )}
                    {course.category_id && <span>Category ID: {course.category_id}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Updated: {course.updated_at ? new Date(course.updated_at).toLocaleString() : '—'}
                  </div>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500">No courses found for this instructor.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCourses;