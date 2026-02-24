import React from 'react';
import HeroSection from '../components/HeroSection';
import FeedSection from '../components/feed/FeedSection';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const { user } = useAuth()
    return (
        <div>
            {user ? <FeedSection /> : <HeroSection/>}
        </div>
    );
};

export default Home;