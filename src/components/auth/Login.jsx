// src/components/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGoogle, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft,
  FaExclamationTriangle, FaSpinner, FaCheck
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('credentials'); // credentials, verification
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { logIn, signInWithGoogle, sendVerificationCode, verifyCode, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearError();
  };

  // Step 1: Send credentials to get verification code
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      await sendVerificationCode(formData.email, 'login');
      setStep('verification');
      setCountdown(60);
      toast.success('Verification code sent to your email');
    } catch (err) {
      toast.error(err.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and then perform Firebase login
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      // Verify code with backend
      await verifyCode(formData.email, verificationCode, 'login');
      // Now perform actual Firebase login
      await logIn(formData.email, formData.password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await sendVerificationCode(formData.email, 'login');
      setCountdown(60);
      toast.success('New code sent');
    } catch (err) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      toast.error('Google login failed');
    }
  };

  const ErrorMessage = () => error ? (
    <motion.div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3">
      <FaExclamationTriangle className="text-red-500 mt-0.5" />
      <p className="text-red-800 text-sm">{error}</p>
    </motion.div>
  ) : null;

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600">
          <FaArrowLeft className="mr-2" /> Back to Home
        </Link>
      </motion.div>

      <motion.div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100/80 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">{step === 'credentials' ? 'Sign in to continue' : 'Enter the 6-digit code sent to your email'}</p>
        </div>

        <ErrorMessage />

        <AnimatePresence mode="wait">
          {step === 'credentials' && (
            <motion.form key="login-creds" onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-blue-500"
                    placeholder="you@example.com" required disabled={isLoading} />
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                    onChange={handleInputChange} className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl"
                    placeholder="Enter your password" required disabled={isLoading} />
                  <FaLock className="absolute left-4 top-1/2 text-gray-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 text-gray-400">
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} type="submit" disabled={isLoading}
                className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-70">
                {isLoading ? <FaSpinner className="animate-spin mx-auto" /> : 'Continue'}
              </motion.button>
            </motion.form>
          )}

          {step === 'verification' && (
            <motion.form key="login-verify" onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-center text-2xl tracking-widest"
                  placeholder="000000" maxLength="6" required disabled={isLoading} />
                <p className="text-sm text-gray-500 mt-2">We sent a 6-digit code to {formData.email}</p>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold">
                {isLoading ? <FaSpinner className="animate-spin mx-auto" /> : 'Verify & Login'}
              </button>
              <div className="text-center">
                <button type="button" onClick={resendCode} disabled={countdown > 0}
                  className="text-sm text-blue-600 hover:underline disabled:text-gray-400">
                  Resend code {countdown > 0 && `(${countdown}s)`}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {step === 'credentials' && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300/50"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white/90 text-gray-500">Or continue with</span></div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={handleGoogleLogin} className="py-3 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center space-x-2 bg-white/50 border border-gray-200">
                <FaGoogle /> <span>Google</span>
              </button>
            </div>
          </>
        )}

        <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
          <p className="text-gray-600">Don't have an account? <Link to="/auth/sign-up" className="text-blue-600 font-semibold">Sign up</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;