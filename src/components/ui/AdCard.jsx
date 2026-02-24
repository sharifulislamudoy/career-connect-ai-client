import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaArrowRight } from 'react-icons/fa';

const AdCard = ({ promotion, index }) => {
    const getTypeColor = (type) => {
        switch (type) {
            case 'sponsored':
                return 'bg-blue-100 text-blue-600';
            case 'featured':
                return 'bg-green-100 text-green-600';
            case 'premium':
                return 'bg-purple-100 text-purple-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow"
        >
            <div className="relative">
                <img
                    src={promotion.image}
                    alt={promotion.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(promotion.type)}`}>
                        {promotion.type.charAt(0).toUpperCase() + promotion.type.slice(1)}
                    </span>
                </div>
            </div>
            
            <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {promotion.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {promotion.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                        {promotion.type === 'sponsored' ? (
                            <>
                                <FaStar className="text-yellow-400" />
                                <span>{promotion.stats}</span>
                            </>
                        ) : (
                            <span className="text-xs font-medium text-gray-500">{promotion.stats}</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdCard;