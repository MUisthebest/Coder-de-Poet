import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, socialLogin, user } = useAuth();
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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError('');
      
      try {
        const result = await socialLogin('google', tokenResponse.access_token);
        
        if (result.success) {
          if (result.role === "Admin") {
            navigate('/admin', { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Google login failed. Please try again.');
      }
      
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setError('Google login failed. Please try again.');
    },
    flow: 'implicit', // or 'auth-code' for server-side
  });

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
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={() => googleLogin()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-3 rounded-full hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5" 
            />
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-600 mt-8">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/signup')} 
              className="underline hover:text-black font-medium"
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