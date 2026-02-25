import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaChartLine,
    FaRobot,
    FaPaperPlane,
    FaUserTie,
    FaBriefcase,
    FaStar,
    FaBrain,
    FaRocket,
    FaShieldAlt,
    FaHandshake,
    FaRegClipboard,
    FaVideo,
    FaUserCheck,
    FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

// ==================== Hero Section (copied from original) ====================
const HeroSection = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm Creative Career AI Assistant. I can help you find your dream job, optimize your resume, and prepare for interviews. How can I assist you today?",
            isBot: true,
            timestamp: new Date(),
            isTyping: false
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
        }
    }, [messages, isLoading]);

    const typeText = (text, messageId, onComplete) => {
        let index = 0;
        const typingSpeed = 20;

        const updateText = () => {
            if (index <= text.length) {
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, text: text.slice(0, index), isTyping: true }
                        : msg
                ));
                index++;
                setTimeout(updateText, typingSpeed);
            } else {
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, isTyping: false }
                        : msg
                ));
                onComplete();
            }
        };

        updateText();
    };

    const getSystemPrompt = () => {
        const userType = user?.userType || 'guest';
        const profession = user?.profession || 'your field';

        return `You are Creative Career AI, an intelligent career assistant for the Creative Career AI platform.

Platform Features & Routes:
- Home: "/"
- Job Search: "/jobs" – browse and filter jobs
- Job Details: "/job/:id" – view a specific job
- Post a Job (recruiters only): "/post-job"
- My Jobs (recruiters): "/my-jobs"
- My Applications (job seekers): "/my-applications"
- Resume Builder: "/create-resume" – create ATS-friendly resumes
- ATS Score Check: "/ats-score" – check resume against job descriptions
- Mock Interviews: "/mock-interview" – practice with AI feedback
- Learning Paths: "/learning-path" – personalized skill development
- Network: "/network" – connect with professionals
- Messages: "/messages" – communicate with recruiters/peers
- Settings: "/settings" – manage profile and account
- Pricing: "/pricing" – upgrade to premium plans

Authentication Routes:
- Login: "/auth/login"
- Sign Up: "/auth/sign-up"
- Social login options: Google, GitHub, Facebook, Apple, Phone

User Context:
- Current user type: ${userType}
- User's profession: ${profession}

Instructions:
1. Be helpful, professional, and encouraging.
2. Keep responses concise but informative.
3. When referring to any platform feature, use the exact link format: <Link to="/path">Link Text</Link>
   Example: You can create a resume using <Link to="/create-resume">Resume Builder</Link>.
4. For authentication requests (sign up, login), always provide the direct link:
   - Sign up: <Link to="/auth/sign-up">Create an account</Link>
   - Login: <Link to="/auth/login">Log in here</Link>
5. If the user asks about jobs related to their profession, suggest filtered links:
   - e.g., <Link to="/jobs?search=${encodeURIComponent(profession)}">${profession} jobs</Link>
6. Tailor responses based on user type (job seeker vs recruiter) when possible.
7. Do not mention the underlying API or technical details.`;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            isBot: false,
            timestamp: new Date(),
            isTyping: false
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await queryGroqAI(inputMessage);
            const botMessageId = Date.now() + 1;

            const botMessage = {
                id: botMessageId,
                text: "",
                isBot: true,
                timestamp: new Date(),
                isTyping: true
            };

            setMessages(prev => [...prev, botMessage]);

            typeText(response, botMessageId, () => {
                setIsLoading(false);
            });
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                text: "I apologize, but I'm having trouble connecting right now. Please try again later.",
                isBot: true,
                timestamp: new Date(),
                isTyping: false
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
        }
    };

    const queryGroqAI = async (userInput) => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: getSystemPrompt() },
                    { role: "user", content: userInput }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 1024,
                stream: false
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    };

    const renderMessageText = (text) => {
        if (typeof text !== 'string') return text;

        const linkRegex = /<Link to="([^"]+)">([^<]+)<\/Link>/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            const [fullMatch, to, linkText] = match;
            parts.push(
                <Link
                    key={match.index}
                    to={to}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    {linkText}
                </Link>
            );

            lastIndex = match.index + fullMatch.length;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    const quickActions = [
        {
            icon: FaUserTie,
            title: "Find Jobs",
            description: "AI-powered job matching",
            color: "blue",
            link: "/jobs"
        },
        {
            icon: FaBriefcase,
            title: "Optimize Resume",
            description: "Get your resume AI-scored",
            color: "green",
            link: "/create-resume"
        },
        {
            icon: FaChartLine,
            title: "Career Growth",
            description: "Personalized career path",
            color: "purple",
            link: "/learning-path"
        }
    ];

    return (
        <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-10 pb-16">
            <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mt-15"
                    >
                        <div className="space-y-6">
                            <motion.h1
                                className="font-bold text-gray-900"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <span className='text-7xl'>Find Your </span><br />
                                <span className="text-blue-600 mx-1 text-4xl">Dream Job</span>
                                <span className='text-4xl'> With AI</span>
                            </motion.h1>

                            <motion.p
                                className="text-lg text-gray-600 leading-relaxed"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                CareerConnect AI matches you with perfect opportunities using advanced artificial intelligence.
                                Get personalized job recommendations, resume optimization, and interview preparation.
                            </motion.p>
                        </div>

                        {/* Quick Actions */}
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            {quickActions.map((action, index) => (
                                <Link to={action.link} key={index}>
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                                    >
                                        <action.icon className={`text-2xl text-${action.color}-500 mb-3`} />
                                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                                    </motion.div>
                                </Link>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right Side - AI Chatbot */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden">
                            {/* Chat Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white/20 p-2 rounded-2xl">
                                        <FaRobot className="text-white text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">CareerConnect AI</h3>
                                        <p className="text-blue-100 text-sm">Online - Ready to help</p>
                                    </div>
                                    <div className="ml-auto flex space-x-1">
                                        {[1, 2, 3].map((dot) => (
                                            <div key={dot} className="w-2 h-2 bg-white/40 rounded-full"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div
                                ref={chatContainerRef}
                                className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-4 rounded-2xl ${
                                                message.isBot
                                                    ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                                    : 'bg-blue-500 text-white rounded-br-none'
                                            }`}
                                        >
                                            <div className="text-sm leading-relaxed">
                                                {renderMessageText(message.text)}
                                                {message.isTyping && (
                                                    <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse"></span>
                                                )}
                                            </div>
                                            <p className={`text-xs mt-2 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4">
                                            <div className="flex space-x-2">
                                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex space-x-3">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        placeholder="Ask about jobs, resume tips, interviews..."
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        disabled={isLoading}
                                    />
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        disabled={isLoading || !inputMessage.trim()}
                                        className="bg-blue-500 text-white p-3 rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        <FaPaperPlane className="text-sm" />
                                    </motion.button>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-3">
                                    Ask about job search, resume help, or career advice
                                </p>
                            </form>
                        </div>

                        {/* Floating Elements */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="absolute -top-4 -right-4 bg-yellow-500 text-white px-4 py-2 rounded-2xl shadow-lg"
                        >
                            <div className="flex items-center space-x-2">
                                <FaStar className="text-sm" />
                                <span className="text-sm font-semibold">AI Powered</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// ==================== Why Choose Us Section ====================
const WhyChooseUs = () => {
    const features = [
        {
            icon: FaBrain,
            title: "AI-Powered Matching",
            description: "Our advanced algorithms connect you with the perfect opportunities based on your skills and preferences.",
            color: "blue"
        },
        {
            icon: FaRocket,
            title: "Accelerated Growth",
            description: "Personalized learning paths and career advice to fast-track your professional development.",
            color: "green"
        },
        {
            icon: FaShieldAlt,
            title: "Privacy First",
            description: "Your data is encrypted and secure. We never share your information without consent.",
            color: "purple"
        },
        {
            icon: FaHandshake,
            title: "Trusted by Thousands",
            description: "Join a community of professionals who have advanced their careers with our platform.",
            color: "orange"
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Why Choose <span className="text-blue-600">Creative Career AI</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        We combine cutting-edge technology with human expertise to give you the edge in your job search.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            whileHover={{ y: -10 }}
                            className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
                        >
                            <div className={`w-16 h-16 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-6`}>
                                <feature.icon className={`text-3xl text-${feature.color}-600`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ==================== Reviews Section (Marquee) ====================
const ReviewsSection = () => {
    const reviews = [
        {
            id: 1,
            name: "Sarah Johnson",
            role: "Software Engineer",
            content: "This platform helped me land my dream job at a top tech company. The AI resume optimizer was a game-changer!",
            rating: 5,
            avatar: "👩‍💻"
        },
        {
            id: 2,
            name: "Michael Chen",
            role: "Product Manager",
            content: "The mock interviews with AI feedback were incredibly realistic. I felt fully prepared and confident.",
            rating: 5,
            avatar: "👨‍💼"
        },
        {
            id: 3,
            name: "Emily Rodriguez",
            role: "Marketing Specialist",
            content: "I love how the platform suggests personalized learning paths. It helped me upskill and get promoted.",
            rating: 5,
            avatar: "👩‍🎨"
        },
        {
            id: 4,
            name: "David Kim",
            role: "Data Scientist",
            content: "The job matching is spot on. I received relevant opportunities without the spam.",
            rating: 4,
            avatar: "👨‍🔬"
        },
        {
            id: 5,
            name: "Lisa Patel",
            role: "HR Manager",
            content: "As a recruiter, I find amazing candidates here. The AI filters save us so much time.",
            rating: 5,
            avatar: "👩‍💼"
        },
        {
            id: 6,
            name: "James Wilson",
            role: "Graphic Designer",
            content: "The resume builder made my portfolio stand out. Got multiple interview calls within a week!",
            rating: 5,
            avatar: "👨‍🎨"
        },
        {
            id: 7,
            name: "Anna Schmidt",
            role: "Business Analyst",
            content: "Excellent platform for career growth. The network feature connected me with great mentors.",
            rating: 5,
            avatar: "👩‍💼"
        },
        {
            id: 8,
            name: "Robert Brown",
            role: "Sales Executive",
            content: "The ATS score check helped me optimize my resume for each application. Highly recommend!",
            rating: 4,
            avatar: "👨‍💼"
        }
    ];

    // Duplicate reviews to create seamless loop
    const duplicatedReviews = [...reviews, ...reviews];

    return (
        <section className="py-20 bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
            <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        What Our <span className="text-blue-600">Users Say</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Join thousands of satisfied professionals who transformed their careers with us.
                    </p>
                </motion.div>

                {/* First row - left to right */}
                <div className="relative flex overflow-x-hidden mb-8">
                    <div className="animate-marquee-left whitespace-nowrap flex gap-6 py-4">
                        {duplicatedReviews.map((review, index) => (
                            <div
                                key={`row1-${review.id}-${index}`}
                                className="inline-block w-80 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex-shrink-0"
                            >
                                <div className="flex items-center mb-4">
                                    <span className="text-4xl mr-3">{review.avatar}</span>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{review.name}</h4>
                                        <p className="text-sm text-gray-600">{review.role}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-3 text-sm">"{review.content}"</p>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Second row - right to left */}
                <div className="relative flex overflow-x-hidden">
                    <div className="animate-marquee-right whitespace-nowrap flex gap-6 py-4">
                        {duplicatedReviews.map((review, index) => (
                            <div
                                key={`row2-${review.id}-${index}`}
                                className="inline-block w-80 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex-shrink-0"
                            >
                                <div className="flex items-center mb-4">
                                    <span className="text-4xl mr-3">{review.avatar}</span>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{review.name}</h4>
                                        <p className="text-sm text-gray-600">{review.role}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-3 text-sm">"{review.content}"</p>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom keyframes for marquee animations */}
            <style jsx>{`
                @keyframes marquee-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes marquee-right {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                .animate-marquee-left {
                    animation: marquee-left 30s linear infinite;
                }
                .animate-marquee-right {
                    animation: marquee-right 30s linear infinite;
                }
            `}</style>
        </section>
    );
};

// ==================== How It Works Section ====================
const HowItWorks = () => {
    const steps = [
        {
            icon: FaRegClipboard,
            title: "Create Profile",
            description: "Sign up and build your profile with your skills, experience, and career goals.",
            color: "blue"
        },
        {
            icon: FaRobot,
            title: "AI Matching",
            description: "Our AI analyzes your profile and matches you with the best opportunities.",
            color: "green"
        },
        {
            icon: FaVideo,
            title: "Prepare with AI",
            description: "Use mock interviews and resume tools to get ready for your dream job.",
            color: "purple"
        },
        {
            icon: FaUserCheck,
            title: "Get Hired",
            description: "Connect with employers and land the job you deserve.",
            color: "orange"
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        How It <span className="text-blue-600">Works</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Four simple steps to accelerate your career with AI.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            className="relative"
                        >
                            {/* Connector line (except last) */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-indigo-200"></div>
                            )}
                            <div className="relative z-10 bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className={`w-20 h-20 bg-${step.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                                    <step.icon className={`text-4xl text-${step.color}-600`} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ==================== Call to Action Section ====================
const CTASection = () => {
    return (
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your Career?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
                        Join thousands of professionals who are already using AI to land their dream jobs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/auth/sign-up"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            Get Started Free
                            <FaArrowRight className="ml-2" />
                        </Link>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-2xl hover:bg-white hover:text-blue-600 transition-all duration-300"
                        >
                            View Pricing
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// ==================== Main Home Page ====================
const Home = () => {
    return (
        <main>
            <HeroSection />
            <WhyChooseUs />
            <ReviewsSection />
            <HowItWorks />
            <CTASection />
        </main>
    );
};

export default Home;