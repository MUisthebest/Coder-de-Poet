import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function AdminReports() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      loadChartData();
    }
  }, [authLoading]);

  const loadChartData = async () => {
    if (!isAdmin) {
      setError('You do not have permission to access the Admin Reports');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.getChartsStatistics();

      if (!response.success) {
        setError(response.error || 'Failed to load chart data');
        setLoading(false);
        return;
      }

      setChartData(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading chart data:', err);
      setError(err.message || 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading reports...</div>
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
            onClick={() => navigate('/admin')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Statistics Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and insights</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadChartData}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {chartData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Users</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {chartData.summary?.users || 0}
                    </p>
                  </div>
                  <div className="text-4xl text-blue-500">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Courses</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {chartData.summary?.courses || 0}
                    </p>
                  </div>
                  <div className="text-4xl text-green-500">📚</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Enrollments</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {chartData.summary?.enrollments || 0}
                    </p>
                  </div>
                  <div className="text-4xl text-purple-500">✅</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Enrollment Trend Chart */}
              {chartData.charts?.enrollmentTrend && chartData.charts.enrollmentTrend.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Enrollment Trend</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={chartData.charts.enrollmentTrend}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        cursor={{ stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="enrollments"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 6 }}
                        activeDot={{ r: 8 }}
                        name="Enrollments"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Courses by Category Chart */}
              {chartData.charts?.coursesByCategory && chartData.charts.coursesByCategory.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Courses by Category</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData.charts.coursesByCategory}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        cursor={{ fill: '#F3F4F6' }}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#10B981"
                        name="Number of Courses"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* User Distribution Chart (if available) */}
              {chartData.charts?.usersByRole && chartData.charts.usersByRole.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Users by Role</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.charts.usersByRole}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {chartData.charts.usersByRole.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Enrollment by Status Chart (if available) */}
              {chartData.charts?.enrollmentStatus && chartData.charts.enrollmentStatus.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Enrollment Status</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.charts.enrollmentStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {chartData.charts.enrollmentStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Additional Data Tables */}
            {chartData.charts?.topCourses && chartData.charts.topCourses.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top 10 Courses</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {chartData.charts.topCourses.map((course, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{course.enrollments}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{course.completionRate}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={loadChartData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
