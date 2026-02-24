import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaSmile, FaMapMarkerAlt, FaUserTag } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const PostCreationModal = ({ isOpen, onClose, onPostCreated }) => {
    const { user } = useAuth();
    const [postContent, setPostContent] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        
        // Limit to 30 images
        if (files.length > 30) {
            alert('You can only select up to 30 images');
            return;
        }

        const newImages = files.slice(0, 30 - selectedImages.length);
        
        if (newImages.length === 0) {
            alert('You have reached the maximum limit of 30 images');
            return;
        }

        setSelectedImages(prev => [...prev, ...newImages]);

        // Create previews for new images
        newImages.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    url: e.target.result,
                    file: file
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (imageId) => {
        setImagePreviews(prev => prev.filter(img => img.id !== imageId));
        setSelectedImages(prev => {
            const removedImage = imagePreviews.find(img => img.id === imageId);
            return removedImage ? prev.filter(file => file !== removedImage.file) : prev;
        });
    };

    const handleRemoveAllImages = () => {
        setSelectedImages([]);
        setImagePreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'react_unsigned');
        formData.append('cloud_name', 'dohhfubsa');

        try {
            const response = await fetch(
                'https://api.cloudinary.com/v1_1/dohhfubsa/image/upload',
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Image upload failed');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const uploadMultipleImages = async (files) => {
        const uploadPromises = files.map(file => uploadToCloudinary(file));
        return Promise.all(uploadPromises);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!postContent.trim() && selectedImages.length === 0) {
            alert('Please write something or add images to post.');
            return;
        }

        setIsLoading(true);

        try {
            let imageUrls = [];
            
            // Upload images to Cloudinary if selected
            if (selectedImages.length > 0) {
                imageUrls = await uploadMultipleImages(selectedImages);
            }

            // Create post data
            const postData = {
                content: postContent,
                images: imageUrls, // Changed from image to images array
                userId: user._id,
                userEmail: user.email,
                userName: user.displayName,
                userAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || `${user.firstName}+${user.lastName}`)}&background=random`,
                timestamp: new Date().toISOString(),
                likes: 0,
                comments: [],
                shares: 0,
                isLiked: false,
                isSaved: false
            };

            // Send post to backend
            const response = await fetch('http://localhost:5000/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error('Failed to create post');
            }

            const newPost = await response.json();
            
            // Reset form
            setPostContent('');
            setSelectedImages([]);
            setImagePreviews([]);
            
            // Notify parent component
            onPostCreated(newPost);
            
            // Close modal
            onClose();
            
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setPostContent('');
            setSelectedImages([]);
            setImagePreviews([]);
            onClose();
        }
    };

    // Grid layout for images
    const getImageGridClass = () => {
        const count = imagePreviews.length;
        if (count === 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-2';
        if (count === 3) return 'grid-cols-2';
        if (count === 4) return 'grid-cols-2';
        return 'grid-cols-3';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
                            <button
                                onClick={handleClose}
                                disabled={isLoading}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                            >
                                <FaTimes className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {user.displayName}
                                    </h3>
                                    <p className="text-sm text-gray-500">{user.title || 'Professional'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            {/* Content Textarea */}
                            <div className="flex-1 p-4 overflow-auto">
                                <textarea
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    placeholder="Share your career update, ask a question, or post an achievement..."
                                    className="w-full h-32 resize-none border-none focus:outline-none text-gray-900 placeholder-gray-500 text-lg"
                                    disabled={isLoading}
                                />

                                {/* Images Preview */}
                                {imagePreviews.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm text-gray-600">
                                                {imagePreviews.length} image(s) selected
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveAllImages}
                                                disabled={isLoading}
                                                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                                            >
                                                Remove all
                                            </button>
                                        </div>
                                        
                                        <div className={`grid ${getImageGridClass()} gap-2`}>
                                            {imagePreviews.map((preview, index) => (
                                                <div key={preview.id} className="relative group">
                                                    <img
                                                        src={preview.url}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(preview.id)}
                                                        disabled={isLoading}
                                                        className="absolute top-1 right-1 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <FaTimes className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        {/* Image Upload */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isLoading || selectedImages.length >= 30}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                                            title={selectedImages.length >= 30 ? 'Maximum 30 images allowed' : 'Add images'}
                                        >
                                            <FaImage className="w-5 h-5" />
                                        </button>
                                        
                                        {/* Other buttons (disabled for now) */}
                                        <button
                                            type="button"
                                            disabled
                                            className="p-2 text-gray-400 rounded-full transition-colors"
                                            title="Coming soon"
                                        >
                                            <FaSmile className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled
                                            className="p-2 text-gray-400 rounded-full transition-colors"
                                            title="Coming soon"
                                        >
                                            <FaMapMarkerAlt className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled
                                            className="p-2 text-gray-400 rounded-full transition-colors"
                                            title="Coming soon"
                                        >
                                            <FaUserTag className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Image counter */}
                                    {selectedImages.length > 0 && (
                                        <span className="text-sm text-gray-500">
                                            {selectedImages.length}/30
                                        </span>
                                    )}

                                    {/* Hidden file input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/*"
                                        className="hidden"
                                        disabled={isLoading}
                                        multiple
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={(!postContent.trim() && selectedImages.length === 0) || isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PostCreationModal;