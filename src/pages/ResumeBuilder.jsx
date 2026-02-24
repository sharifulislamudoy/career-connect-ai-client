import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFilePdf, 
  FaSave, 
  FaDownload, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaUser, 
  FaBriefcase,
  FaGraduationCap,
  FaCode,
  FaProjectDiagram,
  FaLanguage
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ResumeBuilder = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [editingResumeId, setEditingResumeId] = useState(null);

  // Initial resume data structure
  const initialResumeData = {
    personal: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      github: '',
      summary: ''
    },
    skills: [],
    experience: [],
    education: [],
    projects: [],
    languages: []
  };

  const [resumeData, setResumeData] = useState(initialResumeData);

  // Fetch user's resumes
  const fetchResumes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/resumes/user/${user.uid}`);
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      toast.error('Failed to fetch resumes');
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchResumes();
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setResumeData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle array field changes
  const handleArrayFieldChange = (section, index, field, value) => {
    setResumeData(prev => {
      const newArray = [...prev[section]];
      newArray[index] = {
        ...newArray[index],
        [field]: value
      };
      return {
        ...prev,
        [section]: newArray
      };
    });
  };

  // Add new item to array
  const addArrayItem = (section) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], {}]
    }));
  };

  // Remove item from array
  const removeArrayItem = (section, index) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to remove this ${section.slice(0, -1)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setResumeData(prev => ({
          ...prev,
          [section]: prev[section].filter((_, i) => i !== index)
        }));
        Swal.fire(
          'Removed!',
          `The ${section.slice(0, -1)} has been removed.`,
          'success'
        );
      }
    });
  };

  // Save resume
  const saveResume = async () => {
    if (!user) {
      toast.error('Please login to save resume');
      return;
    }

    // Validate required fields
    if (!resumeData.personal.name.trim() || !resumeData.personal.email.trim()) {
      Swal.fire({
        title: 'Required Fields Missing',
        text: 'Please fill in at least your name and email address.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      setSaving(true);
      
      const url = editingResumeId 
        ? `http://localhost:5000/api/resumes/${editingResumeId}`
        : 'http://localhost:5000/api/resumes';
      
      const method = editingResumeId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...resumeData,
          userId: user.uid,
          title: `${resumeData.personal.name}'s Resume - ${new Date().toLocaleDateString()}`
        })
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          title: editingResumeId ? 'Resume Updated!' : 'Resume Saved!',
          text: editingResumeId ? 'Your resume has been updated successfully.' : 'Your resume has been saved successfully.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
        
        fetchResumes();
        if (!editingResumeId) {
          setResumeData(initialResumeData);
        }
        setEditingResumeId(null);
      } else {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to save resume. Please try again.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'An error occurred while saving the resume.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Load resume for editing
  const loadResumeForEdit = (resume) => {
    Swal.fire({
      title: 'Load Resume',
      text: 'Are you sure you want to load this resume? Any unsaved changes will be lost.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, load it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setResumeData(resume);
        setEditingResumeId(resume._id);
        setActiveTab('personal');
        Swal.fire(
          'Loaded!',
          'Resume has been loaded for editing.',
          'success'
        );
      }
    });
  };

  // Delete resume
  const deleteResume = async (id, resumeName) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${resumeName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/resumes/${id}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to delete resume');
          }
          
          return result;
        } catch (error) {
          Swal.showValidationMessage(`Request failed: ${error.message}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        fetchResumes();
        Swal.fire({
          title: 'Deleted!',
          text: 'Your resume has been deleted.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      }
    });
  };

  // Generate PDF
  const generatePDF = async () => {
    // Validate required fields
    if (!resumeData.personal.name.trim()) {
      Swal.fire({
        title: 'Missing Information',
        text: 'Please enter your name to generate a PDF.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Generate PDF',
        text: 'Do you want to generate and download your resume as PDF?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, generate PDF!',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          const response = await fetch('http://localhost:5000/api/resumes/generate-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resumeData)
          });

          if (!response.ok) {
            throw new Error('Failed to generate PDF');
          }

          return response.blob();
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed) {
        // Create download link
        const url = window.URL.createObjectURL(result.value);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resumeData.personal.name.replace(/\s+/g, '_')}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        Swal.fire({
          title: 'Success!',
          text: 'PDF generated and downloaded successfully!',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate PDF. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      console.error('Error generating PDF:', error);
    }
  };

  // Create new resume
  const createNewResume = () => {
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(resumeData) !== JSON.stringify(initialResumeData);
    
    if (hasChanges) {
      Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Do you want to discard them and create a new resume?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, create new',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          setResumeData(initialResumeData);
          setEditingResumeId(null);
          Swal.fire(
            'New Resume',
            'Started a new resume.',
            'success'
          );
        }
      });
    } else {
      setResumeData(initialResumeData);
      setEditingResumeId(null);
    }
  };

  // Resume sections configuration
  const sections = [
    { id: 'personal', label: 'Personal Info', icon: FaUser },
    { id: 'skills', label: 'Skills', icon: FaCode },
    { id: 'experience', label: 'Experience', icon: FaBriefcase },
    { id: 'education', label: 'Education', icon: FaGraduationCap },
    { id: 'projects', label: 'Projects', icon: FaProjectDiagram },
    { id: 'languages', label: 'Languages', icon: FaLanguage }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            AI-Powered Resume Builder
          </h1>
          <p className="text-gray-600">
            Create professional resumes that stand out to employers and ATS systems
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Resume List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaFilePdf className="text-blue-500" />
                Your Resumes
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading resumes...</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No resumes yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <div
                      key={resume._id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {resume.personal?.name || 'Untitled Resume'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created: {new Date(resume.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => loadResumeForEdit(resume)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Resume"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => deleteResume(resume._id, resume.personal?.name || 'Untitled Resume')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Resume"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={saveResume}
                disabled={saving}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <FaSave />
                {saving ? 'Saving...' : editingResumeId ? 'Update Resume' : 'Save Resume'}
              </button>
              
              <button
                onClick={generatePDF}
                disabled={!resumeData.personal.name.trim()}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <FaDownload />
                Download PDF
              </button>
              
              <button
                onClick={createNewResume}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <FaPlus />
                New Resume
              </button>
            </div>

            {/* Stats */}
            {resumes.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Resume Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Resumes:</span>
                    <span className="font-medium text-blue-700">{resumes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-blue-700">
                      {resumes.length > 0 
                        ? new Date(Math.max(...resumes.map(r => new Date(r.updatedAt).getTime()))).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column - Resume Builder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header with Resume Name */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingResumeId ? 'Editing Resume' : 'Creating New Resume'}
                    </h2>
                    {resumeData.personal.name && (
                      <p className="text-sm text-gray-600 mt-1">
                        {resumeData.personal.name}
                        {resumeData.personal.title && ` - ${resumeData.personal.title}`}
                      </p>
                    )}
                  </div>
                  {editingResumeId && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      Editing Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                        activeTab === section.id
                          ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <section.icon />
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {/* Personal Info */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      <div className="text-xs text-gray-500">
                        Fields with * are required
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={resumeData.personal.name}
                          onChange={(e) => handleInputChange('personal', 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Professional Title
                        </label>
                        <input
                          type="text"
                          value={resumeData.personal.title}
                          onChange={(e) => handleInputChange('personal', 'title', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Software Engineer"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={resumeData.personal.email}
                          onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={resumeData.personal.phone}
                          onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+1 (123) 456-7890"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={resumeData.personal.location}
                          onChange={(e) => handleInputChange('personal', 'location', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="San Francisco, CA"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website/Portfolio
                        </label>
                        <input
                          type="url"
                          value={resumeData.personal.website}
                          onChange={(e) => handleInputChange('personal', 'website', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        value={resumeData.personal.github}
                        onChange={(e) => handleInputChange('personal', 'github', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://github.com/username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Summary / Career Objective
                      </label>
                      <textarea
                        value={resumeData.personal.summary}
                        onChange={(e) => handleInputChange('personal', 'summary', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                        placeholder="Passionate software engineer with 5+ years of experience developing scalable web applications..."
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: Write a compelling summary of your professional background and career goals.
                      </p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Technical Skills</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Add your technical skills, programming languages, tools, and frameworks.
                        </p>
                      </div>
                      <button
                        onClick={() => addArrayItem('skills')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <FaPlus /> Add Skill
                      </button>
                    </div>
                    
                    {resumeData.skills.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <FaCode className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No skills added yet.</p>
                        <p className="text-sm text-gray-400 mb-4">
                          Add technical skills like JavaScript, React, Python, AWS, etc.
                        </p>
                        <button
                          onClick={() => addArrayItem('skills')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                        >
                          <FaPlus /> Add Your First Skill
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {resumeData.skills.map((skill, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-gray-900">Skill {index + 1}</h4>
                              <button
                                onClick={() => removeArrayItem('skills', index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Remove Skill"
                              >
                                <FaTrash />
                              </button>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Skill Name *
                              </label>
                              <input
                                type="text"
                                value={skill.name || ''}
                                onChange={(e) => handleArrayFieldChange('skills', index, 'name', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="JavaScript, React, Node.js, etc."
                              />
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center">
                          <button
                            onClick={() => addArrayItem('skills')}
                            className="border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <FaPlus /> Add Another Skill
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Experience */}
                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          List your previous work experiences starting with the most recent.
                        </p>
                      </div>
                      <button
                        onClick={() => addArrayItem('experience')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <FaPlus /> Add Experience
                      </button>
                    </div>
                    
                    {resumeData.experience.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <FaBriefcase className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No work experience added yet.</p>
                        <p className="text-sm text-gray-400 mb-4">
                          Add your professional work experiences, internships, or relevant positions.
                        </p>
                        <button
                          onClick={() => addArrayItem('experience')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                        >
                          <FaPlus /> Add Your First Experience
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {resumeData.experience.map((exp, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                              <button
                                onClick={() => removeArrayItem('experience', index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Remove Experience"
                              >
                                <FaTrash />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Job Title *
                                </label>
                                <input
                                  type="text"
                                  value={exp.position || ''}
                                  onChange={(e) => handleArrayFieldChange('experience', index, 'position', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Senior Software Engineer"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Company *
                                </label>
                                <input
                                  type="text"
                                  value={exp.company || ''}
                                  onChange={(e) => handleArrayFieldChange('experience', index, 'company', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Google Inc."
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={exp.location || ''}
                                  onChange={(e) => handleArrayFieldChange('experience', index, 'location', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Mountain View, CA"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Duration
                                </label>
                                <input
                                  type="text"
                                  value={exp.duration || ''}
                                  onChange={(e) => handleArrayFieldChange('experience', index, 'duration', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Jan 2020 - Present"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                              </label>
                              <textarea
                                value={exp.description || ''}
                                onChange={(e) => handleArrayFieldChange('experience', index, 'description', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                                placeholder="Describe your responsibilities and achievements..."
                                rows={4}
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Tip: Use bullet points (•) to highlight key achievements and responsibilities.
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center">
                          <button
                            onClick={() => addArrayItem('experience')}
                            className="border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <FaPlus /> Add Another Experience
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Education */}
                {activeTab === 'education' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          List your educational background including degrees and certifications.
                        </p>
                      </div>
                      <button
                        onClick={() => addArrayItem('education')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <FaPlus /> Add Education
                      </button>
                    </div>
                    
                    {resumeData.education.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <FaGraduationCap className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No education added yet.</p>
                        <p className="text-sm text-gray-400 mb-4">
                          Add your degrees, diplomas, and educational achievements.
                        </p>
                        <button
                          onClick={() => addArrayItem('education')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                        >
                          <FaPlus /> Add Your First Education
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {resumeData.education.map((edu, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                              <button
                                onClick={() => removeArrayItem('education', index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Remove Education"
                              >
                                <FaTrash />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Institution *
                                </label>
                                <input
                                  type="text"
                                  value={edu.institution || ''}
                                  onChange={(e) => handleArrayFieldChange('education', index, 'institution', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Stanford University"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Degree *
                                </label>
                                <input
                                  type="text"
                                  value={edu.degree || ''}
                                  onChange={(e) => handleArrayFieldChange('education', index, 'degree', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Bachelor of Science"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Field of Study
                                </label>
                                <input
                                  type="text"
                                  value={edu.field || ''}
                                  onChange={(e) => handleArrayFieldChange('education', index, 'field', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Computer Science"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Duration
                                </label>
                                <input
                                  type="text"
                                  value={edu.duration || ''}
                                  onChange={(e) => handleArrayFieldChange('education', index, 'duration', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="2016 - 2020"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center">
                          <button
                            onClick={() => addArrayItem('education')}
                            className="border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <FaPlus /> Add Another Education
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Projects */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Showcase your projects, contributions, and portfolio work.
                        </p>
                      </div>
                      <button
                        onClick={() => addArrayItem('projects')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <FaPlus /> Add Project
                      </button>
                    </div>
                    
                    {resumeData.projects.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <FaProjectDiagram className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No projects added yet.</p>
                        <p className="text-sm text-gray-400 mb-4">
                          Add personal projects, open-source contributions, or freelance work.
                        </p>
                        <button
                          onClick={() => addArrayItem('projects')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                        >
                          <FaPlus /> Add Your First Project
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {resumeData.projects.map((project, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-gray-900">Project {index + 1}</h4>
                              <button
                                onClick={() => removeArrayItem('projects', index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Remove Project"
                              >
                                <FaTrash />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Project Name *
                                </label>
                                <input
                                  type="text"
                                  value={project.name || ''}
                                  onChange={(e) => handleArrayFieldChange('projects', index, 'name', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="E-commerce Platform"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Technologies
                                </label>
                                <input
                                  type="text"
                                  value={project.technologies || ''}
                                  onChange={(e) => handleArrayFieldChange('projects', index, 'technologies', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="React, Node.js, MongoDB"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                              </label>
                              <textarea
                                value={project.description || ''}
                                onChange={(e) => handleArrayFieldChange('projects', index, 'description', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                                placeholder="Describe the project, your role, and key features..."
                                rows={4}
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Tip: Include project goals, your specific contributions, and results achieved.
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center">
                          <button
                            onClick={() => addArrayItem('projects')}
                            className="border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <FaPlus /> Add Another Project
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Languages */}
                {activeTab === 'languages' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Languages</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          List languages you speak and your proficiency level.
                        </p>
                      </div>
                      <button
                        onClick={() => addArrayItem('languages')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <FaPlus /> Add Language
                      </button>
                    </div>
                    
                    {resumeData.languages.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <FaLanguage className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No languages added yet.</p>
                        <p className="text-sm text-gray-400 mb-4">
                          Add languages you speak and indicate your proficiency level.
                        </p>
                        <button
                          onClick={() => addArrayItem('languages')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                        >
                          <FaPlus /> Add Your First Language
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {resumeData.languages.map((language, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-gray-900">Language {index + 1}</h4>
                              <button
                                onClick={() => removeArrayItem('languages', index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Remove Language"
                              >
                                <FaTrash />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Language *
                                </label>
                                <input
                                  type="text"
                                  value={language.name || ''}
                                  onChange={(e) => handleArrayFieldChange('languages', index, 'name', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="English"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Proficiency Level
                                </label>
                                <select
                                  value={language.proficiency || ''}
                                  onChange={(e) => handleArrayFieldChange('languages', index, 'proficiency', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select proficiency</option>
                                  <option value="Native">Native</option>
                                  <option value="Fluent">Fluent</option>
                                  <option value="Advanced">Advanced</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Basic">Basic</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center">
                          <button
                            onClick={() => addArrayItem('languages')}
                            className="border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <FaPlus /> Add Another Language
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tips Section */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span> Pro Tips
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use action verbs in descriptions (developed, implemented, led, etc.)</li>
                <li>• Quantify achievements when possible (e.g., "Increased performance by 40%")</li>
                <li>• Tailor your resume for specific job applications</li>
                <li>• Keep descriptions concise and impactful</li>
                <li>• Proofread carefully before saving or downloading</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;