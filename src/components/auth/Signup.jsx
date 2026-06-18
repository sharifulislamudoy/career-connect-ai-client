import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  FaSpinner,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    location: "",
    profession: "",
    userType: "",
    profilePhoto: null,
    photoPreview: "",
    cloudinaryUrl: "",
  });

  const {
    signUp,
    signInWithGoogle,
    sendVerificationCode,
    verifyCode,
    consumeVerificationCode,
    error,
    clearError,
    user,
  } = useAuth();

  const navigate = useNavigate();

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dohhfubsa";
  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "react_unsigned";

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    let timer;

    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }

    return () => clearTimeout(timer);
  }, [countdown]);

  const professions = [
    "Web Developer",
    "MERN Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Digital Marketer",
    "WordPress Developer",
    "UI/UX Designer",
    "Data Scientist",
    "DevOps Engineer",
    "Mobile App Developer",
    "Software Engineer",
    "Other",
  ];

  const userTypes = [
    {
      id: "jobSeeker",
      name: "Job Seeker",
      icon: FaUser,
      description: "Find your dream job",
    },
    {
      id: "recruiter",
      name: "Recruiter",
      icon: FaBriefcase,
      description: "Hire top talent",
    },
  ];

  const steps = [
    { number: 1, title: "Account" },
    { number: 2, title: "Profile" },
    { number: 3, title: "Complete" },
  ];

  const uploadToCloudinary = async (file) => {
    try {
      setUploading(true);

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("upload_preset", uploadPreset);
      formDataUpload.append("cloud_name", cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      return data.secure_url;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;

    clearError();

    if (name === "profilePhoto" && files?.[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        profilePhoto: file,
        photoPreview: previewUrl,
      }));

      try {
        const url = await uploadToCloudinary(file);

        setFormData((prev) => ({
          ...prev,
          cloudinaryUrl: url,
        }));

        toast.success("Photo uploaded successfully");
      } catch {
        toast.error("Photo upload failed");
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          toast.error("Please fill all fields");
          return false;
        }

        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords don't match");
          return false;
        }

        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return false;
        }

        return true;

      case 2:
        if (!formData.fullName || !formData.location || !formData.profession) {
          toast.error("Please fill all profile fields");
          return false;
        }

        return true;

      case 3:
        if (!formData.userType) {
          toast.error("Please select whether you are a Job Seeker or Recruiter");
          return false;
        }

        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    handleStartVerification();
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getUserDataToStore = () => {
    return {
      fullName: formData.fullName,
      photoURL: formData.cloudinaryUrl || formData.photoPreview || "",
      location: formData.location,
      profession: formData.profession,
      userType: formData.userType,
    };
  };

  const handleStartVerification = async () => {
    if (uploading || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await sendVerificationCode(
        formData.email,
        "signup",
        getUserDataToStore()
      );

      setVerificationStep(true);
      setCountdown(60);
      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error(err.message || "Failed to send verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndSignUp = async (e) => {
    e.preventDefault();

    const cleanCode = verificationCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyCode(formData.email, cleanCode, "signup");

      await signUp(formData.email, formData.password, result.userData);

      try {
        await consumeVerificationCode(formData.email, cleanCode, "signup");
      } catch (consumeError) {
        console.warn("Code consume failed:", consumeError.message);
      }

      toast.success("Account created successfully! Please complete your profile.");
      navigate("/settings");
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await sendVerificationCode(
        formData.email,
        "signup",
        getUserDataToStore()
      );

      setCountdown(60);
      toast.success("New verification code sent");
    } catch (err) {
      toast.error(err.message || "Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      toast.success("Signed up successfully!");
      navigate("/settings");
    } catch (err) {
      toast.error(err.message || "Google sign up failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToForm = () => {
    setVerificationStep(false);
    setVerificationCode("");
    clearError();
  };

  const ErrorMessage = () => {
    if (!error) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3"
      >
        <FaExclamationTriangle className="text-red-500 mt-0.5" />
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
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />

            <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
              className="w-full pl-12 pr-12 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />

            <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
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
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />

            <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
          className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-blue-500"
          required
          disabled={isSubmitting}
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
          className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-blue-500"
          required
          disabled={isSubmitting}
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
          className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-blue-500"
          required
          disabled={isSubmitting}
        >
          <option value="">Select your profession</option>

          {professions.map((prof) => (
            <option key={prof} value={prof}>
              {prof}
            </option>
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
                  ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10"
                  : "border-gray-200 bg-gray-50/50 hover:border-blue-300"
              }`}
            >
              <input
                type="radio"
                name="userType"
                value={type.id}
                checked={formData.userType === type.id}
                onChange={handleInputChange}
                className="sr-only"
                required
                disabled={isSubmitting}
              />

              <type.icon
                className={`text-2xl mb-3 ${
                  formData.userType === type.id
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              />

              <span
                className={`font-semibold text-sm ${
                  formData.userType === type.id
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
              >
                {type.name}
              </span>

              <span className="text-xs text-gray-500 mt-1 text-center">
                {type.description}
              </span>
            </motion.label>
          ))}
        </div>
      </div>

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
                  {uploading ? "Uploading..." : "Upload Photo"}
                </span>
              </div>
            )}

            <input
              type="file"
              name="profilePhoto"
              onChange={handleInputChange}
              accept="image/*"
              className="hidden"
              disabled={uploading || isSubmitting}
            />
          </label>
        </div>

        {uploading && (
          <p className="text-xs text-blue-600 text-center mt-2">
            Uploading to Cloudinary...
          </p>
        )}
      </div>
    </motion.div>
  );

  const renderVerification = () => (
    <motion.form
      key="verification"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleVerifyAndSignUp}
      className="space-y-6"
    >
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Verify Your Email
        </h3>

        <p className="text-gray-600 text-sm mt-2">
          We've sent a 6-digit verification code to{" "}
          <strong>{formData.email}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>

        <input
          type="text"
          value={verificationCode}
          onChange={(e) =>
            setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500"
          placeholder="000000"
          maxLength="6"
          required
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70 flex items-center justify-center"
      >
        {isSubmitting ? (
          <FaSpinner className="animate-spin" />
        ) : (
          "Verify & Create Account"
        )}
      </button>

      <div className="text-center space-y-3">
        <button
          type="button"
          onClick={resendCode}
          disabled={countdown > 0 || isSubmitting}
          className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
        >
          Resend code {countdown > 0 && `(${countdown}s)`}
        </button>

        <br />

        <button
          type="button"
          onClick={goBackToForm}
          disabled={isSubmitting}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          Change signup information
        </button>
      </div>
    </motion.form>
  );

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
        >
          <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100/80 p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join Creative Career AI
          </h2>

          <p className="text-gray-600">
            {!verificationStep
              ? "Create your account in just a few steps"
              : "Verify your email to continue"}
          </p>
        </div>

        <ErrorMessage />

        {!verificationStep && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300 ${
                      currentStep >= step.number
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <FaCheck className="text-xs" />
                    ) : (
                      step.number
                    )}
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all duration-300 ${
                        currentStep > step.number
                          ? "bg-blue-500"
                          : "bg-gray-200"
                      }`}
                    />
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

        <AnimatePresence mode="wait">
          {!verificationStep ? (
            <motion.div key="form">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div
                className={`flex space-x-4 mt-8 ${
                  currentStep === 1 ? "justify-end" : ""
                }`}
              >
                {currentStep > 1 && (
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={uploading || isSubmitting}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 px-6 rounded-2xl text-base font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-200 disabled:opacity-70"
                  >
                    Back
                  </motion.button>
                )}

                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  disabled={uploading || isSubmitting}
                  className={`${
                    currentStep > 1 ? "flex-1" : "w-full"
                  } bg-blue-500 text-white py-4 px-6 rounded-2xl text-base font-semibold hover:shadow-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center`}
                >
                  {isSubmitting ? (
                    <FaSpinner className="animate-spin" />
                  ) : currentStep === 3 ? (
                    "Complete Profile"
                  ) : (
                    "Continue"
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            renderVerification()
          )}
        </AnimatePresence>

        {!verificationStep && currentStep === 1 && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/50"></div>
              </div>

              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/90 text-gray-500">
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <motion.button
                onClick={handleGoogleSignUp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center space-x-2 bg-white/50 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-all disabled:opacity-70"
              >
                <FaGoogle className="text-base" />
                <span>Google</span>
              </motion.button>
            </div>
          </>
        )}

        {!verificationStep && (
          <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SignUp;