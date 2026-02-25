import React from 'react';
import { Link, NavLink } from 'react-router';
import { FaLinkedin, FaTwitter, FaInstagram, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion'

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { user } = useAuth()

    // Essential routes for all users
    const essentialRoutes = [
        { name: 'Home', path: '/' },
        { name: 'Jobs', path: '/jobs' },
        { name: 'Companies', path: '/companies' },
        { name: 'About Us', path: '/about' },
        { name: 'Contact', path: '/contact' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
    ];

    // User-specific routes (shown only when user is authenticated)
    const userRoutes = [
        { name: 'Pricing', path: '/pricing' },
        { name: 'Create Resume', path: '/create-resume' },
        { name: 'Mock Interview', path: '/mock-interview' },
        { name: 'ATS Score', path: '/ats-score' },
        { name: 'Settings', path: '/settings' },
    ];

    const socialLinks = [
        { icon: FaLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
        { icon: FaTwitter, href: 'https://twitter.com', label: 'Twitter' },
        { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
    ];

    return (
        <footer className="bg-gray-900 text-white">
            <div className="w-11/12 mx-auto px-4 lg:px-8 py-12">
                <div className='flex flex-col lg:flex-row gap-8'>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 flex-1">

                        {/* Company Info */}
                        <div className="lg:col-span-1">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center"
                            >
                                <NavLink to="/" className="flex items-center space-x-3">
                                    <div className=''>
                                        <img src="/Logo.png" alt="LOGO" className='h-10 w-10 rounded-full' />
                                    </div>
                                    <div className='flex flex-col hidden lg:flex'>
                                        <span className=' text-2xl font-bold text-blue-500'>Career</span>
                                        <span className='text-sm font-bold text-blue-400'>Connect AI</span>
                                    </div>
                                </NavLink>
                            </motion.div>
                            <p className="text-gray-400 mb-4 leading-relaxed">
                                Your AI-powered career companion. Find dream jobs, optimize your resume,
                                and ace interviews with intelligent assistance.
                            </p>
                            <div className="flex space-x-4">
                                {socialLinks.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.href}
                                        className="text-gray-400 hover:text-white transition-colors duration-200"
                                        aria-label={social.label}
                                    >
                                        <social.icon className="text-xl" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Essential Links */}
                        <div>
                            <h3 className="font-semibold text-lg mb-4 text-white">Quick Links</h3>
                            <ul className="space-y-2">
                                {essentialRoutes.slice(0, 4).map((route, index) => (
                                    <li key={index}>
                                        <Link
                                            to={route.path}
                                            className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                                        >
                                            {route.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* More Links */}
                        <div>
                            <h3 className="font-semibold text-lg mb-4 text-white">Support</h3>
                            <ul className="space-y-2">
                                {essentialRoutes.slice(4).map((route, index) => (
                                    <li key={index}>
                                        <Link
                                            to={route.path}
                                            className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                                        >
                                            {route.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* User-specific routes or Contact Info */}
                        <div>
                            <h3 className="font-semibold text-lg mb-4 text-white">
                                {user ? 'My Account' : 'Contact Info'}
                            </h3>

                            {user ? (
                                <ul className="space-y-2">
                                    {userRoutes.map((route, index) => (
                                        <li key={index}>
                                            <Link
                                                to={route.path}
                                                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                                            >
                                                {route.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 text-gray-400 text-sm">
                                        <FaMapMarkerAlt className="text-blue-500" />
                                        <span>123 Career Street, Tech City</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-400 text-sm">
                                        <FaEnvelope className="text-blue-500" />
                                        <span>support@careerconnect.com</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-400 text-sm">
                                        <FaPhone className="text-blue-500" />
                                        <span>+1 (555) 123-4567</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Info - Always visible when user is logged in */}
                    {user && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg mb-4 text-white">
                                Contact Info
                            </h3>
                            <div className="flex items-center space-x-3 text-gray-400 text-sm">
                                <FaMapMarkerAlt className="text-blue-500" />
                                <span>123 Career Street, Tech City</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-400 text-sm">
                                <FaEnvelope className="text-blue-500" />
                                <span>support@careerconnect.com</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-400 text-sm">
                                <FaPhone className="text-blue-500" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm text-center md:text-left">
                        © {currentYear} CareerConnect. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                            Privacy
                        </Link>
                        <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                            Terms
                        </Link>
                        <Link to="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;