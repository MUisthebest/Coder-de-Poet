import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isComponentMounted, setIsComponentMounted] = useState(true);

  const { login, socialLogin, isAuthenticated, loading, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (!user) return;
    if (!loading && isAuthenticated) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      }
      else if (user.role === "Instructor") {
        navigate('/instructor/dashboard', {replace: true});
      }
      else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, loading, isAdmin, navigate]);

  // Đảm bảo component đã mounted
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
    };
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error) setError('');
    setIsLoading(true);

    try {      
      const result = await login({ email, password });
      console.log("📋 Login result:", result);

      if (!isComponentMounted) return;
      console.log("📋 Login result:", result);
      if (result.success) {
        console.log("✅ Login successful, role:", result.role);
        if (result.role === "Admin") {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        console.log("❌ Login failed, error:", result.error);
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      if (isComponentMounted) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      if (isComponentMounted) {
        setIsLoading(false);
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('✅ Google login successful:', tokenResponse);
      
      if (!isComponentMounted) return;
      
      setIsLoading(true);
      
      try {
        // Lưu redirect path trước khi login
        localStorage.setItem('redirectAfterLogin', from);
        
        // Gửi access token đến backend
        const result = await socialLogin('google', tokenResponse.access_token);
        console.log("📋 Social login result:", result);
        
        if (!isComponentMounted) return;
        
        if (result.success) {
          const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
          localStorage.removeItem('redirectAfterLogin');
          
          if (result.role === "Admin") {
            navigate('/admin', { replace: true });
          }
          else if (result.role === "Instructor") {
            console.log('kkk')
            navigate('/instructor/dashboard', {replace: true});
          }
          else {
            navigate(redirectPath, { replace: true });
          }
        } else {
          setError(result.error || 'Google login failed');
        }
      } catch (err) {
        console.error('❌ Google login error:', err);
        if (isComponentMounted) {
          setError('Google login failed. Please try again.');
        }
      } finally {
        if (isComponentMounted) {
          setIsLoading(false);
        }
      }
    },
    onError: (error) => {
      console.error('❌ Google login failed:', error);
      if (isComponentMounted) {
        setError('Google login failed. Please try again.');
        setIsLoading(false);
      }
    },
    scope: 'email profile openid',
  });

  const handleGoogleLogin = () => {
    if (isLoading) return;
    
    setError('');
    googleLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen  via-white to-amber-100 px-4 sm:px-5">
      <div className="w-full max-w-7xl h-[96vh] bg-[#EFE9E3] backdrop-blur-2xl shadow-2xl rounded-3xl grid md:grid-cols-2 overflow-hidden border border-[#57595B] relative">
        
        {/* Left side - Image */}
        <div className="hidden md:block relative">
          <img
            src="https://res.cloudinary.com/drjlezbo7/image/upload/v1764014419/687c4c71483845.5bcee4e11a18b_pq1wra.gif"
            alt="Learning"
            className="h-full w-full object-cover rounded-l-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#EFE9E3]/30"></div>
        </div>

        {/* Right side - Form */}
        <div className="flex flex-col justify-center bg-white px-6 sm:px-10 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome to Learnix</h1>
            <p className="text-gray-600 text-sm sm:text-base">Earn your legacy</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 animate-fadeIn">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                placeholder="ronaldo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-full font-medium transition-all duration-300 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gray-900 hover:bg-black text-white'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 py-3 rounded-full font-medium transition-all duration-300 ${
              isLoading 
                ? 'bg-gray-100 cursor-not-allowed' 
                : 'bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            } shadow-sm`}
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
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors underline"
              disabled={isLoading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SignIn;