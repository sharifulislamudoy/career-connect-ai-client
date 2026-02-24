import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaComment, FaShare, FaEllipsisH, FaBookmark } from 'react-icons/fa';

const PostCard = ({ post, onLike, onComment, onShare, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
            {/* Post Header */}
            <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <img
                            src={post.user.userAvatar}
                            alt={post.user.name}
                            className="w-12 h-12 rounded-full"
                        />
                        <div>
                            <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                            <p className="text-sm text-gray-500">{post.user.title}</p>
                            <p className="text-xs text-gray-400">{post.timestamp}</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <FaEllipsisH />
                    </button>
                </div>
            </div>

            {/* Post Content */}
            <div className="px-6 pb-4">
                <p className="text-gray-700 leading-relaxed">{post.content}</p>
            </div>

            {/* Post Stats */}
            <div className="px-6 py-3 border-t border-b border-gray-100">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{post.likes} likes</span>
                    <span>{post.comments} comments</span>
                    <span>{post.shares} shares</span>
                </div>
            </div>

            {/* Post Actions */}
            <div className="p-3">
                <div className="flex justify-around">
                    <button
                        onClick={() => onLike(post.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${post.isLiked
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <FaHeart className={post.isLiked ? 'fill-current' : ''} />
                        <span className="font-medium">Like</span>
                    </button>

                    <button
                        onClick={() => onComment(post.id)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <FaComment />
                        <span className="font-medium">Comment</span>
                    </button>

                    <button
                        onClick={() => onShare(post.id)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <FaShare />
                        <span className="font-medium">Share</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default PostCard;