import React, { useState } from 'react';
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
    setIsLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      if (result.success) navigate(from, { replace: true });
      else setError(result.error || 'Login failed');
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await socialLogin(provider);
      if (result.success) navigate(from, { replace: true });
      else setError(result.error || 'Social login failed');
    } catch {
      setError('An error occurred during social login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="  flex items-center justify-center via-white to-amber-100 sm:px-5">
      
      <div className="w-full justify-self-center h-[96vh]  max-w-7xl bg-[#EFE9E3] backdrop-blur-2xl shadow-xl rounded-3xl grid md:grid-cols-2">
        
        {/* GIF Section */}
        <div className="flex items-center justify-center w-full">
        <img
            src="https://res.cloudinary.com/drjlezbo7/image/upload/v1764014419/687c4c71483845.5bcee4e11a18b_pq1wra.gif"
            alt="Learning animation"
            className="shadow-lg h-full object-cover border-r-2 border-gray-200 rounded-l-3xl"
        />
        </div>

        {/* Form Section */}
        <div className="flex flex-col justify-center bg-white px-10  shadow-lg h-full w-full rounded-r-3xl">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Welcome to Learnix</h1>
            <p className="text-gray-500 text-sm">Earn your legacy</p>
        </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📧</span>
              <input
                type="email"
                placeholder="Ronaldo@gmail.com"
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔒</span>
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-black focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 rounded-full text-center font-medium hover:bg-gray-900 transition disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-2 text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center cursor-pointer gap-3 bg-white border py-3 rounded-full hover:bg-gray-50 transition"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="w-5 h-5"
              alt="Google"
            />
            <span className="text-gray-700 text-sm">Sign in with Google</span>
          </button>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="underline hover:text-black"
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
