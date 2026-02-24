import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaCrown, FaStar, FaRocket, FaGem, FaCalendarAlt, FaCreditCard, FaShieldAlt, FaSync } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = loadStripe('pk_test_51RjuoqCVUlGphES0o97oDdzJ9Rgwi6FDvK45nbkvoQq8vIaBx8barAqg1j6iAGgyG0f17leAhlp3PKAjluWDS8Vw00UZecxcXo');

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className={`fixed top-4 right-4 ${bgColor} border ${borderColor} text-white px-6 py-4 rounded-2xl shadow-lg z-50 max-w-sm`}
    >
      <div className="flex items-center space-x-3">
        {type === 'success' ? (
          <FaCheck className="text-xl flex-shrink-0" />
        ) : (
          <FaTimes className="text-xl flex-shrink-0" />
        )}
        <span className="font-semibold">{message}</span>
      </div>
    </motion.div>
  );
};

const PaymentModal = ({ isOpen, onClose, plan, billingCycle, user, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create payment intent on backend
            const response = await fetch('http://localhost:5000/api/payments/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: plan.name,
                    billingCycle: billingCycle,
                    amount: billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
                    userId: user?.uid,
                    userEmail: user?.email
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create payment intent');
            }

            const { clientSecret, paymentIntentId } = data;

            // Confirm payment with Stripe
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        email: user?.email,
                        name: user?.displayName || 'Customer',
                    },
                },
            });

            if (result.error) {
                setError(result.error.message);
            } else {
                // Payment successful - confirm with backend
                const confirmResponse = await fetch('http://localhost:5000/api/payments/confirm-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntentId,
                        userId: user?.uid,
                        plan: plan.name
                    }),
                });

                const confirmData = await confirmResponse.json();

                if (confirmData.success) {
                    onPaymentSuccess(`🎉 Payment successful! Your ${plan.name} package has been activated.`);
                    onClose();
                } else {
                    throw new Error(confirmData.message || 'Failed to update package');
                }
            }
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
            console.error('Payment error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-transparent backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-3 border-blue-300 rounded-3xl p-8 max-w-md w-full"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Complete Your Payment
                </h2>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Plan:</span>
                        <span className="font-bold">{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">Billing:</span>
                        <span className="font-bold">
                            ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice} /
                            {billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Details
                        </label>
                        <div className="border border-gray-300 rounded-2xl p-3">
                            <CardElement
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                    },
                                    hidePostalCode: true
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!stripe || loading}
                            className="flex-1 py-3 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : `Pay $${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}`}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                        <FaShieldAlt className="text-green-500" />
                        <span className="text-sm">Secure payment powered by Stripe</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const Payment = () => {
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [selectedPlan, setSelectedPlan] = useState('basic');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [userData, setUserData] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const hideToast = () => {
        setToast({ ...toast, show: false });
    };

    // Fetch user data from backend
    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                try {
                    const response = await fetch(`http://localhost:5000/api/users/${user.uid}`);
                    const data = await response.json();
                    if (data.success) {
                        setUserData(data.user);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();
    }, [user]);

    const plans = {
        basic: {
            name: "Basic",
            icon: FaStar,
            description: "Perfect for getting started",
            monthlyPrice: 0,
            yearlyPrice: 0,
            features: {
                included: [
                    "AI Resume Analysis (Basic)",
                    "ATS Score Check (Limited)",
                    "5 Mock Interview Questions",
                    "Basic CV Templates",
                    "Email Support"
                ],
                excluded: [
                    "Advanced AI Recommendations",
                    "Unlimited ATS Analysis",
                    "Full Mock Interviews",
                    "Priority Support",
                    "Custom CV Designs"
                ]
            },
            popular: false,
            color: "gray"
        },
        standard: {
            name: "Standard",
            icon: FaRocket,
            description: "For serious job seekers",
            monthlyPrice: 9.99,
            yearlyPrice: 99.99,
            features: {
                included: [
                    "AI Resume Analysis (Advanced)",
                    "Unlimited ATS Score Checks",
                    "Full Mock Interviews (3 per month)",
                    "Professional CV Templates",
                    "AI-powered Cover Letters",
                    "Career Insights Home"
                ],
                excluded: [
                    "Custom Career Coaching",
                    "1-on-1 Expert Sessions",
                    "LinkedIn Optimization",
                    "Interview Performance Analytics"
                ]
            },
            popular: true,
            color: "blue"
        },
        premium: {
            name: "Premium",
            icon: FaCrown,
            description: "Complete career transformation",
            monthlyPrice: 19.99,
            yearlyPrice: 199.99,
            features: {
                included: [
                    "Everything in Standard",
                    "Unlimited Mock Interviews",
                    "AI Career Path Planning",
                    "1-on-1 Career Coaching Sessions",
                    "LinkedIn Profile Optimization",
                    "Interview Performance Analytics",
                    "Custom Resume & CV Designs",
                    "Priority Phone & Chat Support",
                    "Job Application Tracker",
                    "Salary Negotiation Guide"
                ],
                excluded: []
            },
            popular: false,
            color: "purple"
        }
    };

    const calculateSavings = (monthlyPrice, yearlyPrice) => {
        const yearlyFromMonthly = monthlyPrice * 12;
        return yearlyFromMonthly - yearlyPrice;
    };

    const handleSubscribe = (planKey) => {
        const plan = plans[planKey];

        if (planKey === 'basic') {
            // For free plan, update user package directly
            updateUserPackage('basic');
        } else {
            setSelectedPlan(planKey);
            setCurrentPlan(plan);
            setShowPaymentModal(true);
        }
    };

    const updateUserPackage = async (packageName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/${user.uid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    package: packageName.toLowerCase()
                }),
            });

            const data = await response.json();

            if (data.success) {
                showToast(`✨ Package updated to ${packageName}! Enjoy your new features.`);
                setUserData(data.user);
            } else {
                throw new Error(data.message || 'Failed to update package');
            }
        } catch (error) {
            console.error('Error updating package:', error);
            showToast('Failed to update package. Please try again.', 'error');
        }
    };

    const handlePaymentSuccess = (message) => {
        showToast(message);
        // Refresh user data to show updated package
        const fetchUserData = async () => {
            if (user?.uid) {
                try {
                    const response = await fetch(`http://localhost:5000/api/users/${user.uid}`);
                    const data = await response.json();
                    if (data.success) {
                        setUserData(data.user);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };
        fetchUserData();
    };

    const getColorClasses = (color, type) => {
        const colorMap = {
            gray: {
                bg: 'bg-gray-100',
                text: 'text-gray-500',
                bgLight: 'bg-gray-100',
                button: 'bg-gray-500 hover:bg-gray-600'
            },
            blue: {
                bg: 'bg-blue-100',
                text: 'text-blue-500',
                bgLight: 'bg-blue-100',
                button: 'bg-blue-500 hover:bg-blue-600'
            },
            purple: {
                bg: 'bg-purple-100',
                text: 'text-purple-500',
                bgLight: 'bg-purple-100',
                button: 'bg-purple-500 hover:bg-purple-600'
            }
        };
        return colorMap[color]?.[type] || colorMap.gray[type];
    };

    return (
        <Elements stripe={stripePromise}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
                <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Toast Notification */}
                    {toast.show && (
                        <Toast 
                            message={toast.message} 
                            type={toast.type} 
                            onClose={hideToast} 
                        />
                    )}

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Choose Your Career Success Plan
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Unlock your potential with AI-powered career tools. Start free, upgrade as you grow.
                        </p>
                        
                        {/* Current Package Display */}
                        {userData && (
                            <div className="mt-6 inline-block bg-white rounded-2xl px-6 py-3 shadow-lg border border-gray-200">
                                <span className="text-gray-600">Current Package: </span>
                                <span className="font-bold text-blue-600 capitalize">{userData.package || 'basic'}</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Billing Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center mb-12"
                    >
                        <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${billingCycle === 'monthly'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 relative ${billingCycle === 'yearly'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Yearly
                                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                        Save 17%
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Pricing Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 my-16"
                    >
                        {Object.entries(plans).map(([key, plan]) => {
                            const IconComponent = plan.icon;
                            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                            const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);
                            const isCurrentPlan = userData?.package === key;

                            return (
                                <motion.div
                                    key={key}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    className={`relative bg-white rounded-3xl my-3 shadow-xl border-2 transition-all duration-300 ${isCurrentPlan ? 'border-green-500 ring-4 ring-green-100' : selectedPlan === key ? 'border-blue-500' : 'border-transparent'
                                        } ${plan.popular ? 'transform scale-105' : ''}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-blue-500 text-white px-6 py-2 rounded-full shadow-lg">
                                                <span className="font-semibold text-xs md:text-sm">MOST POPULAR</span>
                                            </div>
                                        </div>
                                    )}

                                    {isCurrentPlan && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-green-500 text-white px-6 py-2 rounded-full shadow-lg">
                                                <span className="font-semibold text-xs md:text-sm">CURRENT PLAN</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8">
                                        {/* Plan Header */}
                                        <div className="text-center mb-8">
                                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${getColorClasses(plan.color, 'bg')} ${getColorClasses(plan.color, 'text')} mb-4`}>
                                                <IconComponent className="text-2xl" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                            <p className="text-gray-600">{plan.description}</p>
                                        </div>

                                        {/* Price */}
                                        <div className="text-center mb-6">
                                            <div className="flex items-baseline justify-center">
                                                <span className="text-4xl font-bold text-gray-900">${price}</span>
                                                {price > 0 && (
                                                    <span className="text-gray-600 ml-2">
                                                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                                                    </span>
                                                )}
                                            </div>
                                            {billingCycle === 'yearly' && price > 0 && (
                                                <p className="text-green-600 font-semibold mt-2">
                                                    Save ${savings.toFixed(2)} yearly
                                                </p>
                                            )}
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-4 mb-8">
                                            <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                                            {plan.features.included.map((feature, index) => (
                                                <div key={index} className="flex items-center">
                                                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700">{feature}</span>
                                                </div>
                                            ))}
                                            {plan.features.excluded.map((feature, index) => (
                                                <div key={index} className="flex items-center opacity-50">
                                                    <FaTimes className="text-gray-400 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-600">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => handleSubscribe(key)}
                                            disabled={isCurrentPlan}
                                            className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${isCurrentPlan
                                                ? 'bg-green-500 text-white cursor-default'
                                                : key === 'basic'
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : `${getColorClasses(plan.color, 'button')} text-white shadow-md hover:shadow-lg`
                                                }`}
                                        >
                                            {isCurrentPlan
                                                ? 'Current Plan'
                                                : key === 'basic'
                                                    ? 'Get Started Free'
                                                    : `Choose ${plan.name}`
                                            }
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Security Badge */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center mt-12"
                    >
                        <div className="flex items-center justify-center space-x-4 text-gray-600 flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                                <FaShieldAlt className="text-2xl" />
                                <span className="font-semibold">Secure Payment · 256-bit SSL Encryption</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <FaSync className="text-2xl" />
                                <span className="font-semibold">Cancel Anytime · No Questions Asked</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && currentPlan && (
                    <PaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        plan={currentPlan}
                        billingCycle={billingCycle}
                        user={user}
                        onPaymentSuccess={handlePaymentSuccess}
                    />
                )}
            </div>
        </Elements>
    );
};

export default Payment;