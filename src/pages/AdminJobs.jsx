import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding,
  FaMapMarkerAlt,
  FaBriefcase,
  FaUserCheck,
  FaEye
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminJobs = () => {
  const { user } = useAuth();
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/jobs/pending', {
        headers: {
          'x-user-id': user.uid
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingJobs(data.jobs);
      } else {
        toast.error(data.message || 'Failed to fetch pending jobs');
      }
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
      toast.error('Error loading pending jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (jobId) => {
    if (!window.confirm('Approve this job? It will be marked as verified.')) return;
    setVerifying(jobId);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/jobs/${jobId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Job verified successfully');
        setPendingJobs(prev => prev.filter(job => job._id !== jobId));
      } else {
        toast.error(data.message || 'Failed to verify job');
      }
    } catch (error) {
      console.error('Error verifying job:', error);
      toast.error('Error verifying job');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Job Verification</h1>
      <p className="text-gray-600 mb-6">
        Review jobs that have uploaded a license image and approve them to show the verified badge.
      </p>

      {pendingJobs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-12 text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">All clear!</h3>
          <p className="text-gray-600">There are no jobs pending verification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <FaBuilding className="mr-2" />
                    <span>{job.company}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Pending
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600 text-sm">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{job.location}</span>
                </div>
                {job.type && (
                  <div className="flex items-center text-gray-600 text-sm">
                    <FaBriefcase className="mr-2" />
                    <span>{job.type}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600 text-sm">
                  <FaUserCheck className="mr-2" />
                  <span>Recruiter: {job.recruiterId}</span>
                </div>
              </div>

              {job.licenseImage && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">License Image:</p>
                  <img
                    src={job.licenseImage}
                    alt="License"
                    className="max-h-32 rounded-lg border border-gray-200 object-cover"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => handleVerify(job._id)}
                  disabled={verifying === job._id}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center disabled:opacity-50"
                >
                  {verifying === job._id ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaCheckCircle className="mr-2" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => window.open(`/job/${job._id}`, '_blank')}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FaEye />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminJobs;