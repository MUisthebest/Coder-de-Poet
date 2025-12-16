// components/AdminDashboard.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      load();
    }
  }, [authLoading]);

  const load = async () => {
    if (!isAdmin) {
      setError('Bạn không có quyền truy cập trang Admin Dashboard');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      //setError('');
      const [statsRes, instructorsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getInstructors(),
      ]);

      //if (!statsRes.success) throw new Error(statsRes.error || 'Failed to load stats');
      if (!instructorsRes.success) throw new Error(instructorsRes.error || 'Failed to load instructors');

      setStats(statsRes.data);
      setInstructors(instructorsRes.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }


  console.log(error);
  if (isAdmin === false) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome, {user?.email} (Admin)</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700">Total Users</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700">Instructors</h3>
            <p className="text-2xl font-bold text-indigo-600">{stats.instructorsCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700">Students</h3>
            <p className="text-2xl font-bold text-emerald-600">{stats.studentsCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700">Courses</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.totalCourses}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700">Enrollments</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.totalEnrollments}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Instructors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instructors.map((ins) => (
                <tr key={ins.instructorId}>
                  <td className="px-6 py-4 text-sm text-gray-900">{ins.instructorId}</td>
                  <td className="px-6 py-4 text-sm">{ins.courseCount}</td>
                  <td className="px-6 py-4 text-sm">{ins.totalStudents}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ins.firstCourseAt ? new Date(ins.firstCourseAt).toLocaleString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ins.lastUpdatedAt ? new Date(ins.lastUpdatedAt).toLocaleString() : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/admin/courses?instructorId=${encodeURIComponent(ins.instructorId)}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded"
                    >
                      View Courses
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">Last updated: {stats ? new Date(stats.timestamp).toLocaleString() : ''}</div>
    </div>
  );
}

export default AdminDashboard;