import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaDollarSign,
  FaBuilding,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaUsers,
  FaRegBuilding,
  FaCheckCircle // add verified icon
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    experience: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];
  const experienceLevels = ['Entry', 'Junior', 'Mid', 'Senior', 'Lead'];

  useEffect(() => {
    fetchJobs();
  }, [currentPage, searchTerm, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 12,
        search: searchTerm,
        ...filters
      }).toString();

      const response = await fetch(`http://localhost:5000/api/jobs?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleApply = (jobId) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    navigate(`/apply/${jobId}`);
  };

  const handleViewDetails = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Find Your <span className="text-blue-600">Dream Job</span>
          </h1>
          <p className="text-gray-600">
            Discover thousands of job opportunities with all the information you need.
          </p>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search jobs, companies, or keywords..."
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="City, Country"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaBriefcase className="inline mr-2" />
                  Job Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                >
                  <option value="">All Types</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUsers className="inline mr-2" />
                  Experience
                </label>
                <select
                  value={filters.experience}
                  onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm"
                >
                  <option value="">All Levels</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.location || filters.type || filters.experience) && (
              <button
                type="button"
                onClick={() => setFilters({ location: '', type: '', experience: '' })}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </form>
        </motion.div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <FaBriefcase className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {jobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Job Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{job.title}</h3>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <FaRegBuilding className="mr-2" />
                          <span>{job.company}</span>
                          {/* Verified Badge */}
                          {job.isVerified && (
                            <FaCheckCircle className="ml-2 text-blue-500" title="Verified Company" />
                          )}
                        </div>
                      </div>
                      {job.salary && (
                        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          <FaDollarSign className="inline mr-1" />
                          {job.salary}
                        </div>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600 text-sm">
                        <FaMapMarkerAlt className="mr-2 flex-shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      {job.type && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaBriefcase className="mr-2 flex-shrink-0" />
                          <span>{job.type}</span>
                        </div>
                      )}
                      {job.experience && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaUsers className="mr-2 flex-shrink-0" />
                          <span>{job.experience} Level</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600 text-sm">
                        <FaCalendarAlt className="mr-2 flex-shrink-0" />
                        <span>Posted {formatDate(job.createdAt)}</span>
                      </div>
                      {job.applicants !== undefined && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaUsers className="mr-2 flex-shrink-0" />
                          <span>{job.applicants} applicants</span>
                        </div>
                      )}
                    </div>

                    {/* Job Description Preview */}
                    <div className="mb-6">
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {job.description.substring(0, 150)}...
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewDetails(job._id)}
                        className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
                      >
                        <FaExternalLinkAlt className="mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleApply(job._id)}
                        className="flex-1 bg-blue-500 text-white hover:bg-blue-600 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Jobs;