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
  const [expanded, setExpanded] = useState({});
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [lessonsLoading, setLessonsLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const instructorId = searchParams.get('instructorId') || '';
  const statusParam = (searchParams.get('status') || 'all').toLowerCase();

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

  const filteredCourses = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    if (statusParam === 'all') return courses;
    return courses.filter((c) => {
      const status = (c.status || c.approval_status || '').toLowerCase();
      if (statusParam === 'pending') return status === 'pending' || status === 'draft';
      if (statusParam === 'approved') return status === 'approved' || status === 'published';
      if (statusParam === 'rejected') return status === 'rejected';
      return true;
    });
  }, [courses, statusParam]);

  const selectedInstructor = useMemo(() => {
    return instructors.find((i) => i.instructorId === instructorId);
  }, [instructors, instructorId]);

  const handleSelectInstructor = (e) => {
    const id = e.target.value;
    const params = {};
    params.instructorId = id;
    if (statusParam) params.status = statusParam;
    setSearchParams(params);
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

  const handleApprove = async (courseId) => {
    const confirmed = window.confirm('Approve this course?');
    if (!confirmed) return;
    const res = await adminService.approveCourse(courseId);
    if (!res.success) return alert(res.error || 'Failed to approve');
    await loadCourses(instructorId);
  };

  const handleReject = async (courseId) => {
    const reason = window.confirm('Reject this course?');
    if (!reason) return;
    const res = await adminService.rejectCourse(courseId);
    if (!res.success) return alert(res.error || 'Failed to reject');
    await loadCourses(instructorId);
  };

  const toggleLessons = async (courseId) => {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
    const nowExpanded = !expanded[courseId];
    if (nowExpanded && !lessonsByCourse[courseId]) {
      setLessonsLoading((prev) => ({ ...prev, [courseId]: true }));
      const res = await adminService.listLessons(courseId);
      if (res.success) {
        setLessonsByCourse((prev) => ({ ...prev, [courseId]: res.data }));
      } else {
        alert(res.error || 'Failed to load lessons');
      }
      setLessonsLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleDeleteLesson = async (courseId, lessonId) => {
    const ok = window.confirm('Delete this lesson? This cannot be undone.');
    if (!ok) return;
    const res = await adminService.deleteLesson(lessonId);
    if (!res.success) return alert(res.error || 'Failed to delete lesson');
    const refreshed = await adminService.listLessons(courseId);
    if (refreshed.success) setLessonsByCourse((p) => ({ ...p, [courseId]: refreshed.data }));
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
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

      {/* Status Filters */}
      <div className="mb-4 flex gap-2 text-sm">
        {['all','pending','approved','rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ instructorId, status: s })}
            className={`${statusParam===s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-3 py-1 rounded`}
          >
            {s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedInstructor ? `Courses of ${selectedInstructor.instructorId}` : 'Courses'}
          </h2>
          <div className="text-sm text-gray-500">Total: {courses.length}</div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-200">
          {filteredCourses.map((course) => (
            <div key={course.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                    <span>
                      Status:
                      <span className={`ml-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        ((course.status||'').toLowerCase()==='approved' || (course.status||'').toLowerCase()==='published') ? 'bg-green-100 text-green-800' :
                        ((course.status||'').toLowerCase()==='pending' || (course.status||'').toLowerCase()==='draft') ? 'bg-amber-100 text-amber-800' :
                        ((course.status||'').toLowerCase()==='rejected') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.status || 'draft'}
                      </span>
                    </span>
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
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={() => handleApprove(course.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(course.id)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => toggleLessons(course.id)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs px-3 py-1 rounded"
                    >
                      {expanded[course.id] ? 'Hide Lessons' : 'View Lessons'}
                    </button>
                  </div>
                </div>
              </div>

              {expanded[course.id] && (
                <div className="mt-3 border-t pt-3">
                  {lessonsLoading[course.id] && (
                    <div className="text-sm text-gray-500">Loading lessons...</div>
                  )}
                  {!lessonsLoading[course.id] && (
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                            <th className="px-4 py-2" />
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(lessonsByCourse[course.id] || []).map((l) => (
                            <tr key={l.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{l.title || l.name || `Lesson ${l.id}`}</td>
                              <td className="px-4 py-2 text-sm">{l.duration || '—'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{l.updated_at ? new Date(l.updated_at).toLocaleString() : '—'}</td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => handleDeleteLesson(course.id, l.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(lessonsByCourse[course.id] || []).length === 0 && (
                            <tr>
                              <td className="px-4 py-4 text-sm text-gray-500" colSpan={4}>No lessons.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredCourses.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500">No courses found for this instructor.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCourses;