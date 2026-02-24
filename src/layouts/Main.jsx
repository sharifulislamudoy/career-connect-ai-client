// src/layouts/Main.jsx
import React, { useEffect } from 'react';
import Navbar from '../shared/Navbar';
import { Outlet, useNavigate, useLocation } from 'react-router';
import Footer from '../shared/Footer';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Main = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user is trying to access other routes without completing profile
    useEffect(() => {
        // Skip check for home page or settings page
        if (location.pathname === '/' || location.pathname === '/settings') {
            return;
        }

        // Check if user profile exists and is not complete
        if (userProfile && !userProfile.profileCompleted) {
            toast.error('Please complete your profile before accessing other features');
            navigate('/settings');
        }
    }, [location.pathname, userProfile, navigate]);

    return (
        <div>
            <Navbar />
            <Outlet />
            <Footer />
        </div>
    );
};

export default Main;