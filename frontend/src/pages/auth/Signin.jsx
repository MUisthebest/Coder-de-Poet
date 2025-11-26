import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      if (result.role === "Admin") {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  // SỬ DỤNG useGoogleLogin - ĐƠN GIẢN HƠN RẤT NHIỀU
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('✅ Google login successful:', tokenResponse);
      setIsLoading(true);
      
      try {
        // Gửi access token đến backend
        const result = await socialLogin('google', tokenResponse.access_token);
        
        if (result.success) {
          const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
          localStorage.removeItem('redirectAfterLogin');
          
          if (result.role === "Admin") {
            navigate('/admin', { replace: true });
          } else {
            navigate(redirectPath, { replace: true });
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('❌ Google login error:', err);
        setError('Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('❌ Google login failed:', error);
      setError('Google login failed. Please try again.');
      setIsLoading(false);
    },
    scope: 'email profile openid',
  });

  const handleGoogleLogin = () => {
    setError('');
    // Lưu redirect path trước khi login
    localStorage.setItem('redirectAfterLogin', from);
    // Kích hoạt Google login
    googleLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen via-white to-amber-100 px-5">
      <div className="w-full max-w-7xl h-[96vh] bg-[#EFE9E3] backdrop-blur-2xl shadow-2xl rounded-3xl grid md:grid-cols-2 overflow-hidden border-1 border-[#57595B]">

        <div className="hidden md:block">
          <img
            src="https://res.cloudinary.com/drjlezbo7/image/upload/v1764014419/687c4c71483845.5bcee4e11a18b_pq1wra.gif"
            alt="Learning"
            className="h-full w-full object-cover rounded-l-3xl"
          />
        </div>

        <div className="flex flex-col justify-center bg-white px-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Welcome to Learnix</h1>
            <p className="text-gray-500">Earn your legacy</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="ronaldo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-12 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-12 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black outline-none"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* SIMPLIFIED GOOGLE BUTTON */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-3 rounded-full hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-8">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/signup')} 
              className="underline hover:text-black font-medium transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;