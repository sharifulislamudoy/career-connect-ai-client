import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaArrowRight } from 'react-icons/fa';

const MobileAIToggle = ({ isOpen, onToggle }) => {
    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onToggle}
            className={`fixed left-4 top-20 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-lg border transition-all duration-300 ${
                isOpen
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
        >
            <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <FaArrowRight className="text-sm" />
            </motion.div>
            <FaRobot className="text-lg" />
            <span className="font-medium text-sm">AI Coach</span>
        </motion.button>
    );
};

export default MobileAIToggle;