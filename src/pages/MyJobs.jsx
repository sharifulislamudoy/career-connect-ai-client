import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaUsers,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBriefcase,
  FaDollarSign,
  FaPlusCircle,
  FaClipboardList,
  FaSearch,
  FaBuilding
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const MyJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchMyJobs();
    } else {
      navigate('/auth/login');
    }
  }, [user]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/jobs/recruiter/${user.uid}`);
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setJobs(jobs.filter(job => job._id !== jobId));
        alert('Job deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        setJobs(jobs.map(job => 
          job._id === jobId ? { ...job, status: newStatus } : job
        ));
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
    //   case 'closed': return 'bg-red-100 text-red-800';
    //   case 'draft': return 'bg-yellow-100 text-yellow-800';
    //   default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-16">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                <FaClipboardList className="inline mr-3 text-blue-500" />
                My Job Posts
              </h1>
              <p className="text-gray-600">
                Manage your posted jobs and applications
              </p>
            </div>
            <button
              onClick={() => navigate('/post-job')}
              className="mt-4 md:mt-0 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center"
            >
              <FaPlusCircle className="mr-2" />
              Post New Job
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
              <div className="text-sm text-gray-600">Total Jobs</div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">
                {jobs.reduce((sum, job) => sum + (job.applicants || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Applicants</div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {jobs.filter(j => j.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
                  placeholder="Search your jobs..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your jobs...</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow border border-gray-200">
            <FaClipboardList className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {jobs.length === 0 ? 'No jobs posted yet' : 'No jobs match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {jobs.length === 0 
                ? 'Start posting your first job opportunity!' 
                : 'Try adjusting your search criteria'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => navigate('/post-job')}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
              >
                <FaPlusCircle className="inline mr-2" />
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaBuilding className="mr-2 flex-shrink-0" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaMapMarkerAlt className="mr-2 flex-shrink-0" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaCalendarAlt className="mr-2 flex-shrink-0" />
                          <span>Posted {formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{job.applicants || 0}</div>
                        <div className="text-xs text-gray-600">Applicants</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 pt-6 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
                      {job.type && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          <FaBriefcase className="inline mr-1" />
                          {job.type}
                        </span>
                      )}
                      {job.experience && (
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <FaUsers className="inline mr-1" />
                          {job.experience}
                        </span>
                      )}
                      {job.salary && (
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          <FaDollarSign className="inline mr-1" />
                          {job.salary}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <Link
                        to={`/job/${job._id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium flex items-center"
                      >
                        <FaEye className="mr-2" />
                        View
                      </Link>
                      <Link
                        to={`/job/${job._id}/applications`}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium flex items-center"
                      >
                        <FaUsers className="mr-2" />
                        Applicants
                      </Link>
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium flex items-center"
                      >
                        <FaTrash className="mr-2" />
                        Delete
                      </button>
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

export default MyJobs;