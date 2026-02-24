// src/components/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGoogle, 
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { logIn, signInWithGoogle, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const socialLogins = [
    { 
      name: 'Google', 
      icon: FaGoogle, 
      color: 'border border-gray-200 text-gray-700 hover:shadow-lg',
      handler: handleGoogleLogin
    },
  ];

  async function handleGoogleLogin() {
    try {
      clearError();
      setIsLoggingIn(true);
      await signInWithGoogle();
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Google login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setIsLoggingIn(true);

    try {
      await logIn(formData.email, formData.password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      
      // Show appropriate error message
      if (error.message.includes('Account not found')) {
        toast.error('Account not found. Please sign up first.');
      } else if (error.message.includes('wrong-password') || error.message.includes('invalid-credential')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('user-not-found')) {
        toast.error('No account found with this email');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Error display component
  const ErrorMessage = () => {
    if (!error) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3"
      >
        <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-red-800 text-sm font-medium">Login failed</p>
          <p className="text-red-600 text-sm mt-1">
            {error.includes('Account not found') 
              ? 'Account not found. Please sign up first.' 
              : error}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
        >
          <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Home
        </Link>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100/80 p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to continue your career journey
          </p>
        </div>

        {/* Error Message */}
        <ErrorMessage />

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-sm font-medium placeholder-gray-400 group-hover:bg-white/80"
                  required
                  disabled={isLoggingIn}
                />
                <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm transition-colors duration-200 group-focus-within:text-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-sm font-medium placeholder-gray-400 group-hover:bg-white/80"
                  required
                  disabled={isLoggingIn}
                />
                <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm transition-colors duration-200 group-focus-within:text-blue-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={isLoggingIn}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ 
              scale: 1.02, 
              boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)" 
            }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoggingIn}
            className={`w-full bg-blue-500 text-white py-4 px-6 rounded-2xl text-base font-semibold hover:shadow-xl transition-all duration-200 shadow-lg shadow-blue-500/25 ${
              isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoggingIn ? 'Logging in...' : 'Sign In'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300/50"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/90 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-1 gap-3">
          {socialLogins.map((social) => (
            <motion.button
              key={social.name}
              onClick={social.handler}
              disabled={isLoggingIn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${social.color} py-3 px-4 rounded-2xl text-sm font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 bg-white/50 backdrop-blur-sm ${
                isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <social.icon className="text-base" />
              <span>{social.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/auth/sign-up"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;