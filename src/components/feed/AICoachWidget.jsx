import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

// Helper to parse markdown-style links [text](/path) into React Router Link components
const parseMessageWithLinks = (text) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, linkPath] = match;
    const index = match.index;

    // Push preceding text
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // Push Link component
    parts.push(
      <Link
        key={index}
        to={linkPath}
        className="text-blue-600 underline hover:text-blue-800 transition-colors"
      >
        {linkText}
      </Link>
    );

    lastIndex = index + fullMatch.length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const AICoachWidget = ({ onClose }) => {
  const { user } = useAuth(); // Get current user from auth context
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

  // Generate AI response based on user input and context
  const getAIResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    const profession = user?.profession || 'your field';
    const userType = user?.userType || 'jobSeeker';

    // Platform features with links
    const features = {
      resume: {
        keywords: ['resume', 'cv', 'curriculum', 'build resume'],
        response: `You can create a professional resume using our [Resume Builder](/create-resume). It offers ATS-friendly templates and tips to highlight your experience. Would you like help with specific sections?`
      },
      interview: {
        keywords: ['interview', 'mock interview', 'practice interview', 'interview prep'],
        response: `Prepare for interviews with our [Mock Interview](/mock-interview) tool. Practice common questions and get instant feedback. You can also review the [STAR method](https://www.themuse.com/advice/star-interview-method) for structured answers.`
      },
      ats: {
        keywords: ['ats', 'score', 'resume score', 'check resume'],
        response: `Optimize your resume for applicant tracking systems using our [ATS Score Check](/ats-score). Upload your resume and see how it matches job descriptions.`
      },
      learning: {
        keywords: ['learning path', 'learn', 'skill', 'course', 'path'],
        response: `Discover personalized [Learning Paths](/learning-path) tailored to your career goals. We recommend courses and resources to help you upskill.`
      },
      jobs: {
        keywords: ['job', 'jobs', 'find job', 'search job', 'opportunities'],
        response: `Browse the latest [job openings](/jobs) that match your profile. You can filter by location, type, and experience. For ${profession} roles, check out the [jobs page](/jobs?search=${encodeURIComponent(profession)}).`
      },
      network: {
        keywords: ['network', 'connect', 'networking', 'connections'],
        response: `Expand your professional network on the [Network](/network) page. Connect with peers, recruiters, and industry experts.`
      },
      messages: {
        keywords: ['message', 'inbox', 'chat'],
        response: `View and send messages in your [Inbox](/messages). Stay in touch with recruiters and connections.`
      },
      applications: {
        keywords: ['application', 'applied', 'my applications', 'status'],
        response: userType === 'recruiter'
          ? `Track candidates who applied to your jobs in [My Jobs](/my-jobs). You can review and update application statuses there.`
          : `Check the status of your job applications on the [My Applications](/my-applications) page.`
      },
      pricing: {
        keywords: ['pricing', 'plan', 'subscription', 'premium', 'upgrade'],
        response: `View our [Pricing](/pricing) page to choose a plan that fits your needs. Unlock advanced features like unlimited ATS checks and mock interviews.`
      },
      settings: {
        keywords: ['settings', 'profile', 'account', 'update profile'],
        response: `Manage your account and profile on the [Settings](/settings) page. You can update your photo, profession, and preferences.`
      }
    };

    // Greeting variations
    if (lowerMsg.match(/\b(hi|hello|hey|greetings)\b/)) {
      return `Hello! How can I assist you with your career today? You can ask me about [resumes](/create-resume), [interviews](/mock-interview), [job search](/jobs), or any of our platform features.`;
    }

    // Check each feature's keywords
    for (const [key, feature] of Object.entries(features)) {
      if (feature.keywords.some(kw => lowerMsg.includes(kw))) {
        return feature.response;
      }
    }

    // Default response
    return `I'm here to help! You can ask me about:
- [Resume Builder](/create-resume)
- [Mock Interviews](/mock-interview)
- [ATS Score Check](/ats-score)
- [Learning Paths](/learning-path)
- [Jobs](/jobs)
- [Networking](/network)
- [Messages](/messages)
- [My Applications](/my-applications)
- [Pricing](/pricing)

What would you like to explore?`;
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

    // Simulate network delay
    setTimeout(() => {
      const responseText = getAIResponse(inputMessage);

      const botMessageId = Date.now() + 1;
      const botMessage = {
        id: botMessageId,
        text: '',
        isBot: true,
        timestamp: new Date(),
        isTyping: true
      };

      setMessages(prev => [...prev, botMessage]);
      typeText(responseText, botMessageId, () => setIsLoading(false));
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[600px] flex flex-col sticky inset-0 top-23"
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
                {message.isBot ? (
                  // Render bot message with parsed links
                  <div>
                    {Array.isArray(parseMessageWithLinks(message.text))
                      ? parseMessageWithLinks(message.text).map((part, idx) =>
                          typeof part === 'string' ? (
                            <span key={idx}>{part}</span>
                          ) : (
                            <React.Fragment key={idx}>{part}</React.Fragment>
                          )
                        )
                      : message.text}
                    {message.isTyping && (
                      <span className="inline-block w-1.5 h-3 bg-current ml-0.5 animate-pulse"></span>
                    )}
                  </div>
                ) : (
                  // User message as plain text
                  <>
                    {message.text}
                    {message.isTyping && (
                      <span className="inline-block w-1.5 h-3 bg-current ml-0.5 animate-pulse"></span>
                    )}
                  </>
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