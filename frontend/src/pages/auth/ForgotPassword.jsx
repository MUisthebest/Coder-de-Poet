import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gửi email không thành công. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br via-white to-amber-100 px-5">
      <div className="w-full max-w-md bg-white backdrop-blur-2xl shadow-2xl rounded-2xl p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">Quên Mật Khẩu</h1>
          <p className="text-gray-500 text-sm">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ✓ Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
            <br />
            Vui lòng kiểm tra email của bạn.
            <br />
            Đang chuyển hướng...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              ✉️
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              disabled={isLoading || success}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition duration-200"
          >
            {isLoading ? 'Đang gửi...' : 'Gửi Hướng Dẫn'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600 text-sm">
            Bạn nhớ mật khẩu?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold">
              Đăng nhập
            </Link>
          </p>
          <p className="text-gray-600 text-sm">
            Chưa có tài khoản?{' '}
            <Link to="/signup" className="text-blue-500 hover:text-blue-600 font-semibold">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
