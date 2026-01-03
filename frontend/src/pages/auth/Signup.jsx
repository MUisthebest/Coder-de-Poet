import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    avatarUrl: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/login';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { email, password, confirmPassword, fullName, dateOfBirth } = formData;

    if (!email || !password || !fullName) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const signupData = {
        email,
        password,
        fullName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        avatarUrl: formData.avatarUrl || undefined,
      };

      console.log('Sending signup data:', signupData);
      const result = await authService.signup(signupData);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Signup error:', err);
      const msg = err.response?.data?.message || err.message || 'Sign up failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center via-white to-amber-100 px-5">
      <div className="w-full max-w-7xl md:h-[96vh] h-[80vh] bg-[#EFE9E3] backdrop-blur-2xl shadow-2xl rounded-3xl grid md:grid-cols-2 overflow-hidden border-1 border-[#57595B]">
        
        {/* Left: GIF - Ẩn trên mobile */}
        <div className="hidden md:block h-full">
          <img
            src="https://res.cloudinary.com/drjlezbo7/image/upload/v1764014419/687c4c71483845.5bcee4e11a18b_pq1wra.gif"
            alt="Learning"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right: Form */}
        <div className="flex flex-col justify-center bg-white md:px-7 overflow-y-auto px-5">
          <div className="text-center mb-6">
            <h1 className="text-[calc(1vw_+_15px)] font-bold text-black mb-2">Join Learnix</h1>
            <p className="text-gray-500 text-sm md:text-base">Start your learning journey today!</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                👤
              </span>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black focus:outline-none text-sm md:text-base"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                📧
              </span>
              <input
                type="email"
                name="email"
                placeholder="ronaldo@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black focus:outline-none text-sm md:text-base"
              />
            </div>

            {/* Date of Birth */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                📅
              </span>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black focus:outline-none text-sm md:text-base"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔒
              </span>
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 chars)"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black focus:outline-none text-sm md:text-base"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔒
              </span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black focus:outline-none text-sm md:text-base"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-900 transition disabled:opacity-50 text-sm md:text-base"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs md:text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="underline hover:text-black font-medium"
            >
              Sign In
            </button>
            <br />
            <button
              onClick={() => navigate('/forgot-password')}
              className="underline hover:text-gray-700 font-medium text-xs mt-2"
            >
              Forgot Password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;