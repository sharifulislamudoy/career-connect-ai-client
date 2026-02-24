import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FaBook,
    FaCalendarAlt,
    FaChartLine,
    FaCheckCircle,
    FaClock,
    FaPlay,
    FaStar,
    FaTasks
} from 'react-icons/fa';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const LearningPathGenerator = () => {
    const [step, setStep] = useState(1);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('');
    const [learningPath, setLearningPath] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customTitle, setCustomTitle] = useState('');

    const popularTitles = [
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Data Scientist',
        'Machine Learning Engineer',
        'DevOps Engineer',
        'UI/UX Designer',
        'Mobile App Developer',
        'Cloud Architect',
        'Cybersecurity Specialist'
    ];

    const durationOptions = [
        { value: '30', label: '1 Month', days: 30 },
        { value: '60', label: '2 Months', days: 60 },
        { value: '90', label: '3 Months', days: 90 },
        { value: '180', label: '6 Months', days: 180 },
        { value: '365', label: '1 Year', days: 365 }
    ];

    const generateLearningPath = async () => {
        if ((!selectedTitle && !customTitle.trim()) || !selectedDuration) return;

        setIsLoading(true);
        const title = customTitle.trim() || selectedTitle;
        const duration = durationOptions.find(d => d.value === selectedDuration);

        try {
            const response = await queryGroqAI(title, duration);
            setLearningPath(response);
            setStep(3);
        } catch (error) {
            console.error('Error generating learning path:', error);
            alert('Failed to generate learning path. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const queryGroqAI = async (title, duration) => {
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
                        content: `You are a learning path generator. Create a detailed, structured learning plan for a given career title and duration.

                        Requirements:
                        - Return ONLY valid JSON format
                        - Structure: {
                            "title": "Career Title",
                            "duration": "Duration in days",
                            "totalDays": number,
                            "weeklySchedule": [
                                {
                                    "week": number,
                                    "topics": string[],
                                    "milestone": string,
                                    "hoursRequired": number,
                                    "tasks": string[]
                                }
                            ],
                            "dailyTasks": [
                                {
                                    "day": number,
                                    "task": string,
                                    "topics": string[],
                                    "resources": string[],
                                    "completionTime": number
                                }
                            ],
                            "milestones": [
                                {
                                    "week": number,
                                    "title": string,
                                    "description": string,
                                    "tasks": string[],
                                    "achieved": boolean
                                }
                            ],
                            "skillBreakdown": [
                                {
                                    "skill": string,
                                    "percentage": number,
                                    "color": string
                                }
                            ],
                            "progressData": [
                                {
                                    "day": number,
                                    "progress": number,
                                    "topicsCompleted": number
                                }
                            ]
                        }

                        Guidelines:
                        - Each milestone MUST include specific tasks (3-5 tasks per milestone)
                        - Make tasks actionable and measurable
                        - Include practical projects and exercises
                        - Balance theory and practice
                        - Progress should be cumulative
                        - Skill percentages should total 100%
                        - Use realistic time commitments`
                    },
                    {
                        role: "user",
                        content: `Create a learning path for ${title} over ${duration.days} days (${duration.label}). Include specific tasks for each milestone.`
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 4096,
                stream: false
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return createFallbackPath(title, duration);
        }
    };

    const createFallbackPath = (title, duration) => {
        const days = duration.days;
        const weeklySchedule = [];
        const dailyTasks = [];
        const milestones = [];
        const progressData = [];
        const skillBreakdown = [
            { skill: 'Core Concepts', percentage: 30, color: '#8884d8' },
            { skill: 'Practical Projects', percentage: 25, color: '#82ca9d' },
            { skill: 'Tools & Technologies', percentage: 20, color: '#ffc658' },
            { skill: 'Best Practices', percentage: 15, color: '#ff8042' },
            { skill: 'Advanced Topics', percentage: 10, color: '#0088fe' }
        ];

        // Generate weekly schedule with tasks
        for (let week = 1; week <= Math.ceil(days / 7); week++) {
            weeklySchedule.push({
                week,
                topics: [`Week ${week} Topic 1`, `Week ${week} Topic 2`, `Week ${week} Topic 3`],
                milestone: `Completed Week ${week} Milestone`,
                hoursRequired: 15 + week * 2,
                tasks: [
                    `Complete ${week} practical exercises`,
                    `Build a small project using week ${week} concepts`,
                    `Review and refactor previous code`,
                    `Prepare for week ${week + 1} topics`
                ]
            });
        }

        // Generate daily tasks
        for (let day = 1; day <= days; day++) {
            dailyTasks.push({
                day,
                task: `Day ${day} learning task for ${title}`,
                topics: [`Topic A`, `Topic B`],
                resources: ['Documentation', 'Online Tutorial', 'Practice Exercises'],
                completionTime: 2 + (day % 3)
            });
        }

        // Generate milestones with specific tasks
        const milestoneData = [
            {
                week: 1,
                title: "Foundation Setup",
                description: "Establish basic understanding and setup development environment",
                tasks: [
                    "Set up development environment and tools",
                    "Complete basic syntax and concepts tutorial",
                    "Build a simple 'Hello World' application",
                    "Create your first project repository"
                ]
            },
            {
                week: Math.floor(days / 21),
                title: "Core Concepts Mastery",
                description: "Master fundamental concepts and build intermediate projects",
                tasks: [
                    "Complete 5 practical coding exercises",
                    "Build a functional intermediate project",
                    "Participate in code review session",
                    "Document your learning progress"
                ]
            },
            {
                week: Math.floor(days / 7),
                title: "Advanced Implementation",
                description: "Implement advanced features and optimize performance",
                tasks: [
                    "Optimize existing project performance",
                    "Implement advanced features and APIs",
                    "Write comprehensive unit tests",
                    "Create project documentation"
                ]
            },
            {
                week: Math.floor(days / 3.5),
                title: "Project Completion",
                description: "Complete major project and prepare for deployment",
                tasks: [
                    "Finalize main project features",
                    "Deploy project to production environment",
                    "Perform thorough testing and debugging",
                    "Create project presentation"
                ]
            },
            {
                week: Math.ceil(days / 7),
                title: "Portfolio Ready",
                description: "Polish skills and prepare for job applications",
                tasks: [
                    "Complete portfolio website",
                    "Prepare resume with new skills",
                    "Practice technical interviews",
                    "Contribute to open source project"
                ]
            }
        ];

        milestoneData.forEach((milestone, index) => {
            if (milestone.week <= Math.ceil(days / 7)) {
                milestones.push({
                    ...milestone,
                    achieved: false
                });
            }
        });

        // Generate progress data
        for (let day = 1; day <= days; day++) {
            progressData.push({
                day,
                progress: Math.min(100, Math.round((day / days) * 100)),
                topicsCompleted: Math.min(dailyTasks.length, day * 2)
            });
        }

        return {
            title,
            duration: duration.label,
            totalDays: days,
            weeklySchedule,
            dailyTasks,
            milestones,
            skillBreakdown,
            progressData
        };
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    // Chart components
    const renderProgressChart = () => (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaChartLine className="mr-2 text-blue-500" />
                Learning Progress Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={learningPath.progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="progress" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="topicsCompleted" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );

    const renderSkillBreakdown = () => (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaStar className="mr-2 text-yellow-500" />
                Skill Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={learningPath.skillBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ skill, percentage }) => `${skill}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="percentage"
                    >
                        {learningPath.skillBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );

    const renderWeeklyHours = () => (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaClock className="mr-2 text-green-500" />
                Weekly Time Commitment
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={learningPath.weeklySchedule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hoursRequired" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    const renderMilestoneProgress = () => (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaCheckCircle className="mr-2 text-purple-500" />
                Milestone Timeline
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={learningPath.milestones.map((m, i) => ({ ...m, index: i }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="week" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    // New component to render milestones with tasks
    const renderMilestonesWithTasks = () => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaCheckCircle className="mr-2 text-purple-500" />
                Learning Milestones with Tasks
            </h3>
            <div className="space-y-6">
                {learningPath.milestones.map((milestone, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-l-4 border-purple-500 pl-6 py-4 bg-gradient-to-r from-purple-50 to-transparent rounded-r-lg"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center mb-2">
                                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900">{milestone.title}</h4>
                                </div>
                                <p className="text-gray-600 ml-11">{milestone.description}</p>
                                <div className="flex items-center mt-2 ml-11">
                                    <FaClock className="text-gray-400 mr-1 text-sm" />
                                    <span className="text-sm text-gray-500">Week {milestone.week}</span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                milestone.achieved 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {milestone.achieved ? 'Completed' : 'Pending'}
                            </div>
                        </div>
                        
                        <div className="ml-11">
                            <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                                <FaTasks className="mr-2 text-blue-500" />
                                Tasks to Complete:
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {milestone.tasks.map((task, taskIndex) => (
                                    <motion.div
                                        key={taskIndex}
                                        whileHover={{ scale: 1.02 }}
                                        className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-blue-600 text-sm font-bold">{taskIndex + 1}</span>
                                        </div>
                                        <span className="text-gray-700 text-sm leading-relaxed">{task}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    return (
        <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        AI Learning Path Generator
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Create your personalized learning journey. Select your career goal and timeframe, 
                        and get a detailed roadmap to success.
                    </p>
                </motion.div>

                {/* Step 1: Select Title */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaBook className="text-white text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    What do you want to learn?
                                </h2>
                                <p className="text-gray-600">
                                    Choose a career path or enter your own learning goal
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {popularTitles.map((title, index) => (
                                    <motion.div
                                        key={title}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                            selectedTitle === title
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                        onClick={() => {
                                            setSelectedTitle(title);
                                            setCustomTitle('');
                                        }}
                                    >
                                        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                                        <p className="text-sm text-gray-600">
                                            Comprehensive learning path with projects and milestones
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Or enter custom learning goal:
                                </label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => {
                                        setCustomTitle(e.target.value);
                                        setSelectedTitle('');
                                    }}
                                    placeholder="e.g., Blockchain Developer, AI Researcher..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStep(2)}
                                disabled={!selectedTitle && !customTitle.trim()}
                                className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
                            >
                                Continue to Duration Selection
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Select Duration */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaCalendarAlt className="text-white text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Choose Your Timeline
                                </h2>
                                <p className="text-gray-600">
                                    How long do you want to spend on this learning journey?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {durationOptions.map((duration) => (
                                    <motion.div
                                        key={duration.value}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                            selectedDuration === duration.value
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-green-300'
                                        }`}
                                        onClick={() => setSelectedDuration(duration.value)}
                                    >
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {duration.label}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                {duration.days} days of learning
                                            </p>
                                            <div className="flex items-center justify-center text-green-500">
                                                <FaClock className="mr-2" />
                                                <span className="text-sm font-medium">
                                                    ~{Math.round(duration.days / 7 * 10)} hours/week
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex space-x-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-500 text-white py-4 rounded-2xl font-semibold hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Back
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={generateLearningPath}
                                    disabled={!selectedDuration || isLoading}
                                    className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors duration-200 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlay className="mr-2" />
                                            Generate Learning Path
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Learning Path Results */}
                {step === 3 && learningPath && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Header */}
                        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Your {learningPath.title} Learning Path
                            </h2>
                            <p className="text-gray-600 text-lg">
                                {learningPath.duration} Journey • {learningPath.totalDays} Days • Personalized AI Plan
                            </p>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {renderProgressChart()}
                            {renderSkillBreakdown()}
                            {renderWeeklyHours()}
                            {renderMilestoneProgress()}
                        </div>

                        {/* Milestones with Tasks */}
                        {renderMilestonesWithTasks()}

                        {/* Weekly Schedule */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                <FaTasks className="mr-2 text-blue-500" />
                                Weekly Learning Schedule
                            </h3>
                            <div className="space-y-6">
                                {learningPath.weeklySchedule.map((week) => (
                                    <div key={week.week} className="border-l-4 border-blue-500 pl-6 py-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                Week {week.week}: {week.milestone}
                                            </h4>
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                {week.hoursRequired} hours
                                            </span>
                                        </div>
                                        <div className="mb-4">
                                            <h5 className="font-medium text-gray-700 mb-2">Weekly Tasks:</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {week.tasks && week.tasks.map((task, index) => (
                                                    <div key={index} className="flex items-start space-x-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                        <span className="text-sm text-gray-600">{task}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {week.topics.map((topic, index) => (
                                                <div key={index} className="bg-gray-50 px-3 py-2 rounded-lg">
                                                    <span className="text-sm text-gray-700">{topic}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div className="text-center">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setStep(1);
                                    setLearningPath(null);
                                    setSelectedTitle('');
                                    setSelectedDuration('');
                                    setCustomTitle('');
                                }}
                                className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-blue-600 transition-colors duration-200"
                            >
                                Create New Learning Path
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default LearningPathGenerator;