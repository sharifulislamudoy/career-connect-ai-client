// src/components/auth/SignUp.jsx
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
  FaUpload,
  FaUser,
  FaBriefcase,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    location: '',
    profession: '',
    userType: '',
    profilePhoto: null,
    photoPreview: '',
    cloudinaryUrl: ''
  });

  const { signUp, signInWithGoogle, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  // Cloudinary configuration
  const cloudName = 'dohhfubsa';
  const uploadPreset = 'react_unsigned';

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Clear error when component unmounts or form changes
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const socialLogins = [
    { 
      name: 'Google', 
      icon: FaGoogle, 
      color: 'border border-gray-200 text-gray-700 hover:shadow-lg',
      handler: handleGoogleSignUp
    },
  ];

  const professions = [
    'Web Developer',
    'MERN Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Digital Marketer',
    'WordPress Developer',
    'UI/UX Designer',
    'Data Scientist',
    'DevOps Engineer',
    'Mobile App Developer',
    'Software Engineer',
    'Other'
  ];

  const userTypes = [
    { id: 'jobSeeker', name: 'Job Seeker', icon: FaUser, description: 'Find your dream job' },
    { id: 'recruiter', name: 'Recruiter', icon: FaBriefcase, description: 'Hire top talent' },
  ];

  const steps = [
    { number: 1, title: 'Account' },
    { number: 2, title: 'Profile' },
    { number: 3, title: 'Complete' }
  ];

  async function handleGoogleSignUp() {
    try {
      clearError();
      await signInWithGoogle();
      toast.success('Account created successfully! Please complete your profile.');
      navigate('/settings');
    } catch (error) {
      console.error('Google sign up failed:', error);
      toast.error('Google sign up failed. Please try again.');
    }
  }

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('cloud_name', cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      return data.secure_url; // Return the Cloudinary URL

    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'profilePhoto' && files[0]) {
      const file = files[0];
      
      // Create local preview immediately
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        profilePhoto: file,
        photoPreview: previewUrl
      }));

      // Upload to Cloudinary
      try {
        const cloudinaryUrl = await uploadToCloudinary(file);
        setFormData(prev => ({
          ...prev,
          cloudinaryUrl: cloudinaryUrl
        }));
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Failed to upload image. Please try again.');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match");
          toast.error("Passwords don't match");
          return;
        }

        // Wait for upload to complete if there's a photo
        if (formData.profilePhoto && !formData.cloudinaryUrl && uploading) {
          setError("Please wait for image upload to complete");
          toast.error("Please wait for image upload to complete");
          return;
        }

        const userData = {
          fullName: formData.fullName,
          photoURL: formData.cloudinaryUrl || formData.photoPreview, // Use Cloudinary URL if available
          location: formData.location,
          profession: formData.profession,
          userType: formData.userType,
          package: 'Basic',
          packageExpiry: null
        };

        await signUp(formData.email, formData.password, userData);
        setCurrentStep(4);
        toast.success('Account created successfully! Please complete your profile.');
        setTimeout(() => {
          navigate('/settings');
        }, 2000);
      } catch (error) {
        console.error('Signup failed:', error);
        toast.error('Signup failed. Please try again.');
      }
    }
  };

  const handleBack = () => {
    clearError();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
          <p className="text-red-800 text-sm font-medium">Sign up failed</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </motion.div>
    );
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
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
              placeholder="Create a strong password"
              className="w-full pl-12 pr-12 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-sm font-medium placeholder-gray-400 group-hover:bg-white/80"
              required
            />
            <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm transition-colors duration-200 group-focus-within:text-blue-500" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              className="w-full pl-12 pr-12 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-sm font-medium placeholder-gray-400 group-hover:bg-white/80"
              required
            />
            <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm transition-colors duration-200 group-focus-within:text-blue-500" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          placeholder="Enter your full name"
          className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-sm font-medium placeholder-gray-400 hover:bg-white/80"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="City, Country"
          className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-sm font-medium placeholder-gray-400 hover:bg-white/80"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profession
        </label>
        <select
          name="profession"
          value={formData.profession}
          onChange={handleInputChange}
          className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-sm font-medium text-gray-700 appearance-none hover:bg-white/80"
          required
        >
          <option value="">Select your profession</option>
          {professions.map((prof) => (
            <option key={prof} value={prof}>{prof}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* User Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          I am a...
        </label>
        <div className="grid grid-cols-2 gap-4">
          {userTypes.map((type) => (
            <motion.label
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                formData.userType === type.id
                  ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10'
                  : 'border-gray-200 bg-gray-50/50 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="userType"
                value={type.id}
                onChange={handleInputChange}
                className="sr-only"
                required
              />
              <type.icon className={`text-2xl mb-3 ${
                formData.userType === type.id ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className={`font-semibold text-sm ${
                formData.userType === type.id ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {type.name}
              </span>
              <span className="text-xs text-gray-500 mt-1 text-center">
                {type.description}
              </span>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Profile Photo (Optional)
        </label>
        <div className="flex items-center justify-center">
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 transition-colors duration-300 group bg-gray-50/50 hover:bg-white/80 relative overflow-hidden">
            {formData.photoPreview ? (
              <>
                <img
                  src={formData.photoPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover rounded-2xl"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <FaSpinner className="text-white text-xl animate-spin" />
                  </div>
                )}
                {formData.cloudinaryUrl && !uploading && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-xs" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-400">
                {uploading ? (
                  <FaSpinner className="text-2xl mb-2 animate-spin" />
                ) : (
                  <FaUpload className="text-2xl mb-2" />
                )}
                <span className="text-xs">
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </span>
              </div>
            )}
            <input
              type="file"
              name="profilePhoto"
              onChange={handleInputChange}
              accept="image/*"
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        {uploading && (
          <p className="text-xs text-blue-600 text-center mt-2">
            Uploading to Cloudinary...
          </p>
        )}
        {formData.cloudinaryUrl && !uploading && (
          <p className="text-xs text-green-600 text-center mt-2">
            ✓ Image uploaded successfully to Cloudinary
          </p>
        )}
      </div>
    </motion.div>
  );

  const renderCompletion = () => (
    <motion.div
      key="completion"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25"
      >
        <FaCheck className="text-white text-2xl" />
      </motion.div>
      
      <h3 className="text-2xl font-bold text-gray-900">
        Welcome to Creative Career AI!
      </h3>
      
      <p className="text-gray-600">
        Your account has been created successfully. We're excited to help you advance your career.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50/50 rounded-2xl p-6 border border-blue-200/50"
      >
        <h4 className="font-semibold text-blue-900 mb-2">What's next?</h4>
        <ul className="text-sm text-blue-800 space-y-2 text-left">
          <li className="flex items-center">
            <FaCheck className="text-green-500 mr-2 text-xs" />
            Complete your profile to get better matches
          </li>
          <li className="flex items-center">
            <FaCheck className="text-green-500 mr-2 text-xs" />
            Explore job opportunities tailored for you
          </li>
          <li className="flex items-center">
            <FaCheck className="text-green-500 mr-2 text-xs" />
            Connect with industry professionals
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );

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

      {/* Signup Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100/80 p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join Creative Career AI
          </h2>
          <p className="text-gray-600">
            Create your account in just a few steps
          </p>
        </div>

        {/* Error Message */}
        <ErrorMessage />

        {/* Progress Steps */}
        {currentStep <= 3 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300 ${
                    currentStep >= step.number
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number ? <FaCheck className="text-xs" /> : step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      currentStep > step.number ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-500">
              {steps.map((step) => (
                <span key={step.number}>{step.title}</span>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderCompletion()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep <= 3 && (
            <div className={`flex space-x-4 mt-8 ${currentStep === 1 ? 'justify-end' : ''}`}>
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gray-100 text-gray-600 py-4 px-6 rounded-2xl text-base font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-200"
                >
                  Back
                </motion.button>
              )}
              <motion.button
                type="submit"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)" 
                }}
                whileTap={{ scale: 0.98 }}
                disabled={uploading}
                className={`${
                  currentStep > 1 ? 'flex-1' : 'w-full'
                } bg-blue-500 text-white py-4 px-6 rounded-2xl text-base font-semibold hover:shadow-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Uploading...
                  </div>
                ) : (
                  currentStep === 3 ? 'Complete Profile' : 'Continue'
                )}
              </motion.button>
            </div>
          )}

          {/* Get Started Button for Completion */}
          {currentStep === 4 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)" 
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/settings')}
              className="w-full bg-blue-500 text-white py-4 px-6 rounded-2xl text-base font-semibold hover:shadow-xl transition-all duration-200 shadow-lg shadow-blue-500/25 mt-6"
            >
              Complete Your Profile
            </motion.button>
          )}
        </form>

        {/* Social Signup - Only show on first step */}
        {currentStep === 1 && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/90 text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {socialLogins.map((social) => (
                <motion.button
                  key={social.name}
                  type="button"
                  onClick={social.handler}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${social.color} py-3 px-4 rounded-2xl text-sm font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 bg-white/50 backdrop-blur-sm`}
                >
                  <social.icon className="text-base" />
                  <span>{social.name}</span>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* Login Link */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;