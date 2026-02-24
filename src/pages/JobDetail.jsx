import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaCalendarAlt,
  FaUsers,
  FaBuilding,
  FaGlobe,
  FaEnvelope,
  FaPaperPlane,
  FaFileAlt,
  FaClock,
  FaRegBuilding
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resume: null
  });

  useEffect(() => {
    fetchJob();
    if (user) {
      setApplicationData(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [id, user]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/jobs/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setJob(data.job);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth/login');
      return;
    }

    try {
      setApplying(true);

      const application = {
        jobSeekerId: user.uid,
        jobSeekerName: user.displayName || user.email,
        ...applicationData
      };

      const response = await fetch(`http://localhost:5000/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(application)
      });

      const data = await response.json();

      if (data.success) {
        setApplicationSent(true);
      } else {
        alert(data.message || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying:', error);
      alert('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
          >
            Browse Other Jobs
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
          onClick={() => navigate('/jobs')}
          className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Jobs
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details - Left Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8"
            >
              {/* Job Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex items-center text-gray-600 text-lg mb-2">
                      <FaRegBuilding className="mr-3" />
                      <span className="font-semibold">{job.company}</span>
                    </div>
                  </div>
                  {job.salary && (
                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-lg font-semibold">
                      <FaDollarSign className="inline mr-1" />
                      {job.salary}
                    </div>
                  )}
                </div>

                {/* Job Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="flex items-center text-gray-600">
                    <FaCalendarAlt className="mr-3 text-blue-500" />
                    <span>Posted {formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="prose max-w-none text-gray-700">
                  {job.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                  <div className="prose max-w-none text-gray-700">
                    {job.requirements.split('\n').map((requirement, index) => (
                      <p key={index} className="mb-2 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {requirement}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {job.responsibilities && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
                  <div className="prose max-w-none text-gray-700">
                    {job.responsibilities.split('\n').map((responsibility, index) => (
                      <p key={index} className="mb-2 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {responsibility}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {job.company}</h2>
                <div className="space-y-3">
                  {job.contactEmail && (
                    <div className="flex items-center text-gray-600">
                      <FaEnvelope className="mr-3" />
                      <span>{job.contactEmail}</span>
                    </div>
                  )}
                  {job.website && (
                    <div className="flex items-center text-gray-600">
                      <FaGlobe className="mr-3" />
                      <a href={job.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {job.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Application Form - Right Column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 sticky top-24"
            >
              {applicationSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaPaperPlane className="text-green-500 text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Application Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Your application has been submitted successfully. The recruiter will review it soon.
                  </p>
                  <button
                    onClick={() => navigate('/my-applications')}
                    className="bg-blue-500 text-white w-full py-3 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
                  >
                    View My Applications
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Apply for this Position</h3>
                  
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Application Deadline</span>
                      <FaClock className="text-blue-500" />
                    </div>
                    <p className="text-blue-700 font-semibold">
                      {job.applicationDeadline 
                        ? formatDate(job.applicationDeadline)
                        : 'No deadline specified'
                      }
                    </p>
                  </div>

                  <form onSubmit={handleApply} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={applicationData.fullName}
                        onChange={(e) => setApplicationData({...applicationData, fullName: e.target.value})}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={applicationData.email}
                        onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={applicationData.phone}
                        onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Letter
                      </label>
                      <textarea
                        value={applicationData.coverLetter}
                        onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                        rows="4"
                        placeholder="Tell us why you're the perfect candidate..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resume (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <FaFileAlt className="text-gray-400 text-2xl mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload resume</p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setApplicationData({...applicationData, resume: e.target.files[0]})}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={applying}
                      className="w-full bg-blue-500 text-white py-3.5 rounded-xl hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {applying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="mr-2" />
                          Submit Application
                        </>
                      )}
                    </button>
                  </form>

                  {!user && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-sm">
                      <p className="text-yellow-800">
                        You need to be logged in to apply for this job.
                      </p>
                      <button
                        onClick={() => navigate('/auth/login')}
                        className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Login to Apply
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;