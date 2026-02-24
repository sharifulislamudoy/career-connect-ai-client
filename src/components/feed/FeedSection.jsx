import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AICoachWidget from './AICoachWidget';
import FeedContent from './FeedContent';
import AdsPromotions from './AdsPromotions';
import MobileAIToggle from './MobileAIToggle';

const FeedSection = () => {
    const [isAICoachOpen, setIsAICoachOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-1">
            {/* Mobile AI Toggle Button */}
            {isMobile && (
                <MobileAIToggle 
                    isOpen={isAICoachOpen}
                    onToggle={() => setIsAICoachOpen(!isAICoachOpen)}
                />
            )}

            <div className="w-11/12 mx-auto lg:px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* AI Coach Widget - 4 columns on desktop, hidden on mobile by default */}
                    <AnimatePresence>
                        {(!isMobile || isAICoachOpen) && (
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="lg:col-span-4"
                            >
                                <AICoachWidget onClose={() => setIsAICoachOpen(false)} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feed Content - 5 columns */}
                    <div className={`${isMobile && !isAICoachOpen ? 'col-span-full' : 'lg:col-span-5'} transition-all duration-300`}>
                        <FeedContent />
                    </div>

                    {/* Ads & Promotions - 3 columns */}
                    <div className={`${isMobile && !isAICoachOpen ? 'col-span-full' : 'lg:col-span-3'} transition-all duration-300`}>
                        <AdsPromotions />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedSection;