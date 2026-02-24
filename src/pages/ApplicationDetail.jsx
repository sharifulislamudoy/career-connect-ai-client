import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaFileAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaDownload,
  FaUser,
  FaBuilding,
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaUsers,
  FaPaperclip,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const ApplicationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/jobs/applications/${id}?userId=${user.uid}&userType=${user.userType}`
      );
      const data = await response.json();
      
      if (data.success) {
        setApplication(data.application);
        setJob(data.application.job);
      } else {
        alert(data.message);
        navigate(user.userType === 'recruiter' ? '/my-jobs' : '/my-applications');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      alert('Failed to load application');
      navigate(user.userType === 'recruiter' ? '/my-jobs' : '/my-applications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <FaCheckCircle className="text-green-500 text-2xl" />;
      case 'rejected': return <FaTimesCircle className="text-red-500 text-2xl" />;
      case 'reviewed': return <FaFileAlt className="text-blue-500 text-2xl" />;
      default: return <FaHourglassHalf className="text-yellow-500 text-2xl" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'reviewed': return 'Under Review';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Not Selected';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Not Found</h2>
          <p className="text-gray-600 mb-6">The application you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(user.userType === 'recruiter' ? '/my-jobs' : '/my-applications')}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(user.userType === 'recruiter' ? '/my-jobs' : '/my-applications')}
          className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to {user.userType === 'recruiter' ? 'My Jobs' : 'My Applications'}
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Application Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8"
            >
              {/* Application Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <FaUser className="text-blue-500 text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{application.fullName}</h1>
                    <div className="flex items-center text-gray-600">
                      <FaEnvelope className="mr-2" />
                      <span>{application.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(application.status)}
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Applied {formatDate(application.appliedAt)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                    <FaEnvelope className="text-gray-500 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-medium">{application.email}</div>
                    </div>
                  </div>
                  {application.phone && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                      <FaPhone className="text-gray-500 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium">{application.phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              {application.coverLetter && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Cover Letter</h2>
                  <div className="p-6 bg-gray-50 rounded-2xl">
                    <div className="prose max-w-none text-gray-700">
                      {application.coverLetter.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Resume */}
              {application.resume && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume</h2>
                  <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaFileAlt className="text-blue-500 text-3xl mr-4" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {application.resume.name || 'Resume.pdf'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {application.resume.size ? `${(application.resume.size / 1024).toFixed(1)} KB` : 'PDF Document'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(application.resume.url, '_blank')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium flex items-center"
                      >
                        <FaDownload className="mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Job Details */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 sticky top-24"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Details</h2>
              
              {job ? (
                <>
                  {/* Job Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{job.title}</h3>
                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <FaBuilding className="mr-2" />
                        <span>{job.company}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <FaMapMarkerAlt className="mr-3 text-blue-500" />
                        <span>{job.location}</span>
                      </div>
                      {job.type && (
                        <div className="flex items-center text-gray-600">
                          <FaBriefcase className="mr-3 text-blue-500" />
                          <span>{job.type}</span>
                        </div>
                      )}
                      {job.experience && (
                        <div className="flex items-center text-gray-600">
                          <FaUsers className="mr-3 text-blue-500" />
                          <span>{job.experience} Level</span>
                        </div>
                      )}
                      {job.salary && (
                        <div className="flex items-center text-gray-600">
                          <FaDollarSign className="mr-3 text-blue-500" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <FaCalendarAlt className="mr-3 text-blue-500" />
                        <span>Posted {formatDate(job.createdAt)}</span>
                      </div>
                    </div>

                    {/* Job Description Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Job Description</h4>
                      <p className="text-gray-700 text-sm line-clamp-4">
                        {job.description.substring(0, 200)}...
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-gray-200">
                      <Link
                        to={`/job/${job._id}`}
                        className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-3 rounded-xl font-medium transition-colors flex items-center justify-center mb-3"
                      >
                        <FaExternalLinkAlt className="mr-2" />
                        View Job Details
                      </Link>
                      
                      {user.userType === 'recruiter' && (
                        <Link
                          to={`/job/${job._id}/applications`}
                          className="w-full bg-green-50 text-green-600 hover:bg-green-100 py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
                        >
                          <FaUsers className="mr-2" />
                          View All Applications
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Job information not available</p>
                </div>
              )}

              {/* Recruiter Actions */}
              {user.userType === 'recruiter' && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusChange(application._id, 'reviewed')}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        application.status === 'reviewed' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => handleStatusChange(application._id, 'accepted')}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        application.status === 'accepted' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      Accept Application
                    </button>
                    <button
                      onClick={() => handleStatusChange(application._id, 'rejected')}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        application.status === 'rejected' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      Reject Application
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;