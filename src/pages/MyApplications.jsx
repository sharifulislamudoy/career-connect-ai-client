import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFileAlt,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaRegBuilding
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const MyApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchApplications();
    } else {
      navigate('/auth/login');
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/jobs/applied/${user.uid}`);
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.appliedJobs);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.job?.company?.toLowerCase().includes(searchTerm.toLowerCase());
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

  const getStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
    return stats;
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            My Applications
          </h1>
          <p className="text-gray-600">
            Track your job applications and their status
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
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
                  placeholder="Search applications..."
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
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow border border-gray-200">
            <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {applications.length === 0 
                ? 'Start applying to jobs to track your applications here!' 
                : 'Try adjusting your search criteria'}
            </p>
            {applications.length === 0 && (
              <button
                onClick={() => navigate('/jobs')}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
              >
                Browse Jobs
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app, index) => (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                    <div className="flex-1 mb-4 md:mb-0">
                      {app.job ? (
                        <>
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{app.job.title}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center text-gray-600 text-sm">
                              <FaRegBuilding className="mr-2 flex-shrink-0" />
                              <span>{app.job.company}</span>
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                              <FaMapMarkerAlt className="mr-2 flex-shrink-0" />
                              <span>{app.job.location}</span>
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                              <FaCalendarAlt className="mr-2 flex-shrink-0" />
                              <span>Applied {formatDate(app.appliedAt)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500 italic">Job information not available</div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(app.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                      </div>
                      
                      {app.status === 'accepted' && (
                        <div className="text-sm text-green-600 font-medium">
                          🎉 Congratulations! You've been selected
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Application Details</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-600">Applied as:</span>{' '}
                            <span className="font-medium">{app.fullName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Email:</span>{' '}
                            <span className="font-medium">{app.email}</span>
                          </div>
                          {app.phone && (
                            <div>
                              <span className="text-gray-600">Phone:</span>{' '}
                              <span className="font-medium">{app.phone}</span>
                            </div>
                          )}
                          {app.coverLetter && (
                            <div>
                              <span className="text-gray-600">Cover Letter:</span>{' '}
                              <p className="text-gray-700 mt-1 line-clamp-2">{app.coverLetter}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {app.job && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Job Details</h4>
                          <div className="space-y-1 text-sm">
                            {app.job.type && (
                              <div>
                                <span className="text-gray-600">Type:</span>{' '}
                                <span className="font-medium">{app.job.type}</span>
                              </div>
                            )}
                            {app.job.experience && (
                              <div>
                                <span className="text-gray-600">Experience:</span>{' '}
                                <span className="font-medium">{app.job.experience}</span>
                              </div>
                            )}
                            {app.job.salary && (
                              <div>
                                <span className="text-gray-600">Salary:</span>{' '}
                                <span className="font-medium">{app.job.salary}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex space-x-3">
                      {app.job && (
                        <>
                          <Link
                            to={`/job/${app.job._id}`}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium flex items-center"
                          >
                            <FaEye className="mr-2" />
                            View Job
                          </Link>
                          <Link
                            to={`/application/${app._id}`}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium flex items-center"
                          >
                            <FaFileAlt className="mr-2" />
                            View Application
                          </Link>
                        </>
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

export default MyApplications;