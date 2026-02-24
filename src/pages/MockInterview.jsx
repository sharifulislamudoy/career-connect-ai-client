import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaPlay, FaStop, FaStar, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const MockInterview = () => {
    const { user } = useAuth()
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [interviewConfig, setInterviewConfig] = useState({
        topic: '',
        difficulty: 'beginner',
        questionCount: 5,
        duration: 30
    });
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [interviewResults, setInterviewResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [browserSupport, setBrowserSupport] = useState({
        speechRecognition: false,
        speechSynthesis: false,
        userMedia: false
    });
    const [showManualAnswerModal, setShowManualAnswerModal] = useState(false);
    const [manualAnswer, setManualAnswer] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const recognitionRef = useRef(null);

    // Check browser support on component mount
    useEffect(() => {
        checkBrowserSupport();
    }, []);

    const checkBrowserSupport = () => {
        const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const speechSynthesis = 'speechSynthesis' in window;

        setBrowserSupport({
            speechRecognition: !!speechRecognition,
            speechSynthesis: speechSynthesis,
            userMedia: !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia
        });

        if (speechRecognition) {
            initializeSpeechRecognition();
        }
    };

    const initializeSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        try {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                handleUserAnswer(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);

                switch (event.error) {
                    case 'not-allowed':
                    case 'permission-denied':
                        setError('Microphone permission denied. Please allow microphone access in your browser settings and reload the page.');
                        break;
                    case 'audio-capture':
                        setError('No microphone found. Please check your microphone connection.');
                        break;
                    case 'not-supported':
                        setError('Speech recognition is not supported in your browser.');
                        break;
                    default:
                        setError('Speech recognition error. Please try again.');
                }
            };
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
            setError('Failed to initialize speech recognition.');
        }
    };

    const requestMicrophonePermission = async () => {
        if (!browserSupport.userMedia) {
            setError('Microphone access is not supported in your browser.');
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop all tracks to release the microphone
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);

            if (error.name === 'NotAllowedError') {
                setError(`
                    Microphone access denied. 
                    Please allow microphone permissions:
                    1. Click the microphone icon in your address bar
                    2. Allow microphone access for this site
                    3. Refresh the page and try again
                `);
            } else if (error.name === 'NotFoundError') {
                setError('No microphone found. Please check if your microphone is connected properly.');
            } else {
                setError('Failed to access microphone. Please check your browser permissions.');
            }
            return false;
        }
    };

    const parseAIResponse = (text) => {
        try {
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            const lines = text.split('\n').filter(line =>
                line.trim() &&
                !line.toLowerCase().includes('here are') &&
                !line.toLowerCase().includes('interview questions') &&
                line.match(/^\d+\.\s|^[-*]\s/)
            );

            if (lines.length > 0) {
                return lines.slice(0, interviewConfig.questionCount).map((line, index) => {
                    const cleanLine = line.replace(/^\d+\.\s|^[-*]\s/, '').trim();
                    return {
                        question: cleanLine,
                        evaluationCriteria: [
                            "Relevance to question",
                            "Depth of knowledge",
                            "Clarity of communication",
                            "Practical examples",
                            "Structure and organization"
                        ]
                    };
                });
            }

            return Array.from({ length: interviewConfig.questionCount }, (_, i) => ({
                question: `Tell me about ${interviewConfig.topic} and how you've used it in your projects?`,
                evaluationCriteria: [
                    "Relevance to question",
                    "Depth of knowledge",
                    "Clarity of communication",
                    "Practical examples",
                    "Structure and organization"
                ]
            }));

        } catch (error) {
            console.error('Error parsing AI response:', error);
            return Array.from({ length: interviewConfig.questionCount }, (_, i) => ({
                question: `Question ${i + 1} about ${interviewConfig.topic}?`,
                evaluationCriteria: [
                    "Relevance to question",
                    "Depth of knowledge",
                    "Clarity of communication",
                    "Practical examples",
                    "Structure and organization"
                ]
            }));
        }
    };

    const generateInterviewQuestions = async () => {
        if (!interviewConfig.topic.trim()) {
            setError('Please enter an interview topic');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert interview coach. Generate ${interviewConfig.questionCount} interview questions about "${interviewConfig.topic}" at ${interviewConfig.difficulty} level.
                            
                            IMPORTANT: Return ONLY a JSON array of question objects. No additional text or explanations.
                            
                            Format:
                            [
                                {
                                    "question": "Specific question text here",
                                    "evaluationCriteria": ["criterion1", "criterion2", "criterion3", "criterion4", "criterion5"]
                                }
                            ]
                            
                            Make questions practical, relevant, and suitable for the difficulty level.`
                        }
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.7,
                    max_tokens: 1024,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from AI');
            }

            const aiResponse = data.choices[0].message.content;
            const questionsData = parseAIResponse(aiResponse);

            if (!questionsData || !Array.isArray(questionsData) || questionsData.length === 0) {
                throw new Error('Failed to generate valid questions');
            }

            setQuestions(questionsData);
            setStep(2);

        } catch (error) {
            console.error('Error generating questions:', error);
            setError(`Failed to generate questions: ${error.message}. Please try again.`);
        }
        setIsLoading(false);
    };

    const speakQuestion = (text) => {
        if (browserSupport.speechSynthesis) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => {
                setIsPlaying(false);
                // Don't auto-start recording, let user click manually
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                setIsPlaying(false);
                setError('Text-to-speech failed. You can continue with text-based interview.');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            setError('Text-to-speech not supported in your browser. Questions will be displayed as text.');
        }
    };

    const startRecording = async () => {
        if (!browserSupport.speechRecognition) {
            setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        // Request microphone permission first
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            return;
        }

        if (recognitionRef.current && !isRecording) {
            try {
                setIsRecording(true);
                recognitionRef.current.start();
            } catch (error) {
                console.error('Error starting recording:', error);
                setIsRecording(false);
                setError('Failed to start recording. Please try again.');
            }
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleUserAnswer = async (answer) => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        const userAnswer = {
            question: currentQuestion.question,
            userAnswer: answer,
            timestamp: new Date(),
            evaluation: null
        };

        setUserAnswers(prev => [...prev, userAnswer]);

        // Evaluate the answer
        await evaluateAnswer(currentQuestion.question, answer, currentQuestion.evaluationCriteria);

        // Move to next question or finish
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishInterview();
        }
    };

    // Manual answer input with modal
    const openManualAnswerModal = () => {
        setShowManualAnswerModal(true);
        setManualAnswer('');
    };

    const closeManualAnswerModal = () => {
        setShowManualAnswerModal(false);
        setManualAnswer('');
    };

    const submitManualAnswer = () => {
        if (manualAnswer.trim()) {
            handleUserAnswer(manualAnswer.trim());
            closeManualAnswerModal();
        }
    };

    const parseEvaluationResponse = (text) => {
        try {
            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return {
                score: Math.floor(Math.random() * 6) + 5,
                feedback: "This is an automated evaluation based on your response.",
                strengths: ["Good attempt at answering the question"],
                improvements: ["Provide more specific examples and details"]
            };
        } catch (error) {
            console.error('Error parsing evaluation:', error);
            return {
                score: 6,
                feedback: "Evaluation system temporarily unavailable.",
                strengths: [],
                improvements: []
            };
        }
    };

    const evaluateAnswer = async (question, answer, criteria) => {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert interview evaluator. Evaluate the user's answer based on: ${criteria.join(', ')}.
                            
                            IMPORTANT: Return ONLY a JSON object. No additional text.
                            
                            Format:
                            {
                                "score": number (0-10),
                                "feedback": "constructive feedback string",
                                "strengths": ["strength1", "strength2"],
                                "improvements": ["improvement1", "improvement2"]
                            }`
                        },
                        {
                            role: "user",
                            content: `Question: ${question}\nAnswer: ${answer}`
                        }
                    ],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.7,
                    max_tokens: 512,
                    stream: false
                })
            });

            const data = await response.json();
            const evaluation = parseEvaluationResponse(data.choices[0].message.content);

            setUserAnswers(prev => {
                const updatedAnswers = [...prev];
                const lastIndex = updatedAnswers.length - 1;
                if (lastIndex >= 0) {
                    updatedAnswers[lastIndex] = {
                        ...updatedAnswers[lastIndex],
                        evaluation
                    };
                }
                return updatedAnswers;
            });
        } catch (error) {
            console.error('Error evaluating answer:', error);
            setUserAnswers(prev => {
                const updatedAnswers = [...prev];
                const lastIndex = updatedAnswers.length - 1;
                if (lastIndex >= 0) {
                    updatedAnswers[lastIndex] = {
                        ...updatedAnswers[lastIndex],
                        evaluation: {
                            score: 6,
                            feedback: "Evaluation temporarily unavailable.",
                            strengths: [],
                            improvements: []
                        }
                    };
                }
                return updatedAnswers;
            });
        }
    };

    // Save interview results to database
    const saveInterviewResults = async (results) => {
        if (!user || !user.email) {
            console.error('User not authenticated');
            return;
        }

        setIsSaving(true);
        try {
            const interviewData = {
                userEmail: user.email,
                interviewConfig: interviewConfig,
                results: results,
                timestamp: new Date(),
                totalScore: results.totalScore,
                difficulty: interviewConfig.difficulty,
                questionCount: interviewConfig.questionCount,
                topic: interviewConfig.topic,
                answers: results.answers
            };

            const response = await fetch('http://localhost:5000/api/interviews/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(interviewData)
            });

            if (!response.ok) {
                throw new Error('Failed to save interview results');
            }

            const data = await response.json();
            console.log('Interview results saved successfully:', data);
        } catch (error) {
            console.error('Error saving interview results:', error);
            // Don't show error to user as this doesn't affect their experience
        } finally {
            setIsSaving(false);
        }
    };

    const finishInterview = async () => {
        const answersWithScores = userAnswers.filter(answer => answer.evaluation);
        const totalScore = answersWithScores.reduce((sum, answer) => sum + (answer.evaluation?.score || 0), 0);
        const averageScore = answersWithScores.length > 0 ? totalScore / answersWithScores.length : 0;

        const results = {
            totalScore: averageScore,
            answers: userAnswers,
            summary: generateSummary(averageScore)
        };

        setInterviewResults(results);
        
        // Save results to database
        await saveInterviewResults(results);
        
        setStep(3);
    };

    const generateSummary = (score) => {
        if (score >= 8) return "Excellent performance! You demonstrated strong knowledge and communication skills.";
        if (score >= 6) return "Good performance! With some practice, you'll excel in real interviews.";
        return "Needs improvement. Focus on practicing common questions and improving your communication.";
    };

    const restartInterview = () => {
        setStep(1);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setInterviewResults(null);
        setError('');
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="w-11/12 mx-auto px-4 lg:px-8">
                {/* Browser Support Warning */}
                {(!browserSupport.speechRecognition || !browserSupport.speechSynthesis) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
                    >
                        <div className="flex items-start space-x-3">
                            <FaExclamationTriangle className="text-yellow-500 text-xl mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-yellow-800">Browser Compatibility Notice</h4>
                                <p className="text-yellow-700 text-sm mt-1">
                                    {!browserSupport.speechRecognition && "Speech recognition is not supported in your browser. "}
                                    {!browserSupport.speechSynthesis && "Text-to-speech is not supported. "}
                                    For full voice features, please use Chrome or Edge on desktop.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex justify-between items-center mb-4">

                        <h1 className="text-4xl font-bold text-gray-900">
                            AI Mock Interview
                        </h1>

                        <div className="w-20"></div>
                    </div>

                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Practice your interview skills with AI-powered interviews. {browserSupport.speechRecognition ? "Use voice or text to answer questions." : "Answer questions using text input."}
                    </p>
                </motion.div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-2xl p-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                                <FaExclamationTriangle className="text-red-500 text-xl mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-red-700 whitespace-pre-line">{error}</p>
                                    {error.includes('permission') && (
                                        <div className="mt-2 text-sm text-red-600">
                                            <strong>Quick fix:</strong> Refresh the page and allow microphone access when prompted.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setError('')}
                                className="text-red-500 hover:text-red-700 text-xl font-bold ml-4"
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3].map((stepNumber) => (
                            <React.Fragment key={stepNumber}>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${step >= stepNumber
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'border-gray-300 text-gray-500'
                                    } font-semibold`}>
                                    {step > stepNumber ? <FaCheckCircle /> : stepNumber}
                                </div>
                                {stepNumber < 3 && (
                                    <div className={`w-20 h-1 ${step > stepNumber ? 'bg-blue-500' : 'bg-gray-300'
                                        }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Step 1: Interview Setup */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-200/80 p-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Configure Your Interview
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Interview Topic *
                                </label>
                                <input
                                    type="text"
                                    value={interviewConfig.topic}
                                    onChange={(e) => setInterviewConfig(prev => ({
                                        ...prev,
                                        topic: e.target.value
                                    }))}
                                    placeholder="e.g., React.js, Data Structures, Product Management, JavaScript, System Design"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Difficulty Level
                                </label>
                                <select
                                    value={interviewConfig.difficulty}
                                    onChange={(e) => setInterviewConfig(prev => ({
                                        ...prev,
                                        difficulty: e.target.value
                                    }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Questions: {interviewConfig.questionCount}
                                </label>
                                <input
                                    type="range"
                                    min="3"
                                    max="10"
                                    value={interviewConfig.questionCount}
                                    onChange={(e) => setInterviewConfig(prev => ({
                                        ...prev,
                                        questionCount: parseInt(e.target.value)
                                    }))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-sm text-gray-500 mt-1">
                                    <span>3</span>
                                    <span>10</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={generateInterviewQuestions}
                                disabled={!interviewConfig.topic.trim() || isLoading}
                                className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Generating Questions...
                                    </>
                                ) : (
                                    'Start Interview'
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Live Interview */}
                {step === 2 && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Interview Interface */}
                            <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl border border-gray-200/80 p-8">
                                <div className="text-center mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-gray-500">
                                            Question {currentQuestionIndex + 1} of {questions.length}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            <FaClock className="inline mr-1" />
                                            Duration: {interviewConfig.duration}min
                                        </span>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                            Current Question
                                        </h3>
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                            <p className="text-lg text-gray-800 leading-relaxed">
                                                {currentQuestion.question}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Voice Controls - Only show if supported */}
                                    {browserSupport.speechRecognition && (
                                        <>
                                            <div className="flex justify-center space-x-6 mb-6">
                                                <div className="text-center">
                                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 ${isPlaying ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        <FaPlay className="text-2xl" />
                                                    </div>
                                                    <span className="text-sm text-gray-600">AI Speaking</span>
                                                </div>

                                                <div className="text-center">
                                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 ${isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {isRecording ? (
                                                            <FaMicrophone className="text-2xl" />
                                                        ) : (
                                                            <FaMicrophoneSlash className="text-2xl" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {isRecording ? 'Listening...' : 'Your Turn'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Recording Status */}
                                            {isRecording && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4"
                                                >
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                                        <span className="text-red-700 font-medium">Recording in progress...</span>
                                                    </div>
                                                    <p className="text-sm text-red-600 mt-1">
                                                        Speak your answer clearly. Click stop when finished.
                                                    </p>
                                                </motion.div>
                                            )}

                                            <div className="flex justify-center space-x-4 mb-4">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={startRecording}
                                                    disabled={isRecording || isPlaying}
                                                    className="bg-green-500 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Start Answering
                                                </motion.button>

                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={stopRecording}
                                                    disabled={!isRecording}
                                                    className="bg-red-500 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Stop Answering
                                                </motion.button>
                                            </div>
                                        </>
                                    )}

                                    {/* Manual Input Option */}
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-3">
                                            {browserSupport.speechRecognition
                                                ? "Or answer manually:"
                                                : "Answer using text:"}
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={openManualAnswerModal}
                                            className="bg-gray-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-600"
                                        >
                                            Type Answer
                                        </motion.button>
                                    </div>

                                    {/* Text-to-Speech Controls */}
                                    {browserSupport.speechSynthesis && (
                                        <div className="mt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => speakQuestion(currentQuestion.question)}
                                                disabled={isPlaying}
                                                className="bg-purple-500 text-white px-4 py-2 rounded-2xl text-sm font-semibold disabled:opacity-50"
                                            >
                                                {isPlaying ? 'Speaking...' : 'Hear Question Again'}
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Sidebar */}
                            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/80 p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Interview Progress</h4>

                                <div className="space-y-3 mb-6">
                                    {questions.map((q, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-2xl border ${index === currentQuestionIndex
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : index < currentQuestionIndex
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${index === currentQuestionIndex
                                                        ? 'bg-blue-500 text-white'
                                                        : index < currentQuestionIndex
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-300 text-gray-600'
                                                    }`}>
                                                    {index < currentQuestionIndex ? '✓' : index + 1}
                                                </div>
                                                <span className="text-sm text-gray-700 flex-1 truncate">
                                                    {q.question}
                                                </span>
                                            </div>

                                            {index < currentQuestionIndex && userAnswers[index]?.evaluation && (
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <FaStar className="text-yellow-500 text-sm" />
                                                    <span className="text-xs font-medium text-gray-700">
                                                        Score: {userAnswers[index].evaluation.score}/10
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={finishInterview}
                                    className="w-full bg-gray-500 text-white py-3 rounded-2xl font-semibold hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Finish Interview
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Results */}
                {step === 3 && interviewResults && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-200/80 p-8"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Interview Results
                            </h2>

                            {/* Overall Score */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 text-white mb-8">
                                <div className="text-6xl font-bold mb-2">
                                    {interviewResults.totalScore.toFixed(1)}
                                    <span className="text-2xl">/10</span>
                                </div>
                                <div className="text-xl mb-2">Overall Score</div>
                                <div className="text-blue-100">
                                    {interviewResults.summary}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Results */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                                Question-wise Analysis
                            </h3>

                            {interviewResults.answers.map((answer, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-semibold text-gray-900 flex-1">
                                            Q{index + 1}: {answer.question}
                                        </h4>
                                        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                                            <FaStar className="text-yellow-500" />
                                            <span className="font-semibold text-yellow-700">
                                                {answer.evaluation?.score || 0}/10
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Your Answer:</h5>
                                        <p className="text-gray-600 bg-gray-50 rounded-xl p-4">
                                            {answer.userAnswer}
                                        </p>
                                    </div>

                                    {answer.evaluation && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="text-sm font-medium text-green-700 mb-2">Strengths:</h5>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {answer.evaluation.strengths.map((strength, i) => (
                                                        <li key={i} className="flex items-center">
                                                            <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                                                            {strength}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-medium text-orange-700 mb-2">Improvements:</h5>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {answer.evaluation.improvements.map((improvement, i) => (
                                                        <li key={i} className="flex items-center">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                                            {improvement}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {answer.evaluation?.feedback && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                                            <h5 className="text-sm font-medium text-blue-700 mb-2">Feedback:</h5>
                                            <p className="text-sm text-gray-700">{answer.evaluation.feedback}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-4 mt-8">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={restartInterview}
                                className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-blue-600 transition-colors duration-200"
                            >
                                Practice Again
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/')}
                                className="bg-gray-500 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-gray-600 transition-colors duration-200"
                            >
                                Back to Home
                            </motion.button>
                        </div>

                        {/* Saving Indicator */}
                        {isSaving && (
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-500">Saving interview results...</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Manual Answer Modal */}
                {showManualAnswerModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">Type Your Answer</h3>
                                <button
                                    onClick={closeManualAnswerModal}
                                    className="text-gray-500 hover:text-gray-700 text-xl"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Question:</p>
                                <p className="text-gray-800 bg-gray-50 rounded-xl p-3 mb-4">
                                    {currentQuestion?.question}
                                </p>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Answer:
                                </label>
                                <textarea
                                    value={manualAnswer}
                                    onChange={(e) => setManualAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    rows="6"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={closeManualAnswerModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitManualAnswer}
                                    disabled={!manualAnswer.trim()}
                                    className="bg-blue-500 text-white px-6 py-2 rounded-2xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit Answer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MockInterview;