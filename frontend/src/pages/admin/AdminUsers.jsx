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
  const [togglingStatusId, setTogglingStatusId] = useState(null);
  const [modal, setModal] = useState({ show: false, type: '', title: '', message: '', onConfirm: null });
  const navigate = useNavigate();

  const roles = ['Normal_Student', 'Premium_Student', 'Instructor'];

  const showConfirmModal = (title, message, onConfirm) => {
    setModal({ show: true, type: 'confirm', title, message, onConfirm });
  };

  const showAlertModal = (title, message) => {
    setModal({ show: true, type: 'alert', title, message, onConfirm: null });
  };

  const closeModal = () => {
    setModal({ show: false, type: '', title: '', message: '', onConfirm: null });
  };

  const handleModalConfirm = () => {
    if (modal.onConfirm) modal.onConfirm();
    closeModal();
  };

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
    showConfirmModal(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.',
      async () => {
        const res = await adminUserService.deleteUser(id);
        if (!res.success) {
          showAlertModal('Lỗi', res.error || 'Xóa người dùng thất bại');
          return;
        }
        showAlertModal('Thành công', 'Đã xóa người dùng thành công');
        await loadUsers();
      }
    );
  };

  const handleRoleChange = async (id, newRole, currentRole) => {
    showConfirmModal(
      'Xác nhận thay đổi vai trò',
      `Bạn có chắc muốn thay đổi vai trò từ "${currentRole}" sang "${newRole}"?`,
      async () => {
        setUpdatingRoleId(id);
        try {
          const res = await adminUserService.updateRole(id, newRole);
          console.log('Role update response:', res);
          
          if (!res.success) {
            const errorMsg = res.data?.errorMessage || res.error || 'Unknown error';
            showAlertModal('Lỗi', `Cập nhật vai trò thất bại: ${errorMsg}`);
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
          showAlertModal('Thành công', 'Đã cập nhật vai trò thành công!');
        } catch (error) {
          console.error('Error updating role:', error);
          showAlertModal('Lỗi', `Lỗi: ${error.message}`);
        } finally {
          setUpdatingRoleId(null);
        }
      }
    );
  };

  const handleToggleStatus = async (id, isCurrentlyActive) => {
    const action = isCurrentlyActive ? 'vô hiệu hóa' : 'kích hoạt';
    const currentStatus = isCurrentlyActive ? 'Active' : 'Disabled';
    const newStatus = isCurrentlyActive ? 'Disabled' : 'Active';
    
    showConfirmModal(
      `Xác nhận ${action} tài khoản`,
      `Bạn có chắc muốn ${action} tài khoản này?\n\nTrạng thái hiện tại: ${currentStatus}\nTrạng thái mới: ${newStatus}`,
      async () => {
        setTogglingStatusId(id);
        try {
          const res = isCurrentlyActive
            ? await adminUserService.disableAccount(id)
            : await adminUserService.enableAccount(id);

          if (!res.success) {
            const errorMsg = res.error || `Failed to ${action} account`;
            showAlertModal('Lỗi', errorMsg);
            setTogglingStatusId(null);
            return;
          }

          // Update local state
          setUsers((prev) =>
            prev.map((u) =>
              u.id === id ? { ...u, isActive: !isCurrentlyActive } : u
            )
          );
          showAlertModal('Thành công', `Đã ${action} tài khoản thành công!`);
        } catch (error) {
          console.error(`Error toggling account status:`, error);
          showAlertModal('Lỗi', `Lỗi: ${error.message}`);
        } finally {
          setTogglingStatusId(null);
        }
      }
    );
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
    <div className="min-h-screen mx-auto bg-gray-50 py-10 px-5 sm:px-10 max-w-8xl md:flex flex-col w-full">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.role)}
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
                  <td className="px-6 py-4 text-sm">
                    {u.role === 'Admin' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        disabled={togglingStatusId === u.id}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${
                          togglingStatusId === u.id
                            ? 'opacity-60 cursor-wait'
                            : 'hover:shadow-md active:scale-95'
                        } ${
                          u.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        title={togglingStatusId === u.id ? 'Updating...' : (u.isActive ? 'Click to disable' : 'Click to enable')}
                      >
                        {togglingStatusId === u.id ? 'Updating...' : (u.isActive ? 'Active' : 'Disabled')}
                      </button>
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
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Modal Component */}
      {modal.show && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{modal.title}</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 whitespace-pre-line">{modal.message}</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              {modal.type === 'confirm' && (
                <>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Confirm
                  </button>
                </>
              )}
              {modal.type === 'alert' && (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
