// components/GoogleCallbackHandler.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const GoogleCallbackHandler = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { socialLogin } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        console.log('🔄 Handling Google callback...');
        
        // Lấy authorization code từ URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const authorizationCode = urlParams.get('code');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          console.error('❌ Google OAuth error:', errorParam);
          setError(`Google login failed: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (!authorizationCode) {
          console.error('❌ No authorization code received');
          setError('No authorization code received from Google');
          setLoading(false);
          return;
        }

        console.log('✅ Received authorization code:', authorizationCode);

        // Gửi code đến backend để exchange lấy access token
        const result = await socialLogin('google', authorizationCode);
        
        if (result.success) {
          console.log('✅ Google login successful');
          const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
          localStorage.removeItem('redirectAfterLogin');
          
          if (result.role === "Admin") {
            navigate('/admin', { replace: true });
          } else {
            navigate(redirectPath, { replace: true });
          }
        } else {
          setError(result.error || 'Google login failed');
          setLoading(false);
        }

      } catch (err) {
        console.error('❌ Google callback error:', err);
        setError('Authentication failed: ' + err.message);
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [navigate, socialLogin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Processing Google login...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Please wait while we authenticate you.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Login Failed</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/signin')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallbackHandler;