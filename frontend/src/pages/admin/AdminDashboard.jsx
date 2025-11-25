// src/pages/AdminDashboard.jsx
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">👑 Admin Dashboard</h1>
      <p>Welcome, Admin {user?.fullName}!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Total Users</h3>
          <p className="text-2xl">0</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Total Courses</h3>
          <p className="text-2xl">0</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Revenue</h3>
          <p className="text-2xl">$0</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;