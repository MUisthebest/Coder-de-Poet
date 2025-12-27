import { useEffect, useState, useMemo } from 'react';
import { adminUserService } from '../../services/adminUserService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminUsers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const navigate = useNavigate();

  const roles = ['Normal_Student', 'Premium_Student', 'Instructor'];

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        setError('Bạn không có quyền truy cập.');
        setLoading(false);
        return;
      }
      loadUsers();
    }
  }, [authLoading, isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminUserService.listUsers();
      if (!res.success) throw new Error(res.error || 'Failed to load users');
      // API shape: { success, totalUsers, users }
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Xóa người dùng này? Hành động không thể hoàn tác.');
    if (!confirmDelete) return;
    const res = await adminUserService.deleteUser(id);
    if (!res.success) {
      alert(res.error || 'Delete failed');
      return;
    }
    await loadUsers();
  };

  const handleRoleChange = async (id, newRole) => {
    setUpdatingRoleId(id);
    try {
      const res = await adminUserService.updateRole(id, newRole);
      console.log('Role update response:', res);
      
      if (!res.success) {
        const errorMsg = res.data?.errorMessage || res.error || 'Unknown error';
        alert(`Failed to update role:\n${errorMsg}`);
        setUpdatingRoleId(null);
        return;
      }

      // res.data has the updated user info with new role
      const updatedUser = res.data;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                role: updatedUser?.role || newRole,
                updatedAt: updatedUser?.updatedAt || new Date().toISOString(),
              }
            : u
        )
      );
      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const totalUsers = useMemo(() => users.length, [users]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 text-xl font-bold mb-2">Access / Load Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Quay về Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Total users: {totalUsers}</p>
        </div>
        <button
          onClick={loadUsers}
          className="bg-gray-800 hover:bg-black text-white text-sm px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{u.fullName || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    {u.role === 'Admin' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Admin
                      </span>
                    ) : (
                      <select
                        value={u.role || ''}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`border rounded px-3 py-2 text-sm w-full transition-all ${
                          updatingRoleId === u.id
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                            : 'border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        }`}
                        disabled={updatingRoleId === u.id}
                        title={updatingRoleId === u.id ? 'Updating...' : 'Click to change role'}
                      >
                        <option value="" disabled>
                          Select role
                        </option>
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
