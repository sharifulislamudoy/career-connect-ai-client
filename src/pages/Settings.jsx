// src/pages/Settings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaBriefcase, 
  FaGraduationCap, 
  FaCog, 
  FaSave,
  FaUpload,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaCheck,
  FaSpinner,
  FaExclamationTriangle,
  FaTrash,
  FaPlus,
  FaEdit,
  FaHome
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const Settings = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      profilePhoto: '',
      coverPhoto: ''
    },
    // Professional Information
    professional: {
      currentPosition: '',
      company: '',
      industry: '',
      yearsOfExperience: '',
      skills: [],
      newSkill: '',
    },
    // Education
    education: {
      highestDegree: '',
      institution: '',
      fieldOfStudy: '',
      graduationYear: '',
      gpa: '',
    },
    // Preferences
    preferences: {
      jobTypes: [],
      locations: [],
      remotePreference: 'hybrid',
      salaryExpectation: '',
      noticePeriod: '',
      visibility: 'public'
    },
    // Social Links
    social: {
      linkedin: '',
      github: '',
      portfolio: '',
      twitter: ''
    }
  });

  // Check if personal and education tabs are complete
  const checkProfileCompletion = useCallback(() => {
    const personalComplete = 
      formData.personal.fullName.trim() !== '' &&
      formData.personal.location.trim() !== '' &&
      formData.personal.bio.trim() !== '';
    
    const educationComplete = 
      formData.education.highestDegree.trim() !== '' &&
      formData.education.institution.trim() !== '' &&
      formData.education.fieldOfStudy.trim() !== '';
    
    const preferencesComplete = 
      formData.preferences.jobTypes.length > 0 &&
      formData.preferences.remotePreference.trim() !== '' &&
      formData.preferences.salaryExpectation.trim() !== '';

    return personalComplete && educationComplete && preferencesComplete;
  }, [formData]);

  // Check profile completion when form data changes
  useEffect(() => {
    setIsProfileComplete(checkProfileCompletion());
  }, [formData, checkProfileCompletion]);

  // Initialize form data when user profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        personal: {
          fullName: userProfile.displayName || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          location: userProfile.location || '',
          bio: userProfile.bio || '',
          profilePhoto: userProfile.photoURL || '',
          coverPhoto: userProfile.coverPhoto || ''
        },
        professional: {
          currentPosition: userProfile.currentPosition || '',
          company: userProfile.company || '',
          industry: userProfile.industry || '',
          yearsOfExperience: userProfile.yearsOfExperience || '',
          skills: userProfile.skills || [],
          newSkill: '',
        },
        education: {
          highestDegree: userProfile.highestDegree || '',
          institution: userProfile.institution || '',
          fieldOfStudy: userProfile.fieldOfStudy || '',
          graduationYear: userProfile.graduationYear || '',
          gpa: userProfile.gpa || '',
        },
        preferences: {
          jobTypes: userProfile.jobTypes || [],
          locations: userProfile.preferredLocations || [],
          remotePreference: userProfile.remotePreference || 'hybrid',
          salaryExpectation: userProfile.salaryExpectation || '',
          noticePeriod: userProfile.noticePeriod || '',
          visibility: userProfile.visibility || 'public'
        },
        social: {
          linkedin: userProfile.linkedin || '',
          github: userProfile.github || '',
          portfolio: userProfile.portfolio || '',
          twitter: userProfile.twitter || ''
        }
      }));
    }
  }, [userProfile]);

  const tabs = [
    { id: 'personal', label: 'Personal', icon: FaUser, required: true },
    { id: 'professional', label: 'Professional', icon: FaBriefcase, required: false },
    { id: 'education', label: 'Education', icon: FaGraduationCap, required: true },
    { id: 'preferences', label: 'Preferences', icon: FaCog, required: true },
    { id: 'social', label: 'Social', icon: FaGlobe, required: false }
  ];

  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Internship',
    'Remote'
  ];

  const experienceLevels = [
    'Entry Level (0-2 years)',
    'Mid Level (2-5 years)',
    'Senior Level (5-8 years)',
    'Executive (8+ years)'
  ];

  const degrees = [
    'High School',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD',
    'Other'
  ];

  // Check if required fields are filled for the active tab
  const checkRequiredFields = (tabId) => {
    switch (tabId) {
      case 'personal':
        return (
          formData.personal.fullName.trim() !== '' &&
          formData.personal.location.trim() !== '' &&
          formData.personal.bio.trim() !== ''
        );
      case 'education':
        return (
          formData.education.highestDegree.trim() !== '' &&
          formData.education.institution.trim() !== '' &&
          formData.education.fieldOfStudy.trim() !== ''
        );
      case 'preferences':
        return (
          formData.preferences.jobTypes.length > 0 &&
          formData.preferences.remotePreference.trim() !== '' &&
          formData.preferences.salaryExpectation.trim() !== ''
        );
      default:
        return true;
    }
  };

  // Handle tab change with validation
  const handleTabChange = (tabId) => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    
    // If current tab has required fields that aren't filled
    if (currentTab?.required && !checkRequiredFields(activeTab)) {
      toast.error(`Please fill all required fields in ${currentTab.label} tab before switching`);
      return;
    }
    
    setActiveTab(tabId);
  };

  // Handle navigation away from settings
  const handleNavigation = (e, targetPath) => {
    // Check if user is trying to navigate away from settings
    if (!isProfileComplete) {
      e.preventDefault();
      e.stopPropagation();
      toast.error('Please complete all required profile information before leaving this page');
    } else {
      navigate(targetPath);
    }
  };

  // Check on page load if user can leave settings
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isProfileComplete) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProfileComplete]);

  // Cloudinary upload function
  const uploadToCloudinary = async (file, type) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'react_unsigned');
      formData.append('cloud_name', 'dohhfubsa');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dohhfubsa/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;

    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (event, field, section) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const url = await uploadToCloudinary(file, field);
      handleInputChange(section, field, url);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Error uploading file');
    }
  };

  const addSkill = () => {
    if (formData.professional.newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        professional: {
          ...prev.professional,
          skills: [...prev.professional.skills, prev.professional.newSkill.trim()],
          newSkill: ''
        }
      }));
      toast.success('Skill added successfully!');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: prev.professional.skills.filter((_, i) => i !== index)
      }
    }));
    toast.success('Skill removed successfully!');
  };

  const toggleJobType = (type) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        jobTypes: prev.preferences.jobTypes.includes(type)
          ? prev.preferences.jobTypes.filter(t => t !== type)
          : [...prev.preferences.jobTypes, type]
      }
    }));
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        locations: [...prev.preferences.locations, '']
      }
    }));
  };

  const updateLocation = (index, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        locations: prev.preferences.locations.map((loc, i) => i === index ? value : loc)
      }
    }));
  };

  const removeLocation = (index) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        locations: prev.preferences.locations.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setSaveStatus('');

    try {
      // Combine all form data into a single update object
      const updateData = {
        // Personal
        displayName: formData.personal.fullName,
        phone: formData.personal.phone,
        location: formData.personal.location,
        bio: formData.personal.bio,
        photoURL: formData.personal.profilePhoto,
        coverPhoto: formData.personal.coverPhoto,

        // Professional
        currentPosition: formData.professional.currentPosition,
        company: formData.professional.company,
        industry: formData.professional.industry,
        yearsOfExperience: formData.professional.yearsOfExperience,
        skills: formData.professional.skills,

        // Education
        highestDegree: formData.education.highestDegree,
        institution: formData.education.institution,
        fieldOfStudy: formData.education.fieldOfStudy,
        graduationYear: formData.education.graduationYear,
        gpa: formData.education.gpa,

        // Preferences
        jobTypes: formData.preferences.jobTypes,
        preferredLocations: formData.preferences.locations,
        remotePreference: formData.preferences.remotePreference,
        salaryExpectation: formData.preferences.salaryExpectation,
        noticePeriod: formData.preferences.noticePeriod,
        visibility: formData.preferences.visibility,

        // Social
        linkedin: formData.social.linkedin,
        github: formData.social.github,
        portfolio: formData.social.portfolio,
        twitter: formData.social.twitter,

        // Mark profile as completed if all required fields are filled
        profileCompleted: isProfileComplete,
        updatedAt: new Date().toISOString()
      };

      await updateUserProfile(user.uid, updateData);
      setSaveStatus('success');
      toast.success('Profile updated successfully!');
      
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);

      // If profile is complete, show success message and redirect to home
      if (isProfileComplete && checkProfileCompletion()) {
        setTimeout(() => {
          Swal.fire({
            title: '🎉 Profile Complete!',
            text: 'Thanks for providing your information. Your profile is now fully set up!',
            icon: 'success',
            confirmButtonText: 'Go to Home',
            confirmButtonColor: '#3b82f6',
            showCancelButton: true,
            cancelButtonText: 'Stay Here'
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/');
            }
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
      toast.error('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center text-blue-800">
          <FaExclamationTriangle className="mr-2" />
          <span className="font-medium">Required Information</span>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Please fill out all fields marked with * to complete your profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Photo Upload */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Profile Photos
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="relative inline-block">
                <img
                  src={formData.personal.profilePhoto || '/default-avatar.png'}
                  alt="Profile"
                  className="w-32 h-32 rounded-2xl object-cover border-2 border-gray-200"
                />
                <label className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                  <FaUpload className="text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'profilePhoto', 'personal')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.personal.fullName}
            onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !formData.personal.fullName.trim() 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
            placeholder="Enter your full name"
            required
          />
          {!formData.personal.fullName.trim() && (
            <p className="text-red-500 text-xs mt-1">This field is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.personal.email}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={formData.personal.phone}
              onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="relative">
            <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.personal.location}
              onChange={(e) => handleInputChange('personal', 'location', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !formData.personal.location.trim() 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
              placeholder="City, Country"
              required
            />
          </div>
          {!formData.personal.location.trim() && (
            <p className="text-red-500 text-xs mt-1">This field is required</p>
          )}
        </div>

        {/* Bio */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Bio *
          </label>
          <textarea
            value={formData.personal.bio}
            onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              !formData.personal.bio.trim() 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
            placeholder="Tell us about yourself, your experience, and what you're looking for..."
            required
          />
          {!formData.personal.bio.trim() && (
            <p className="text-red-500 text-xs mt-1">This field is required</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderProfessionalTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Position
          </label>
          <input
            type="text"
            value={formData.professional.currentPosition}
            onChange={(e) => handleInputChange('professional', 'currentPosition', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Senior Frontend Developer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            value={formData.professional.company}
            onChange={(e) => handleInputChange('professional', 'company', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Current company"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <input
            type="text"
            value={formData.professional.industry}
            onChange={(e) => handleInputChange('professional', 'industry', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Technology, Healthcare, Finance"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <select
            value={formData.professional.yearsOfExperience}
            onChange={(e) => handleInputChange('professional', 'yearsOfExperience', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select experience level</option>
            {experienceLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills & Technologies
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.professional.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <FaTrash className="text-xs" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.professional.newSkill}
            onChange={(e) => handleInputChange('professional', 'newSkill', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a skill (press Enter)"
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
          >
            <FaPlus />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderEducationTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center text-blue-800">
          <FaExclamationTriangle className="mr-2" />
          <span className="font-medium">Required Information</span>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Please fill out all fields marked with * to complete your profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Highest Degree *
          </label>
          <select
            value={formData.education.highestDegree}
            onChange={(e) => handleInputChange('education', 'highestDegree', e.target.value)}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !formData.education.highestDegree.trim() 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
            required
          >
            <option value="">Select highest degree</option>
            {degrees.map(degree => (
              <option key={degree} value={degree}>{degree}</option>
            ))}
          </select>
          {!formData.education.highestDegree.trim() && (
            <p className="text-red-500 text-xs mt-1">This field is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution *
          </label>
          <input
            type="text"
            value={formData.education.institution}
            onChange={(e) => handleInputChange('education', 'institution', e.target.value)}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !formData.education.institution.trim() 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
            placeholder="University or College"
            required
          />
          {!formData.education.institution.trim() && (
            <p className="text-red-500 text-xs mt-1">This field is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field of Study *
          </label>
          <input
            type="text"
            value={formData.education.fieldOfStudy}
            onChange={(e) => handleInputChange('education', 'fieldOfStudy', e.target.value)}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !formData.education.fieldOfStudy.trim() 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
            placeholder="e.g., Computer Science"
            required
          />
          {!formData.education.fieldOfStudy.trim() && (
            <p className="text-red-500 text-xs mt-1">This field is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Graduation Year
          </label>
          <input
            type="number"
            value={formData.education.graduationYear}
            onChange={(e) => handleInputChange('education', 'graduationYear', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="YYYY"
            min="1950"
            max="2030"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GPA
          </label>
          <input
            type="text"
            value={formData.education.gpa}
            onChange={(e) => handleInputChange('education', 'gpa', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 3.8/4.0"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderPreferencesTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center text-blue-800">
          <FaExclamationTriangle className="mr-2" />
          <span className="font-medium">Required Information</span>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Please fill out all fields marked with * to complete your profile
        </p>
      </div>

      {/* Job Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Preferred Job Types *
        </label>
        {formData.preferences.jobTypes.length === 0 && (
          <p className="text-red-500 text-sm mb-3">Please select at least one job type</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {jobTypes.map(type => (
            <label
              key={type}
              className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                formData.preferences.jobTypes.includes(type)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.preferences.jobTypes.includes(type)}
                onChange={() => toggleJobType(type)}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
                formData.preferences.jobTypes.includes(type)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {formData.preferences.jobTypes.includes(type) && (
                  <FaCheck className="text-white text-xs" />
                )}
              </div>
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Remote Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Remote Work Preference *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'onsite', label: 'On-site Only' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'remote', label: 'Fully Remote' }
          ].map(option => (
            <label
              key={option.value}
              className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                formData.preferences.remotePreference === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="remotePreference"
                value={option.value}
                checked={formData.preferences.remotePreference === option.value}
                onChange={(e) => handleInputChange('preferences', 'remotePreference', e.target.value)}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center ${
                formData.preferences.remotePreference === option.value
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {formData.preferences.remotePreference === option.value && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Preferred Locations */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Preferred Locations
          </label>
          <button
            type="button"
            onClick={addLocation}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add Location
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.preferences.locations.map((location, index) => (
            <div key={index} className="flex gap-3">
              <input
                type="text"
                value={location}
                onChange={(e) => updateLocation(index, e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, State, Country"
              />
              <button
                type="button"
                onClick={() => removeLocation(index)}
                className="px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Salary and Notice Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Expectation (Annual) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={formData.preferences.salaryExpectation}
              onChange={(e) => handleInputChange('preferences', 'salaryExpectation', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !formData.preferences.salaryExpectation.trim() 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
              placeholder="e.g., 75000"
              required
            />
          </div>
          {!formData.preferences.salaryExpectation.trim() && (
            <p className="text-red-500 text-xs mt-1">This field is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notice Period
          </label>
          <select
            value={formData.preferences.noticePeriod}
            onChange={(e) => handleInputChange('preferences', 'noticePeriod', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select notice period</option>
            <option value="immediately">Immediately</option>
            <option value="1_week">1 Week</option>
            <option value="2_weeks">2 Weeks</option>
            <option value="1_month">1 Month</option>
            <option value="2_months">2 Months</option>
            <option value="3_months">3 Months</option>
          </select>
        </div>
      </div>

      {/* Profile Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Profile Visibility
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'public', label: 'Public', description: 'Visible to all employers' },
            { value: 'recruiters', label: 'Recruiters Only', description: 'Visible only to verified recruiters' },
            { value: 'private', label: 'Private', description: 'Only visible to you' }
          ].map(option => (
            <label
              key={option.value}
              className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                formData.preferences.visibility === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={formData.preferences.visibility === option.value}
                  onChange={(e) => handleInputChange('preferences', 'visibility', e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center ${
                  formData.preferences.visibility === option.value
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {formData.preferences.visibility === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
              <span className="text-sm text-gray-600 ml-8">{option.description}</span>
            </label>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderSocialTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaLinkedin className="inline mr-2 text-blue-700" />
            LinkedIn Profile
          </label>
          <input
            type="url"
            value={formData.social.linkedin}
            onChange={(e) => handleInputChange('social', 'linkedin', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaGithub className="inline mr-2 text-gray-900" />
            GitHub Profile
          </label>
          <input
            type="url"
            value={formData.social.github}
            onChange={(e) => handleInputChange('social', 'github', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://github.com/yourusername"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaGlobe className="inline mr-2 text-green-600" />
            Portfolio Website
          </label>
          <input
            type="url"
            value={formData.social.portfolio}
            onChange={(e) => handleInputChange('social', 'portfolio', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://yourportfolio.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaEnvelope className="inline mr-2 text-blue-400" />
            Twitter/X Profile
          </label>
          <input
            type="url"
            value={formData.social.twitter}
            onChange={(e) => handleInputChange('social', 'twitter', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://twitter.com/yourusername"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalTab();
      case 'professional':
        return renderProfessionalTab();
      case 'education':
        return renderEducationTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'social':
        return renderSocialTab();
      default:
        return renderPersonalTab();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">
            Manage your profile information, preferences, and career details
          </p>
          
          {/* Profile Completion Status */}
          <div className="mt-4 flex items-center justify-between">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isProfileComplete 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isProfileComplete ? (
                <>
                  <FaCheck className="mr-2" />
                  Profile Complete
                </>
              ) : (
                <>
                  <FaExclamationTriangle className="mr-2" />
                  Profile Incomplete
                </>
              )}
            </div>
            
            {/* Home Button */}
            <button
              onClick={(e) => handleNavigation(e, '/')}
              disabled={!isProfileComplete}
              className={`flex items-center px-4 py-2 rounded-2xl font-medium transition-all duration-200 ${
                isProfileComplete
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FaHome className="mr-2" />
              Go to Home
            </button>
          </div>
          
          {/* Completion Notice */}
          {!isProfileComplete && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <div className="flex items-center text-yellow-800">
                <FaExclamationTriangle className="mr-2" />
                <span className="font-medium">Complete Your Profile</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please complete all required fields in <strong>Personal</strong>, <strong>Education</strong>, 
                and <strong>Preferences</strong> tabs before accessing other features.
              </p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isRequired = tab.required;
                  const isComplete = checkRequiredFields(tab.id);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`mr-3 text-lg ${
                          activeTab === tab.id ? 'text-white' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">{tab.label}</span>
                        {isRequired && (
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                            activeTab === tab.id 
                              ? 'bg-white/20 text-white' 
                              : isComplete 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {isComplete ? '✓' : '!'}
                          </span>
                        )}
                      </div>
                      {isRequired && !isComplete && activeTab !== tab.id && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading || uploading}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 font-semibold"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>

                {/* Status Messages */}
                <AnimatePresence>
                  {saveStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm flex items-center"
                    >
                      <FaCheck className="mr-2" />
                      Changes saved successfully!
                    </motion.div>
                  )}
                  
                  {saveStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center"
                    >
                      <FaExclamationTriangle className="mr-2" />
                      Error saving changes. Please try again.
                    </motion.div>
                  )}

                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 text-sm flex items-center"
                    >
                      <FaSpinner className="animate-spin mr-2" />
                      Uploading file...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-6">
              <AnimatePresence mode="wait">
                {renderTabContent()}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;