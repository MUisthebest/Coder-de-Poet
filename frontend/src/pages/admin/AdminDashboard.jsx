// components/AdminDashboard.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [popularCourses, setPopularCourses] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      load();
    }
  }, [authLoading]);

  const load = async () => {
    if (!isAdmin) {
      setError('You do not have permission to access the Admin Dashboard');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [statsRes, coursesRes, chartsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAllCourses(),
        adminService.getChartsStatistics(),
      ]);
      
      setStats(statsRes.data);

      if (chartsRes.success) {
        setChartData(chartsRes.data);
      }
      

      console.log('Fetched courses data:', coursesRes);
      
      // Sort courses by student_count and take top 5
      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        console.log('Raw courses data:', coursesRes.data);
        const sortedCourses = coursesRes.data
          .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            title: c.title || 'Untitled Course',
            instructor: c.instructor_id || 'Unknown',
            category: c.category_name || c.category_id || '—',
            students: c.student_count || 0,
            createdAt: c.updated_at || c.created_at || new Date().toISOString(),
          }));
        console.log('Sorted courses:', sortedCourses);
        setPopularCourses(sortedCourses);
      } else {
        console.log('Courses response:', coursesRes);
      }
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
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto">
      <div className="mx-auto bg-gray-50 py-10 px-5 sm:px-10 max-w-8xl md:flex flex-col w-full min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, <span className="font-semibold">{user?.email}</span></p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <p className="text-gray-600 text-sm font-medium">Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCourses}</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {stats && (
          <div className="flex gap-4 mb-4 justify-end">
            <button
              onClick={() => navigate('/admin/users')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Manage Users
            </button>
            <button
              onClick={() => navigate('/admin/courses')}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium transition-colors"
            >
              View Courses
            </button>
          </div>
        )}

        {/* Charts Section */}
        {chartData && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Statistics Charts</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Courses by Category Chart */}
              {chartData.charts?.coursesByCategory && chartData.charts.coursesByCategory.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Courses by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.charts.coursesByCategory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="count" fill="#10B981" name="Number of Courses" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Users by Role Chart */}
              {chartData.charts?.usersByRole && chartData.charts.usersByRole.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Users by Role</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={chartData.charts.usersByRole} cx="50%" cy="50%" labelLine={false} label={({ role, count }) => `${role}: ${count}`} outerRadius={100} fill="#8884d8" dataKey="count">
                        {chartData.charts.usersByRole.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Popular Courses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Popular Courses</h2>
          </div>
          
          <div className="overflow-y-scroll" style={{ maxHeight: '300px' }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50">Course Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 bg-gray-50">Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 bg-gray-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {popularCourses.length > 0 ? (
                  popularCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{course.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xm font-medium text-green-800">
                          {course.students.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/instructor/courses/${course.id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;