import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaPaperPlane, FaTimes, FaChartLine, FaUserTie, FaBriefcase } from 'react-icons/fa';

const AICoachWidget = ({ onClose }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hi! I'm your AI Career Coach. I can help with interview tips, resume advice, or career guidance. What would you like to work on today?",
            isBot: true,
            timestamp: new Date(),
            isTyping: false
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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

        // Simulate AI response
        setTimeout(() => {
            const responses = [
                "That's a great question! Based on your profile, I'd recommend focusing on highlighting your leadership experience in your resume.",
                "For interview preparation, practice the STAR method: Situation, Task, Action, Result. This helps structure your answers effectively.",
                "I suggest networking with professionals in your target companies. Let me help you craft a connection request message.",
                "Your skills are in high demand! Consider updating your portfolio with recent projects to showcase your expertise."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            const botMessageId = Date.now() + 1;
            const botMessage = {
                id: botMessageId,
                text: "",
                isBot: true,
                timestamp: new Date(),
                isTyping: true
            };

            setMessages(prev => [...prev, botMessage]);
            typeText(randomResponse, botMessageId, () => setIsLoading(false));
        }, 1000);
    };


    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[600px] flex flex-col sticky insect-0 top-23"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <FaRobot className="text-white text-xl" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">AI Career Coach</h3>
                            <p className="text-blue-100 text-xs">Online • Always learning</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden text-white/80 hover:text-white p-1"
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>
            </div>


            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 scrollbar-thin"
            >
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 rounded-2xl ${
                                message.isBot
                                    ? 'bg-white border border-gray-200 rounded-tl-none'
                                    : 'bg-blue-500 text-white rounded-br-none'
                            }`}
                        >
                            <div className="text-sm leading-relaxed">
                                {message.text}
                                {message.isTyping && (
                                    <span className="inline-block w-1.5 h-3 bg-current ml-0.5 animate-pulse"></span>
                                )}
                            </div>
                            <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask your career question..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputMessage.trim()}
                        className="bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaPaperPlane className="text-xs" />
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default AICoachWidget;