import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaEnvelope,
  FaPhone,
  FaFileAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaDownload,
  FaEye,
  FaUser,
  FaBuilding,
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaUsers
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const JobApplications = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJobAndApplications();
  }, [id]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await fetch(`http://localhost:5000/api/jobs/${id}`);
      const jobData = await jobResponse.json();
      
      if (jobData.success) {
        setJob(jobData.job);
        
        // Check if user is the recruiter who posted this job
        if (jobData.job.recruiterId !== user.uid) {
          navigate('/my-jobs');
          return;
        }
        
        // Fetch applications for this job
        const appsResponse = await fetch(
          `http://localhost:5000/api/jobs/${id}/applications?recruiterId=${user.uid}`
        );
        const appsData = await appsResponse.json();
        
        if (appsData.success) {
          setApplications(appsData.applications);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/jobs/applications/${applicationId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            recruiterId: user.uid
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
        alert('Application status updated');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <FaCheckCircle className="text-green-500 text-lg" />;
      case 'rejected': return <FaTimesCircle className="text-red-500 text-lg" />;
      case 'reviewed': return <FaFileAlt className="text-blue-500 text-lg" />;
      default: return <FaHourglassHalf className="text-yellow-500 text-lg" />;
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

  const getStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate('/my-jobs')}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-4"
              >
                <FaArrowLeft className="mr-2" />
                Back to My Jobs
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Applications for: {job?.title}
              </h1>
              <div className="flex items-center text-gray-600">
                <FaBuilding className="mr-2" />
                <span>{job?.company}</span>
                <span className="mx-2">•</span>
                <FaMapMarkerAlt className="mr-2" />
                <span>{job?.location}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Applicants</div>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
              <div className="text-sm text-gray-600">Reviewed</div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search applicants by name, email, or phone..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow border border-gray-200">
            <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
            </h3>
            <p className="text-gray-600">
              {applications.length === 0 
                ? 'No one has applied for this job yet.' 
                : 'Try adjusting your search criteria'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application, index) => (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <FaUser className="text-blue-500 text-xl" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{application.fullName}</h3>
                          <div className="flex items-center text-gray-600 text-sm mt-1">
                            <FaEnvelope className="mr-2" />
                            <span>{application.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {application.phone && (
                          <div className="flex items-center text-gray-600 text-sm">
                            <FaPhone className="mr-2 flex-shrink-0" />
                            <span>{application.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaCalendarAlt className="mr-2 flex-shrink-0" />
                          <span>Applied {formatDate(application.appliedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(application.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                      
                      {/* Status Change Buttons */}
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleStatusChange(application._id, 'reviewed')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            application.status === 'reviewed' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleStatusChange(application._id, 'accepted')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            application.status === 'accepted' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(application._id, 'rejected')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            application.status === 'rejected' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {application.coverLetter && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-xl">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}

                  {/* Resume */}
                  {application.resume && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Resume</h4>
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center">
                          <FaFileAlt className="text-blue-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {application.resume.name || 'Resume.pdf'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {application.resume.size ? `${(application.resume.size / 1024).toFixed(1)} KB` : 'Size not available'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(application.resume.url, '_blank')}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center"
                        >
                          <FaDownload className="mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => window.location.href = `mailto:${application.email}`}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium flex items-center"
                      >
                        <FaEnvelope className="mr-2" />
                        Send Email
                      </button>
                      {application.phone && (
                        <button
                          onClick={() => window.location.href = `tel:${application.phone}`}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium flex items-center"
                        >
                          <FaPhone className="mr-2" />
                          Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;