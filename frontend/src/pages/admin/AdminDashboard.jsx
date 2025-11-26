// components/AdminDashboard.js
import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext'; // Import AuthContext

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
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
    // Kiểm tra role từ AuthContext thay vì adminService
    if (!isAdmin) {
      setError('Bạn không có quyền truy cập trang Admin Dashboard');
      setLoading(false);
      return;
    }

    await loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await adminService.getAdminDashboard();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị loading từ AuthContext
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading admin dashboard...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">
          {dashboardData?.message || 'Admin Dashboard'}
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome, {dashboardData?.user || user?.email} ({dashboardData?.role || 'Admin'})
        </p>
      </div>

      {/* Stats Grid */}
      {dashboardData?.dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">
              {dashboardData.dashboardData.totalUsers.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Active Courses</h3>
            <p className="text-3xl font-bold text-green-600">
              {dashboardData.dashboardData.activeCourses}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${dashboardData.dashboardData.revenue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {dashboardData?.dashboardData?.recentActivities && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {dashboardData.dashboardData.recentActivities.map((activity, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-700">{activity.action}</span>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-sm text-gray-500">
        Last updated: {new Date(dashboardData?.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

export default AdminDashboard;