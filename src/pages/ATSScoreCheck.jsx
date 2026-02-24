import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FaUpload, FaChartBar, FaLightbulb, FaStar, FaHistory, FaDownload } from 'react-icons/fa';

const ATSScoreCheck = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scoreHistory, setScoreHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a resume file');
      return;
    }

    if (!user?.email) {
      setError('Please log in to check your ATS score');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userEmail', user.email);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }

    try {
      const response = await fetch('http://localhost:5000/api/ats/check-score', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setResult(data);
      setShowHistory(false);

      // Refresh history
      fetchScoreHistory();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScoreHistory = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`http://localhost:5000/api/ats/history/${user.email}`);
      const data = await response.json();

      if (data.success) {
        setScoreHistory(data.scores);
      }
    } catch (err) {
      console.error('Failed to fetch score history:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-100 border-green-300';
    if (score >= 80) return 'bg-blue-100 border-blue-300';
    if (score >= 70) return 'bg-yellow-100 border-yellow-300';
    if (score >= 60) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ATS Resume Score Check
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume to get an instant ATS compatibility score and personalized suggestions for improvement.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analyze Your Resume</h2>
                <button
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) {
                      fetchScoreHistory();
                    }
                  }}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <FaHistory />
                  <span>History</span>
                </button>
              </div>

              {showHistory ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Previous Scores</h3>
                  {scoreHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No previous scores found</p>
                  ) : (
                    scoreHistory.map((score) => (
                      <div key={score.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{score.fileName}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(score.createdAt).toLocaleDateString()}
                            </p>
                            {score.jobDescription && (
                              <p className="text-sm text-gray-500 mt-1">
                                Job: {score.jobDescription.substring(0, 50)}...
                              </p>
                            )}
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                            {score.score}/100
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Resume (PDF)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <FaUpload className="mx-auto text-3xl text-gray-400 mb-3" />
                        <p className="text-gray-600">
                          {file ? file.name : 'Click to upload your resume'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          PDF files only, max 5MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Job Description (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Job Description (Optional)
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here for more targeted analysis..."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !file}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing Resume...</span>
                      </>
                    ) : (
                      <>
                        <FaChartBar />
                        <span>Check ATS Score</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-1">
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Score Card */}
                <div className={`border-2 rounded-2xl p-6 text-center ${getScoreBgColor(result.score)}`}>
                  <div className="text-5xl font-bold mb-2">
                    <span className={getScoreColor(result.score)}>{result.score}</span>
                    <span className="text-gray-600">/100</span>
                  </div>
                  <p className="text-gray-600 mb-4">ATS Compatibility Score</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${result.score >= 90 ? 'bg-green-500' :
                          result.score >= 80 ? 'bg-blue-500' :
                            result.score >= 70 ? 'bg-yellow-500' :
                              result.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${result.score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FaStar className="text-green-500" />
                    <h3 className="text-lg font-semibold">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {result.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Keywords */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Keyword Analysis</h3>

                  <div className="mb-4">
                    <h4 className="font-medium text-green-600 mb-2">Found Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords.found.map((keyword, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {result.keywords.missing.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.keywords.missing.map((keyword, index) => (
                          <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FaLightbulb className="text-yellow-500" />
                    <h3 className="text-lg font-semibold">Improvement Suggestions</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 text-center"
              >
                <FaChartBar className="text-4xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600">
                  Upload your resume to get your ATS compatibility score and personalized improvement suggestions.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSScoreCheck;