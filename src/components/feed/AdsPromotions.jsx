import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaArrowRight, FaUsers, FaChartLine } from 'react-icons/fa';
import AdCard from '../ui/AdCard';

const AdsPromotions = () => {
    const promotions = [
        {
            id: 1,
            type: "sponsored",
            title: "Advanced JavaScript Course",
            description: "Master modern JavaScript with real-world projects. 40% off for limited time!",
            image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=200&fit=crop",
            cta: "Enroll Now",
            stats: "4.8 ★ (2.3k reviews)"
        },
        {
            id: 2,
            type: "featured",
            title: "Tech Job Fair 2024",
            description: "Connect with top tech companies. 500+ hiring managers waiting to meet you!",
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop",
            cta: "Register Free",
            stats: "Starts in 3 days"
        },
    ];


    return (
        <div className="space-y-6 sticky top-23 hidden md:flex md:flex-col">

            {/* Promotions */}
            {promotions.map((promo, index) => (
                <AdCard key={promo.id} promotion={promo} index={index} />
            ))}
        </div>
    );
};

export default AdsPromotions;