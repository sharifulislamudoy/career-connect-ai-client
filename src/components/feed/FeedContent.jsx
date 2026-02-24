import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHeart,
    FaRegHeart,
    FaComment,
    FaShare,
    FaEllipsisH,
    FaTimes,
    FaImage,
    FaSmile,
    FaPaperPlane,
    FaTrash,
    FaSpinner,
    FaExclamationCircle,
    FaUser,
    FaGlobeAmericas
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const CreatePostModal = React.memo(({ isOpen, onClose, onSuccess }) => {
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef(null);
    const { user, userProfile } = useAuth();

    const cloudName = 'dohhfubsa';
    const uploadPreset = 'react_unsigned';

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setContent('');
            setImageUrl('');
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isOpen]);

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('cloud_name', cloudName);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        return data.secure_url;
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert('Please select an image');
        if (file.size > 5 * 1024 * 1024) return alert('Image must be < 5MB');

        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);

        try {
            setUploading(true);
            const url = await uploadToCloudinary(file);
            setImageUrl(url);
        } catch (err) {
            alert('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) return alert('Please write something');
        if (!user) return alert('Please login');

        setActionLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content.trim(),
                    imageUrl,
                    userId: user.uid,
                    userEmail: user.email,
                    userProfile: {
                        displayName: userProfile?.displayName || user.displayName || 'User',
                        photoURL: userProfile?.photoURL || user.photoURL,
                        profession: userProfile?.profession || 'Professional'
                    }
                }),
            });
            const result = await res.json();
            if (result.success) {
                onSuccess(result.post);
                onClose();
            } else {
                alert(result.message || 'Failed to post');
            }
        } catch (err) {
            alert('Something went wrong');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">Create Post</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <FaTimes className="text-gray-500 text-lg" />
                    </button>
                </div>

                {/* User Info */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img
                                src={userProfile?.photoURL || user?.photoURL || '/default-avatar.png'}
                                alt="Profile"
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20"
                                onError={(e) => e.target.src = '/default-avatar.png'}
                            />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white rounded-full p-1">
                                <FaGlobeAmericas className="text-white text-xs" />
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">
                                {userProfile?.displayName || user?.displayName || 'User'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {userProfile?.profession || 'Professional'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full h-32 resize-none border-none focus:outline-none text-lg placeholder-gray-500 text-gray-900 bg-transparent"
                        maxLength={500}
                    />
                    <div className="text-sm text-gray-500 text-right">{content.length}/500</div>

                    {(imagePreview || imageUrl) && (
                        <div className="mt-4 relative">
                            <img
                                src={imagePreview || imageUrl}
                                alt="Preview"
                                className="w-full rounded-xl max-h-96 object-cover border border-gray-200"
                            />
                            <button
                                onClick={() => {
                                    setImageUrl('');
                                    setImagePreview(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full hover:bg-black/90"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Add to your post</span>
                        <div className="flex items-center space-x-3">
                            <label className="cursor-pointer flex items-center space-x-2 text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50">
                                <FaImage className="text-lg" />
                                <span className="text-sm font-medium">Photo</span>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            <button className="flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 p-2 rounded-lg hover:bg-yellow-50">
                                <FaSmile className="text-lg" />
                                <span className="text-sm font-medium">Feeling</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || uploading || actionLoading}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
                    >
                        {actionLoading || uploading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                <span>{uploading ? 'Uploading...' : 'Posting...'}</span>
                            </>
                        ) : (
                            <span>Post</span>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
});

const FeedContent = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const { user, userProfile } = useAuth();

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5000/api/posts');
            const result = await res.json();
            if (result.success) {
                setPosts(result.posts || []);
            }
        } catch (err) {
            setError('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleLike = async (postId) => {
        if (!user) return setError('Login required');
        setActionLoading(`like-${postId}`);
        try {
            const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, userEmail: user.email }),
            });
            const result = await res.json();
            if (result.success) {
                setPosts(prev => prev.map(p => p._id === postId ? result.post : p));
            }
        } catch (err) { } finally {
            setActionLoading(null);
        }
    };

    const handleAddComment = async (postId) => {
        if (!commentText.trim() || !user) return;
        setActionLoading(`comment-${postId}`);
        try {
            const res = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    userEmail: user.email,
                    content: commentText.trim(),
                    userProfile: {
                        displayName: userProfile?.displayName || user.displayName || 'User',
                        photoURL: userProfile?.photoURL || user.photoURL,
                        profession: userProfile?.profession || 'Professional'
                    }
                }),
            });
            const result = await res.json();
            if (result.success) {
                setPosts(prev => prev.map(p => p._id === postId ? result.post : p));
                setCommentText('');
            }
        } catch (err) { } finally {
            setActionLoading(null);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        setActionLoading(`delete-${postId}`);
        try {
            await fetch(`http://localhost:5000/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid }),
            });
            setPosts(prev => prev.filter(p => p._id !== postId));
        } catch (err) { } finally {
            setActionLoading(null);
        }
    };

    const isLiked = (post) => post.likes?.some(l => l.userId === user?.uid);
    const getLikesCount = (post) => post.likes?.length || 0;
    const getCommentsCount = (post) => post.comments?.length || 0;

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = (now - date) / (1000 * 60 * 60);
            if (diff < 1) return `${Math.floor(diff * 60)}m ago`;
            if (diff < 24) return `${Math.floor(diff)}h ago`;
            if (diff < 168) return `${Math.floor(diff / 24)}d ago`;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return 'Recently'; }
    };

    const Post = ({ post }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200/80 mb-6 overflow-hidden hover:shadow-md transition-all duration-300"
        >
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img
                                src={post.userProfile?.photoURL || '/default-avatar.png'}
                                alt="Profile"
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20"
                                onError={(e) => e.target.src = '/default-avatar.png'}
                            />
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 border-2 border-white rounded-full p-1">
                                <FaUser className="text-white text-xs" />
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{post.userProfile?.displayName || 'User'}</p>
                            <p className="text-sm text-gray-500">
                                {post.userProfile?.profession || 'Professional'} • {formatDate(post.createdAt)}
                            </p>
                        </div>
                    </div>
                    {user && post.userId === user.uid && (
                        <button onClick={() => handleDeletePost(post._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                            <FaTrash />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-6 pb-4">
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">{post.content}</p>
            </div>

            {post.imageUrl && (
                <div className="px-6 pb-4">
                    <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full rounded-xl max-h-96 object-cover border border-gray-200 cursor-pointer"
                        onClick={() => window.open(post.imageUrl, '_blank')}
                    />
                </div>
            )}

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                            <FaHeart className="text-red-500" />
                            <span>{getLikesCount(post)}</span>
                        </span>
                        <span className="cursor-pointer hover:text-blue-600" onClick={() => setSelectedPost(post)}>
                            <FaComment className="inline mr-1 text-blue-500" />
                            {getCommentsCount(post)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-6 py-2 border-t border-gray-200">
                <div className="flex justify-around">
                    <button
                        onClick={() => handleLike(post._id)}
                        disabled={actionLoading === `like-${post._id}`}
                        className={`flex-1 mx-1 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${isLiked(post) ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        {actionLoading === `like-${post._id}` ? <FaSpinner className="animate-spin" /> : isLiked(post) ? <FaHeart /> : <FaRegHeart />}
                        <span>Like</span>
                    </button>
                    <button onClick={() => setSelectedPost(post)} className="flex-1 mx-1 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100">
                        <FaComment /><span>Comment</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="max-w-2xl mx-auto  ">

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FaExclamationCircle className="text-red-500" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError(null)}><FaTimes className="text-red-500" /></button>
                    </div>
                )}

                {/* Create Post Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 mb-6">
                    <div className="flex items-center space-x-4">
                        <img
                            src={userProfile?.photoURL || user?.photoURL || '/default-avatar.png'}
                            alt="Profile"
                            className="w-14 h-14 rounded-full object-cover border-2 border-blue-500/20"
                            onError={(e) => e.target.src = '/default-avatar.png'}
                        />
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex-1 text-sm text-left px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-500 font-medium"
                        >
                            What's on your mind?
                        </button>
                    </div>
                </div>

                {/* Posts */}
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 animate-pulse">
                                <div className="flex space-x-3">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl">
                        <div className="text-5xl text-gray-300 mb-4">No posts yet</div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold"
                        >
                            Create First Post
                        </button>
                    </div>
                ) : (
                    posts.map(post => <Post key={post._id} post={post} />)
                )}

                {/* Modals */}
                <CreatePostModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={(newPost) => {
                        setPosts(prev => [newPost, ...prev]);
                    }}
                />

                <AnimatePresence>
                    {selectedPost && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedPost(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-6 border-b">
                                    <h3 className="text-xl font-bold">Comments</h3>
                                    <button onClick={() => setSelectedPost(null)}><FaTimes /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {getCommentsCount(selectedPost) === 0 ? (
                                        <p className="text-center text-gray-500 py-10">No comments yet</p>
                                    ) : (
                                        selectedPost.comments.map(c => (
                                            <div key={c._id} className="flex space-x-3">
                                                <img src={c.userProfile?.photoURL || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full" />
                                                <div className="bg-gray-100 rounded-2xl px-4 py-3 flex-1">
                                                    <p className="font-semibold text-sm">{c.userProfile?.displayName}</p>
                                                    <p className="text-sm text-gray-700">{c.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-6 border-t bg-gray-50">
                                    <div className="flex space-x-3">
                                        <img src={userProfile?.photoURL || user?.photoURL || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full" />
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleAddComment(selectedPost._id)}
                                            placeholder="Write a comment..."
                                            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            onClick={() => handleAddComment(selectedPost._id)}
                                            disabled={!commentText.trim()}
                                            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            <FaPaperPlane />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FeedContent;