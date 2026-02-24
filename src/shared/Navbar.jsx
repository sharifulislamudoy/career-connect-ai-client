import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaUsers,
  FaComments,
  FaBell,
  FaUserPlus,
  FaTimes,
  FaBars,
  FaSearch,
  FaUser,
  FaCog,
  FaFileAlt,
  FaFilePdf,
  FaVideo,
  FaChartBar,
  FaSignOutAlt,
  FaCrown,
  FaStar,
  FaRocket,
  FaGem,
  FaPlus,
  FaBriefcase,
  FaBusinessTime,
  FaStreetView,
  FaClipboardList,
  FaBriefcaseMedical
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/notification/NotificationBell';

const Navbar = () => {
  const { user, userProfile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userPackage, setUserPackage] = useState('basic');
  const [userType, setUserType] = useState('jobseeker'); // Default to jobseeker
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  // Fetch user package data and user type
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const response = await fetch(`http://localhost:5000/api/users/${user.uid}`);
          const data = await response.json();
          if (data.success) {
            if (data.user.package) {
              setUserPackage(data.user.package);
            }
            if (data.user.userType) {
              setUserType(data.user.userType);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Navigation items for authenticated users
  const authNavItems = [
    { path: '/', name: 'Home', icon: FaHome },
    { path: '/network', name: 'Network', icon: FaUsers },
    { path: '/messages', name: 'Messages', icon: FaComments },
    { path: '/jobs', name: 'Jobs', icon: FaBriefcase }
  ];

  // Navigation items for unauthenticated users
  const unauthNavItems = [
    { path: '/', name: 'Home', icon: FaHome },
    { path: '/about', name: 'About', icon: FaUsers },
    { path: '/features', name: 'Features', icon: FaGem },
  ];

  // Job Seeker specific drawer items
  const jobSeekerDrawerItems = [
    { path: '/my-applications', name: 'My Applications', icon: FaClipboardList },
    { path: '/learning-path', name: 'Learning Path', icon: FaStreetView },
    { path: '/create-resume', name: 'Create Resume', icon: FaFileAlt },
    { path: '/mock-interview', name: 'Mock Interview', icon: FaVideo },
    { path: '/ats-score', name: 'ATS Score Check', icon: FaChartBar },
    { path: '/settings', name: 'Settings', icon: FaCog },
  ];

  // Recruiter-specific drawer items
  const recruiterDrawerItems = [
    { path: '/my-jobs', name: 'My Jobs', icon: FaBriefcaseMedical },
    { path: '/post-job', name: 'Post a Job', icon: FaBusinessTime },
    { path: '/settings', name: 'Settings', icon: FaCog },
  ];

  // Combine drawer items based on user type
  const getDrawerItems = () => {
    if (userType === 'recruiter') {
      return [
        ...recruiterDrawerItems,
        { path: '/pricing', name: 'Upgrade Plan', icon: FaCrown } // Added pricing at the end for both types
      ];
    }
    return [
      ...jobSeekerDrawerItems,
      { path: '/pricing', name: 'Upgrade Plan', icon: FaCrown }
    ];
  };

  const drawerItems = getDrawerItems();

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
  };

  const drawerVariants = {
    closed: {
      x: '100%',
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    open: {
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
  };

  const itemVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
  };

  const floatingNavVariants = {
    hidden: {
      y: -20,
      opacity: 0,
      scale: 0.95
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDrawerOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDisplayName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getProfilePhoto = () => {
    if (userProfile?.photoURL) return userProfile.photoURL;
    if (user?.photoURL) return user.photoURL;
    return '/default-avatar.png';
  };

  const getEmail = () => {
    if (userProfile?.email) return userProfile.email;
    if (user?.email) return user.email;
    return '';
  };

  // Get package details
  const getPackageDetails = () => {
    switch (userPackage) {
      case 'basic':
        return {
          name: 'Basic',
          icon: FaStar,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-500',
          description: 'Free Plan'
        };
      case 'standard':
        return {
          name: 'Standard',
          icon: FaRocket,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          badgeColor: 'bg-blue-500',
          description: 'Pro Plan'
        };
      case 'premium':
        return {
          name: 'Premium',
          icon: FaCrown,
          color: 'text-purple-500',
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-200',
          badgeColor: 'bg-purple-500',
          description: 'Elite Plan'
        };
      default:
        return {
          name: 'Basic',
          icon: FaStar,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-500',
          description: 'Free Plan'
        };
    }
  };

  const packageDetails = getPackageDetails();
  const PackageIcon = packageDetails.icon;

  // If user is authenticated, show authenticated navbar
  if (user) {
    return (
      <>
        {/* Authenticated User Navbar */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="bg-white/90 backdrop-blur-2xl shadow-sm border-b border-gray-100/80 sticky top-0 z-50"
        >
          <div className="w-11/12 mx-auto lg:px-4">
            <div className="flex justify-between items-center h-16">

              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center"
              >
                <NavLink to="/" className="flex items-center space-x-3">
                  <div>
                    <img src="/logo.jpg" alt="LOGO" className='h-10 w-10' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-md md:text-xl font-bold text-blue-500'>Creative</span>
                    <span className='text-xs md:text-sm font-bold text-blue-400'>Career AI</span>
                  </div>
                </NavLink>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {authNavItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative group ${isActive
                          ? 'text-blue-600 border border-blue-200/50'
                          : 'text-gray-600 hover:text-blue-600 backdrop-blur-2xl hover:shadow-lg '
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`text-base transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                              }`}
                          />
                          <span>{item.name}</span>
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 border-2 border-blue-500/30 rounded-2xl"
                              layoutId="activeNav"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              {/* User Profile - Desktop */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden md:flex items-center space-x-3"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-3"
                >
                  {/* User Avatar */}
                  <button
                    onClick={toggleDrawer}
                    className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-50/80 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={getProfilePhoto()}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-blue-200/50 object-cover group-hover:border-blue-300 transition-colors duration-200"
                      />
                      {/* Package Indicator Dot */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${packageDetails.badgeColor} border-2 border-white rounded-full`}></div>
                    </div>
                  </button>
                </motion.div>
                <NotificationBell />
              </motion.div>
              <div className='flex'>
                {/* Notification Bell - Mobile Top */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="md:hidden flex items-center"
                >
                  <NotificationBell />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="md:hidden flex items-center"
                >
                  <NavLink
                    to="/jobs"
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${isActive
                        ? 'text-blue-600 bg-blue-50/80'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-white/80'
                      }`
                    }
                  >
                    <FaBriefcase className="text-lg" />
                  </NavLink>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Floating Bottom Nav (Mobile) */}
        <motion.div
          variants={floatingNavVariants}
          initial="hidden"
          animate="visible"
          className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-2xl border border-gray-200/80 shadow-xl shadow-black/10 z-50"
        >
          <div className="flex justify-between items-center h-16 px-2">
            {/* Home */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-1 relative"
            >
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-300 relative ${isActive
                    ? 'text-blue-600 bg-blue-50/80'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <FaHome
                      className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : ''
                        }`}
                    />
                    <span className="text-[10px] font-semibold mt-1">Home</span>
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full"
                        layoutId="floatingActive"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>

            {/* Network */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-1 relative"
            >
              <NavLink
                to="/network"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-300 relative ${isActive
                    ? 'text-blue-600 bg-blue-50/80'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <FaUsers
                      className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : ''
                        }`}
                    />
                    <span className="text-[10px] font-semibold mt-1">Network</span>
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full"
                        layoutId="floatingActive"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>

            {/* Create Post Button - Middle */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-1 relative"
            >
              <button
                onClick={() => navigate('/create-post')}
                className="flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-300 text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
              >
                <FaPlus className="text-lg" />
                <span className="text-[10px] font-semibold mt-1">Create</span>
              </button>
            </motion.div>

            {/* Messages */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-1 relative"
            >
              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-300 relative ${isActive
                    ? 'text-blue-600 bg-blue-50/80'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <FaComments
                      className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : ''
                        }`}
                    />
                    <span className="text-[10px] font-semibold mt-1">Messages</span>
                    {isActive && (
                      <motion.div
                        className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full"
                        layoutId="floatingActive"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>

            {/* Profile */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-1 relative"
            >
              <button
                onClick={toggleDrawer}
                className="flex flex-col items-center justify-center w-full h-14 rounded-xl transition-all duration-300 text-gray-600 hover:text-blue-600 hover:bg-white/80 relative"
              >
                <div className="relative">
                  <img
                    src={getProfilePhoto()}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  {/* Package Indicator Dot */}
                  <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${packageDetails.badgeColor} border border-white rounded-full`}></div>
                </div>
                <span className="text-[10px] font-semibold mt-1">Profile</span>
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Profile Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleDrawer}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />

              {/* Drawer */}
              <motion.div
                variants={drawerVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-gray-200/50 z-50 overflow-y-auto"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900">Profile</h2>
                    <button
                      onClick={toggleDrawer}
                      className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      <FaTimes className="text-gray-600" />
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <img
                        src={getProfilePhoto()}
                        alt="Profile"
                        className="w-16 h-16 rounded-full border-2 border-blue-200/50 object-cover"
                      />
                      {/* Package Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${packageDetails.badgeColor} border-2 border-white rounded-full flex items-center justify-center`}>
                        <PackageIcon className="text-white text-xs" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-md font-semibold text-gray-900">{getDisplayName()}</h3>
                      <p className="text-xs text-gray-500">{getEmail()}</p>
                      {/* User Type Badge */}
                      <div className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${userType === 'recruiter' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'}
                      </div>
                    </div>
                  </div>

                  {/* Current Package Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`mb-6 p-4 rounded-2xl border ${packageDetails.borderColor} ${packageDetails.bgColor} cursor-pointer`}
                    onClick={() => {
                      navigate('/pricing');
                      setIsDrawerOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl bg-white/80`}>
                          <PackageIcon className={`text-lg ${packageDetails.color}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-600">Current Plan</span>
                          <span className={`text-base font-bold ${packageDetails.color}`}>
                            {packageDetails.name}
                          </span>
                        </div>
                      </div>
                      {userPackage !== 'premium' && (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-xl hover:bg-blue-600 transition-colors duration-200"
                        >
                          Upgrade
                        </motion.div>
                      )}
                    </div>
                    {userPackage === 'basic' && (
                      <p className="text-xs text-gray-600 mt-2">
                        Upgrade to unlock all features
                      </p>
                    )}
                  </motion.div>

                  {/* Navigation Items */}
                  <nav className="space-y-2 mb-8">
                    {drawerItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={toggleDrawer}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${isActive
                            ? 'bg-blue-50 text-blue-600 border border-blue-200/50'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                      >
                        <item.icon className="text-base" />
                        <span>{item.name}</span>
                        {/* Special badge for recruiter items */}
                        {(item.name === 'Post a Job' || item.name === 'My Jobs') && userType === 'recruiter' && (
                          <span className="ml-auto px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Recruiter
                          </span>
                        )}
                        {/* Special badge for job seeker items */}
                        {item.name === 'My Applications' && userType === 'jobseeker' && (
                          <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Job Seeker
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </nav>

                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-200/50 hover:bg-red-100 transition-all duration-200 font-medium"
                  >
                    <FaSignOutAlt className="text-base" />
                    <span>Logout</span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // If user is NOT authenticated, show unauthenticated navbar
  return (
    <>
      {/* Unauthenticated User Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="bg-white/90 backdrop-blur-2xl shadow-sm border-b border-gray-100/80 sticky top-0 z-50"
      >
        <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo and Hamburger Menu */}
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu - Left side for unauthenticated users */}
              <motion.div
                whileHover="hover"
                whileTap="tap"
                className="md:hidden flex items-center"
              >
                <button
                  onClick={toggleMenu}
                  className="text-gray-600 hover:text-blue-600 focus:outline-none p-2.5 rounded-2xl hover:bg-white/80 transition-all duration-200 border border-transparent hover:border-gray-200/50"
                >
                  {isMenuOpen ? (
                    <FaTimes className="text-xl" />
                  ) : (
                    <FaBars className="text-xl" />
                  )}
                </button>
              </motion.div>

              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center"
              >
                <NavLink to="/" className="flex items-center space-x-3">
                  <div>
                    <img src="/logo.jpg" alt="LOGO" className='h-10 w-10' />
                  </div>
                  <div className='flex flex-col hidden lg:flex'>
                    <span className=' text-2xl font-bold text-blue-500'>Career</span>
                    <span className='text-sm font-bold text-blue-400'>Connect AI</span>
                  </div>
                </NavLink>
              </motion.div>
            </div>

            {/* Desktop Navigation for Unauthenticated Users */}
            <div className="hidden md:flex items-center space-x-1">
              {unauthNavItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative group ${isActive
                        ? 'text-blue-600 border border-blue-200/50'
                        : 'text-gray-600 hover:text-blue-600 backdrop-blur-2xl hover:shadow-lg '
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`text-base transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                            }`}
                        />
                        <span>{item.name}</span>
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 border-2 border-blue-500/30 rounded-2xl"
                            layoutId="activeNav"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </div>

            {/* Get Started Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-3"
            >
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth/sign-up')}
                className="bg-blue-400 text-white px-7 py-2.5 cursor-pointer rounded-2xl text-sm font-semibold hover:shadow-xl transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-blue-500/25"
              >
                <FaUserPlus className="text-sm" />
                <span>Get Started</span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu for Unauthenticated Users */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-200/50 overflow-hidden"
            >
              <div className="px-4 pt-3 pb-6 space-y-2">
                {/* Mobile Navigation Items */}
                {unauthNavItems.map((item) => (
                  <motion.div
                    key={item.path}
                    variants={itemVariants}
                  >
                    <NavLink
                      to={item.path}
                      onClick={toggleMenu}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${isActive
                          ? 'bg-blue-50 text-blue-600 border border-blue-200/50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <item.icon className="text-base" />
                      <span>{item.name}</span>
                    </NavLink>
                  </motion.div>
                ))}

                {/* Get Started Button in Mobile Menu */}
                <motion.div
                  variants={itemVariants}
                  className="pt-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      navigate('/auth/login');
                      toggleMenu();
                    }}
                    className="w-full bg-blue-400 text-white px-4 py-3.5 rounded-2xl text-sm font-semibold hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25"
                  >
                    <FaUserPlus className="text-sm" />
                    <span>Get Started</span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar;