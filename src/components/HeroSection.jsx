import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaChartLine,
    FaRobot,
    FaPaperPlane,
    FaUserTie,
    FaBriefcase,
    FaStar,
} from 'react-icons/fa';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

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

    // Scroll to bottom when messages change
    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
        }
    }, [messages, isLoading]);

    // Typing effect for bot messages
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

    // Generate system prompt with platform information
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

    // Render message text with embedded Link components
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

export default HeroSection;