import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaUser, 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaEnvelope, 
  FaCheck, 
  FaTimes, 
  FaUserPlus, 
  FaUserCheck, 
  FaClock, 
  FaUsers,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaArrowLeft,
  FaTrash,
  FaEye,
  FaGraduationCap,
  FaUniversity,
  FaSuitcase,
  FaGlobe,
  FaPhone,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaLink,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaHome,
  FaLaptopHouse,
  FaEyeSlash
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';

const Network = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConnections: 0,
    pendingRequests: 0,
    sentRequests: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfession, setFilterProfession] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [professions, setProfessions] = useState([]);

  useEffect(() => {
    if (user) {
      loadNetworkData();
      loadProfessions();
    }
  }, [user, activeTab]);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'all':
          await loadAllUsers();
          break;
        case 'connections':
          await loadConnections();
          break;
        case 'pending':
          await loadPendingRequests();
          break;
        case 'sent':
          await loadSentRequests();
          break;
        case 'suggestions':
          await loadSuggestions();
          break;
      }
      
      await loadStats();
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      
      if (data.success) {
        const usersWithStatus = await Promise.all(
          data.users
            .filter(u => u.uid !== user.uid)
            .map(async (userItem) => {
              const statusResponse = await fetch(
                `http://localhost:5000/api/connections/status/${user.uid}/${userItem.uid}`
              );
              const statusData = await statusResponse.json();
              
              return {
                ...userItem,
                connectionStatus: statusData.status || null,
                connectionId: statusData.connectionId,
                isSender: statusData.senderId === user.uid
              };
            })
        );
        
        setConnections(usersWithStatus);
      }
    } catch (error) {
      console.error('Error loading all users:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/user/${user.uid}?status=accepted`);
      const data = await response.json();
      
      if (data.success) {
        setConnections(data.connections.map(conn => ({
          ...conn.otherUser,
          connectionId: conn._id,
          connectionStatus: 'accepted',
          connectedSince: conn.respondedAt,
          isSender: false
        })));
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/pending/${user.uid}`);
      const data = await response.json();
      
      if (data.success) {
        setPendingRequests(data.requests);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadSentRequests = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/sent/${user.uid}`);
      const data = await response.json();
      
      if (data.success) {
        const sentRequestsWithStatus = data.requests.map(request => ({
          ...request.receiver,
          connectionStatus: 'pending',
          connectionId: request._id,
          isSender: true,
          request: request
        }));
        setSentRequests(sentRequestsWithStatus);
      }
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/suggestions/${user.uid}`);
      const data = await response.json();
      
      if (data.success) {
        const suggestionsWithStatus = await Promise.all(
          data.suggestions.map(async (suggestion) => {
            const statusResponse = await fetch(
              `http://localhost:5000/api/connections/status/${user.uid}/${suggestion.uid}`
            );
            const statusData = await statusResponse.json();
            
            return {
              ...suggestion,
              connectionStatus: statusData.status || null,
              connectionId: statusData.connectionId,
              isSender: statusData.senderId === user.uid
            };
          })
        );
        setSuggestions(suggestionsWithStatus);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/stats/${user.uid}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProfessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/professions');
      const data = await response.json();
      
      if (data.success) {
        setProfessions(data.professions);
      }
    } catch (error) {
      console.error('Error loading professions:', error);
    }
  };

  const sendConnectionRequest = async (receiverId) => {
    try {
      const response = await fetch('http://localhost:5000/api/connections/send-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId,
          message: `Hi, I'd like to connect with you on Creative Career AI!`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadNetworkData();
        await loadStats();
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const acceptConnectionRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/accept-request/${requestId}`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        setShowUserModal(false);
        await loadNetworkData();
        await loadStats();
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
    }
  };

  const rejectConnectionRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/reject-request/${requestId}`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        setShowUserModal(false);
        await loadNetworkData();
        await loadStats();
      }
    } catch (error) {
      console.error('Error rejecting connection request:', error);
    }
  };

  const withdrawConnectionRequest = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/withdraw-request/${requestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setShowUserModal(false);
        await loadNetworkData();
        await loadStats();
      }
    } catch (error) {
      console.error('Error withdrawing connection request:', error);
    }
  };

  const removeConnection = async (connectionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/connections/remove-connection/${connectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setShowUserModal(false);
        await loadNetworkData();
        await loadStats();
      }
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const openUserModal = (userData) => {
    setSelectedUser(userData);
    setShowUserModal(true);
  };

  const filteredConnections = connections.filter(userItem => {
    const matchesSearch = searchTerm === '' || 
      userItem.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.profession?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProfession = filterProfession === '' || 
      userItem.profession === filterProfession;
    
    return matchesSearch && matchesProfession;
  });

  const tabs = [
    { id: 'all', label: 'All', icon: FaUsers, count: connections.length },
    { id: 'connections', label: 'Connections', icon: FaUserCheck, count: stats.totalConnections },
    { id: 'pending', label: 'Pending', icon: FaClock, count: stats.pendingRequests },
    { id: 'sent', label: 'Sent', icon: FaEnvelope, count: stats.sentRequests },
    { id: 'suggestions', label: 'Suggestions', icon: FaUserPlus, count: suggestions.length }
  ];

  const ConnectionCard = ({ user: userItem, isRequest = false, request = null }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-start space-x-4">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50">
            {userItem.photoURL ? (
              <img
                src={userItem.photoURL}
                alt={userItem.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaUser className="text-blue-400 text-2xl" />
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg truncate">
            {userItem.displayName || 'Anonymous User'}
          </h3>
          
          <div className="flex items-center mt-1">
            {userItem.userType === 'jobSeeker' ? (
              <FaSuitcase className="text-gray-400 text-sm mr-1" />
            ) : (
              <FaBriefcase className="text-gray-400 text-sm mr-1" />
            )}
            <span className="text-sm text-gray-600 capitalize">{userItem.userType || 'User'}</span>
          </div>
          
          {userItem.location && (
            <div className="flex items-center mt-1">
              <FaMapMarkerAlt className="text-gray-400 text-sm mr-1" />
              <span className="text-sm text-gray-600">{userItem.location}</span>
            </div>
          )}
          
          {userItem.fieldOfStudy && (
            <div className="flex items-center mt-1">
              <FaGraduationCap className="text-gray-400 text-sm mr-1" />
              <span className="text-sm text-gray-600">{userItem.fieldOfStudy}</span>
            </div>
          )}
          
          {isRequest && request?.message && (
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              "{request.message}"
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => openUserModal({...userItem, request})}
            className="flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            <FaEye className="mr-2" />
            View More
          </button>
          
          {!isRequest && userItem.connectionStatus === 'accepted' && (
            <button
              onClick={() => removeConnection(userItem.connectionId)}
              className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <FaTrash className="mr-2" />
              Remove
            </button>
          )}

          {!isRequest && userItem.connectionStatus === 'pending' && userItem.isSender && (
            <button
              onClick={() => withdrawConnectionRequest(userItem.connectionId)}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <FaTimes className="mr-2" />
              Withdraw
            </button>
          )}

          {isRequest && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => acceptConnectionRequest(request._id)}
                className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
              >
                <FaCheck className="mr-2" />
                Accept
              </button>
              <button
                onClick={() => rejectConnectionRequest(request._id)}
                className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                <FaTimes className="mr-2" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ProfessionFilter = () => (
    <div className="relative w-full sm:w-auto">
      <div className="relative">
        <select
          value={filterProfession}
          onChange={(e) => setFilterProfession(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
        >
          <option value="">All Professions</option>
          {professions.map((profession) => (
            <option key={profession} value={profession}>
              {profession}
            </option>
          ))}
        </select>
        <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );

  const UserDetailModal = () => {
    if (!selectedUser) return null;

    const getConnectionStatus = () => {
      if (selectedUser.connectionStatus === 'accepted') return 'Connected';
      if (selectedUser.connectionStatus === 'pending') {
        return selectedUser.isSender ? 'Request Sent' : 'Pending Request';
      }
      return 'Not Connected';
    };

    const getStatusColor = () => {
      if (selectedUser.connectionStatus === 'accepted') return 'bg-green-100 text-green-800';
      if (selectedUser.connectionStatus === 'pending') return 'bg-yellow-100 text-yellow-800';
      return 'bg-gray-100 text-gray-800';
    };

    return (
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent bg-opacity-50 backdrop-blur-lg"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50">
                      {selectedUser.photoURL ? (
                        <img
                          src={selectedUser.photoURL}
                          alt={selectedUser.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaUser className="text-blue-400 text-4xl" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedUser.displayName || 'Anonymous User'}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor()}`}>
                            {getConnectionStatus()}
                          </span>
                          <span className="text-gray-600">
                            {selectedUser.userType === 'jobSeeker' ? 'Job Seeker' : 'Recruiter'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-4 md:mt-0 flex space-x-2">
                        {selectedUser.connectionStatus === 'accepted' && (
                          <button
                            onClick={() => removeConnection(selectedUser.connectionId)}
                            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                          >
                            <FaTrash className="mr-2" />
                            Remove Connection
                          </button>
                        )}
                        
                        {selectedUser.connectionStatus === 'pending' && selectedUser.isSender && (
                          <button
                            onClick={() => withdrawConnectionRequest(selectedUser.connectionId)}
                            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
                          >
                            <FaTimes className="mr-2" />
                            Withdraw Request
                          </button>
                        )}
                        
                        {selectedUser.connectionStatus === 'pending' && !selectedUser.isSender && selectedUser.request && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => acceptConnectionRequest(selectedUser.request._id)}
                              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                            >
                              <FaCheck className="mr-2" />
                              Accept
                            </button>
                            <button
                              onClick={() => rejectConnectionRequest(selectedUser.request._id)}
                              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                            >
                              <FaTimes className="mr-2" />
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {/* Show Connect button for users who are not connected, not pending, and not in sent requests */}
                        {(!selectedUser.connectionStatus || 
                          (selectedUser.connectionStatus === null) ||
                          (activeTab === 'sent' && !selectedUser.connectionStatus)) && (
                          <button
                            onClick={() => sendConnectionRequest(selectedUser.uid)}
                            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                          >
                            <FaUserPlus className="mr-2" />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedUser.request?.message && (
                      <div className="bg-blue-50 p-4 rounded-xl mb-4">
                        <p className="text-blue-800 italic">"{selectedUser.request.message}"</p>
                      </div>
                    )}

                    {selectedUser.bio && (
                      <p className="text-gray-700 mt-4">{selectedUser.bio}</p>
                    )}
                  </div>
                </div>

                {/* Grid Layout for Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Education */}
                    {(selectedUser.fieldOfStudy || selectedUser.highestDegree || selectedUser.institution) && (
                      <div className="bg-gray-50 p-5 rounded-xl">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <FaGraduationCap className="mr-2 text-blue-500" />
                          Education
                        </h4>
                        <div className="space-y-3">
                          {selectedUser.fieldOfStudy && (
                            <div>
                              <p className="text-sm text-gray-600">Field of Study</p>
                              <p className="font-medium">{selectedUser.fieldOfStudy}</p>
                            </div>
                          )}
                          {selectedUser.highestDegree && (
                            <div>
                              <p className="text-sm text-gray-600">Highest Degree</p>
                              <p className="font-medium">{selectedUser.highestDegree}</p>
                            </div>
                          )}
                          {selectedUser.institution && (
                            <div>
                              <p className="text-sm text-gray-600">Institution</p>
                              <p className="font-medium">{selectedUser.institution}</p>
                            </div>
                          )}
                          {selectedUser.graduationYear && (
                            <div>
                              <p className="text-sm text-gray-600">Graduation Year</p>
                              <p className="font-medium">{selectedUser.graduationYear}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location & Preferences */}
                    {(selectedUser.location || selectedUser.remotePreference) && (
                      <div className="bg-gray-50 p-5 rounded-xl">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <FaMapMarkerAlt className="mr-2 text-green-500" />
                          Location & Preferences
                        </h4>
                        <div className="space-y-3">
                          {selectedUser.location && (
                            <div className="flex items-center">
                              <FaHome className="text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm text-gray-600">Current Location</p>
                                <p className="font-medium">{selectedUser.location}</p>
                              </div>
                            </div>
                          )}
                          {selectedUser.remotePreference && (
                            <div className="flex items-center">
                              <FaLaptopHouse className="text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm text-gray-600">Remote Preference</p>
                                <p className="font-medium capitalize">{selectedUser.remotePreference}</p>
                              </div>
                            </div>
                          )}
                          {selectedUser.noticePeriod && (
                            <div>
                              <p className="text-sm text-gray-600">Notice Period</p>
                              <p className="font-medium">{selectedUser.noticePeriod}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Professional Info */}
                    {(selectedUser.jobTypes?.length > 0 || selectedUser.yearsOfExperience || selectedUser.salaryExpectation) && (
                      <div className="bg-gray-50 p-5 rounded-xl">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <FaSuitcase className="mr-2 text-purple-500" />
                          Professional Information
                        </h4>
                        <div className="space-y-3">
                          {selectedUser.jobTypes?.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-600">Job Types</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {selectedUser.jobTypes.map((type, index) => (
                                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedUser.yearsOfExperience && (
                            <div>
                              <p className="text-sm text-gray-600">Years of Experience</p>
                              <p className="font-medium">{selectedUser.yearsOfExperience}</p>
                            </div>
                          )}
                          {selectedUser.salaryExpectation && (
                            <div>
                              <p className="text-sm text-gray-600">Salary Expectation</p>
                              <p className="font-medium">${selectedUser.salaryExpectation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact & Social Links */}
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <FaEnvelope className="mr-2 text-red-500" />
                        Contact & Social Links
                      </h4>
                      <div className="space-y-3">
                        {selectedUser.email && (
                          <div className="flex items-center">
                            <FaEnvelope className="text-gray-400 mr-2" />
                            <p className="font-medium">{selectedUser.email}</p>
                          </div>
                        )}
                        {selectedUser.phone && (
                          <div className="flex items-center">
                            <FaPhone className="text-gray-400 mr-2" />
                            <p className="font-medium">{selectedUser.phone}</p>
                          </div>
                        )}
                        {selectedUser.linkedin && (
                          <a href={selectedUser.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800">
                            <FaLinkedin className="mr-2" />
                            LinkedIn Profile
                          </a>
                        )}
                        {selectedUser.github && (
                          <a href={selectedUser.github} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-gray-900">
                            <FaGithub className="mr-2" />
                            GitHub Profile
                          </a>
                        )}
                        {selectedUser.portfolio && (
                          <a href={selectedUser.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center text-purple-600 hover:text-purple-800">
                            <FaLink className="mr-2" />
                            Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {selectedUser.skills?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (loading && activeTab === 'all') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Network</h1>
              <p className="text-gray-600 mt-2">
                Connect with professionals and grow your career network
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name or profession..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {activeTab === 'all' && <ProfessionFilter />}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeTab === 'pending' && (
                pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <ConnectionCard
                      key={request._id}
                      user={request.sender}
                      isRequest={true}
                      request={request}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 flex flex-col items-center">
                    <div className="text-gray-400 text-4xl mb-4">
                      <FaClock />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No pending requests
                    </h3>
                    <p className="text-gray-500">
                      When someone sends you a connection request, it will appear here.
                    </p>
                  </div>
                )
              )}

              {activeTab === 'sent' && (
                sentRequests.length > 0 ? (
                  sentRequests.map((request) => (
                    <ConnectionCard
                      key={request._id}
                      user={request}
                      isRequest={false}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 flex flex-col items-center">
                    <div className="text-gray-400 text-4xl mb-4">
                      <FaEnvelope />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No sent requests
                    </h3>
                    <p className="text-gray-500">
                      Connection requests you send will appear here.
                    </p>
                  </div>
                )
              )}

              {activeTab === 'suggestions' && (
                suggestions.length > 0 ? (
                  suggestions.map((userItem) => (
                    <ConnectionCard
                      key={userItem.uid}
                      user={userItem}
                      isRequest={false}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 flex flex-col items-center">
                    <div className="text-gray-400 text-4xl mb-4">
                      <FaUserPlus />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No suggestions available
                    </h3>
                    <p className="text-gray-500">
                      We'll suggest connections based on your profile.
                    </p>
                  </div>
                )
              )}

              {(activeTab === 'all' || activeTab === 'connections') && (
                filteredConnections.length > 0 ? (
                  filteredConnections.map((userItem) => (
                    <ConnectionCard
                      key={userItem.uid}
                      user={userItem}
                      isRequest={false}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 flex flex-col items-center">
                    <div className="text-gray-400 text-4xl mb-4">
                      {activeTab === 'connections' ? <FaUserCheck /> : <FaUsers />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {activeTab === 'connections' ? 'No connections yet' : 'No users found'}
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === 'connections' 
                        ? 'Start connecting with other professionals!' 
                        : 'Try adjusting your search or filter.'}
                    </p>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal />
    </div>
  );
};

export default Network;