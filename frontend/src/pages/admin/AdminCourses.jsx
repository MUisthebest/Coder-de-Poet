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
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [uiStatus, setUiStatus] = useState((searchParams.get('status') || 'all').toLowerCase());
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [courseType, setCourseType] = useState(searchParams.get('type') || 'all');
  const [pendingOnly, setPendingOnly] = useState((searchParams.get('pendingOnly') || '0') === '1');
  const [includeDeleted, setIncludeDeleted] = useState((searchParams.get('includeDeleted') || '0') === '1');

  const instructorId = searchParams.get('instructorId') || '';
  const statusParam = (searchParams.get('status') || 'all').toLowerCase();

  useEffect(() => {
    if (!authLoading) {
      init();
    }
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) {
      if (instructorId && instructorId !== 'all') {
        loadCourses(instructorId);
      } else if (instructorId === 'all') {
        loadAllCourses();
      }
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

      // Default to 'all' if none selected
      if (!instructorId) {
        setSearchParams({ instructorId: 'all' });
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

  const loadAllCourses = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllCourses();
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
    let list = [...courses];

    // Deleted filter
    if (!includeDeleted) {
      list = list.filter((c) => {
        const isDel = c.is_deleted === true || c.deleted_at;
        return !isDel;
      });
    }

    // Status filter
    list = list.filter((c) => {
      const status = (c.status || c.approval_status || '').toLowerCase();
      if (uiStatus === 'all') return true;
      if (uiStatus === 'draft') return status === 'draft' || status === 'pending';
      if (uiStatus === 'published') return status === 'published' || status === 'approved';
      if (uiStatus === 'rejected') return status === 'rejected';
      return true;
    });

    // Pending only toggle
    if (pendingOnly) {
      list = list.filter((c) => {
        const status = (c.status || c.approval_status || '').toLowerCase();
        return status === 'pending' || status === 'draft';
      });
    }

    // Text search filter (title, slug, description)
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const title = (c.title || '').toLowerCase();
        const slug = (c.slug || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        return title.includes(q) || slug.includes(q) || desc.includes(q);
      });
    }

    // Category filter
    if (category) {
      list = list.filter((c) => {
        const cid = c.category_id || '';
        return cid === category;
      });
    }

    // Course type filter (free/paid)
    if (courseType !== 'all') {
      list = list.filter((c) => {
        const price = Number(c.price ?? c.price_amount ?? 0);
        if (courseType === 'free') return price === 0;
        if (courseType === 'paid') return price > 0;
        return true;
      });
    }
    return list;
  }, [courses, uiStatus, query, category, courseType, pendingOnly, includeDeleted]);

  const selectedInstructor = useMemo(() => {
    if (instructorId === 'all') return { fullName: 'All Instructors', instructorId: 'all' };
    return instructors.find((i) => i.instructorId === instructorId);
  }, [instructors, instructorId]);

  const handleSelectInstructor = (e) => {
    const id = e.target.value;
    const params = {
      instructorId: id,
      status: uiStatus || 'all',
      q: query || '',
      category: category || '',
      type: courseType || 'all',
      pendingOnly: pendingOnly ? '1' : '0',
      includeDeleted: includeDeleted ? '1' : '0',
    };
    setSearchParams(params);
  };

  const handleApplyFilters = () => {
    const params = {
      instructorId,
      status: uiStatus || 'all',
      q: query || '',
      category: category || '',
      type: courseType || 'all',
      pendingOnly: pendingOnly ? '1' : '0',
      includeDeleted: includeDeleted ? '1' : '0',
    };
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setQuery('');
    setUiStatus('all');
    setCategory('');
    setCourseType('all');
    setPendingOnly(false);
    setIncludeDeleted(false);
    setSearchParams({ instructorId, status: 'all' });
  };

  const categoryOptions = useMemo(() => {
    const m = new Map();
    (courses || []).forEach((c) => {
      const id = c.category_id;
      const name = c.category_name || id;
      if (id) m.set(id, name);
    });
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [courses]);

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

  console.log(instructors, courses, filteredCourses);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <p className="text-gray-600 mt-2">Advanced filters for administrators</p>
      </div>

      {/* Advanced Filter Bar */}
      <div className="mb-6 rounded-lg p-4 bg-gray-100 border border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Keyword */}
          <div>
            <div className="text-xs uppercase mb-1 text-gray-600">Search Keyword</div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, slug or description"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm placeholder-gray-400"
            />
          </div>
          {/* Status */}
          <div>
            <div className="text-xs uppercase mb-1 text-gray-600">Status</div>
            <select
              value={uiStatus}
              onChange={(e) => setUiStatus(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {['all','draft','published','rejected'].map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>
              ))}
            </select>
          </div>
          {/* Category */}
          <div>
            <div className="text-xs uppercase mb-1 text-gray-600">Category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {/* Instructor */}
          <div>
            <div className="text-xs uppercase mb-1 text-gray-600">Instructor</div>
            <select
              value={instructorId}
              onChange={handleSelectInstructor}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">All Instructors</option>
              {instructors.map((i) => (
                <option key={i.instructorId} value={i.instructorId}>
                  {i.fullName || i.instructorId} ({i.courseCount} courses)
                </option>
              ))}
            </select>
          </div>
          {/* Course Type */}
          <div>
            <div className="text-xs uppercase mb-1 text-gray-600">Course Type</div>
            <select
              value={courseType}
              onChange={(e) => setCourseType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="paid">Premium</option>
            </select>
          </div>
          {/* Toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={pendingOnly}
                onChange={(e) => setPendingOnly(e.target.checked)}
              />
              <span>Show pending courses only</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              <span>Include deleted courses</span>
            </label>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleApplyFilters} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded">Search</button>
          <button onClick={handleResetFilters} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded">Reset</button>
        </div>
      </div>


      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-2 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedInstructor ? `Courses by ${selectedInstructor.fullName || selectedInstructor.instructorId}` : 'Courses'}
          </h2>
          <div className="text-sm text-gray-500">Total: {filteredCourses.length} / {courses.length}</div>
        </div>

        <div className="max-h-[40vh] overflow-y-auto divide-y divide-gray-200">
          {filteredCourses.map((course) => {
            const status = (course.status || course.approval_status || '').toLowerCase();
            const isPublished = status === 'published' || status === 'approved';
            return (
              <div key={course.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                      <span>
                        Status:
                        <span className={`ml-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          status==='approved' || status==='published' ? 'bg-green-100 text-green-800' :
                          status==='pending' || status==='draft' ? 'bg-amber-100 text-amber-800' :
                          status==='rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {course.status || course.approval_status || 'draft'}
                        </span>
                      </span>
                      {typeof course.student_count === 'number' && (
                        <span>Students: {course.student_count}</span>
                      )}
                      {(course.category_name || course.category_id) && (
                        <span>
                          Category: {course.category_name || course.category_id}
                        </span>
                      )}
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
                      {!isPublished && (
                        <button
                          onClick={() => handleApprove(course.id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                        >
                          Approve
                        </button>
                      )}
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
                              <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                                <a
                                  href={`/instructor/courses/${course.id}/lesson/${l.id}`}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                                >
                                  Open
                                </a>
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
            );
          })}

          {filteredCourses.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500">No courses found for this instructor.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCourses;