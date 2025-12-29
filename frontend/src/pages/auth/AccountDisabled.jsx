import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccountDisabled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Disabled</h1>
          <p className="text-gray-600 mb-4">
            Your account has been disabled by an administrator.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              If you believe this is an error, please contact the administrator for more information.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/signin')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          Back to Sign In
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default AccountDisabled;
