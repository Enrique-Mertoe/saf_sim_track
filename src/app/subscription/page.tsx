"use client"
import { useState } from 'react';
import { CheckCircle, ChevronRight, Shield, CreditCard, Tag, Clock, Users } from 'lucide-react';

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    agreeTerms: false
  });

  const plans = {
    basic: {
      name: 'Basic',
      price: 2999,
      description: 'For small distribution teams',
      features: [
        'Up to 5 team members',
        'Basic SIM card tracking',
        'Limited reporting',
        'Email support'
      ],
      color: 'bg-green-100 text-green-600'
    },
    professional: {
      name: 'Professional',
      price: 4999,
      description: 'For growing distribution networks',
      features: [
        'Up to 20 team members',
        'Advanced SIM tracking',
        'Full reporting suite',
        'Bulk imports & exports',
        'Priority email support',
        'Performance dashboards'
      ],
      color: 'bg-purple-100 text-purple-600',
      popular: true
    },
    enterprise: {
      name: 'Enterprise',
      price: 9999,
      description: 'For large scale operations',
      features: [
        'Unlimited team members',
        'Advanced fraud detection',
        'Custom reporting',
        'API integrations',
        'Dedicated account manager',
        'White-label options',
        '24/7 support'
      ],
      color: 'bg-green-100 text-green-600'
    }
  };

  const handleInputChange = (e:any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e:any) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Intersend API call
    setTimeout(() => {
      setLoading(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  const selectPlan = (plan:any) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
    // Scroll to payment form
    setTimeout(() => {
      //@ts-ignore
      document.getElementById('payment-form').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">

            Thank you for subscribing to our {
            //@ts-ignore
            plans[selectedPlan].name} plan. Your SIM Card Management System is now being set up.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium text-gray-900">Next steps:</p>
            <ul className="mt-2 text-left">
              <li className="flex items-start mt-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Check your email for login credentials</span>
              </li>
              <li className="flex items-start mt-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Complete your team setup</span>
              </li>
              <li className="flex items-start mt-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Import your SIM inventory</span>
              </li>
            </ul>
          </div>
          <button
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Go to Dashboard
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-green-600 flex items-center justify-center text-white font-bold text-xl">SM</div>
              <span className="ml-2 text-xl font-bold text-gray-900">SIMTrack</span>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Features</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Pricing</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Resources</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Contact</a>
          </nav>
          <div className="hidden md:flex items-center space-x-4">
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Sign in</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Simplify your</span>
                  <span className="block text-green-600">SIM card management</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Streamline your distribution operations with our comprehensive SIM tracking system. Manage sales, activations, and performance metrics in one place.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <a
                      href="#pricing"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get started
                    </a>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a
                      href="#"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 md:py-4 md:text-lg md:px-10"
                    >
                      Request demo
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-green-500 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center text-white opacity-90">
            <div className="p-8 max-w-lg">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/20">
                <div className="space-y-4">
                  <div className="h-8 bg-white/30 rounded-md w-3/4"></div>
                  <div className="h-32 bg-white/20 rounded-md"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-white/30 rounded-md w-1/2"></div>
                    <div className="h-8 bg-green-300 rounded-md w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Why choose us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Empower your distribution network
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our SIM Card Management System is designed specifically for Safaricom distributors to optimize their operations.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Team Management</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Easily manage multiple teams, track individual performance, and distribute tasks efficiently.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Fraud Prevention</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Advanced fraud detection and flagging system to protect your business and maintain compliance.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <Tag className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Quality Metrics</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Track quality metrics and performance indicators to optimize your distribution strategy.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <Clock className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Tracking</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Monitor SIM activations, top-ups, and usage in real-time to make informed business decisions.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Pricing</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Plans for every distribution size
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 sm:mx-auto">
              Choose the plan that best fits your business needs. All plans include core SIM tracking features.
            </p>
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
            {Object.entries(plans).map(([key, plan]) => (
              <div key={key} className={`rounded-lg shadow-lg divide-y divide-gray-200 ${selectedPlan === key ? 'ring-2 ring-green-600' : ''}`}>
                <div className="p-6">
                  {
                    //@ts-ignore
                    plan.popular && (
                    <span className="inline-flex px-4 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-green-100 text-green-600 mb-4">
                      Popular
                    </span>
                  )}
                  <h2 className="text-2xl font-semibold text-gray-900">{plan.name}</h2>
                  <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900">KES {plan.price.toLocaleString()}</span>
                    <span className="text-base font-medium text-gray-500">/mo</span>
                  </p>
                  <button
                    onClick={() => selectPlan(key)}
                    className={`mt-8 block w-full bg-${selectedPlan === key ? 'indigo-600 hover:bg-green-700 text-white' : 'white hover:bg-gray-50 text-green-600 border border-green-600'} rounded-md py-2 text-sm font-semibold text-center`}
                  >
                    {selectedPlan === key ? 'Selected' : 'Select'} {plan.name}
                  </button>
                </div>
                <div className="pt-6 pb-8 px-6">
                  <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex space-x-3">
                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                        <span className="text-sm text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div id="payment-form" className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Complete your subscription</h2>
                <p className="mt-2 text-sm text-gray-600">
                  You've selected the <span className="font-medium">{
                    //@ts-ignore
                    plans[selectedPlan].name}</span> plan at KES {plans[selectedPlan].price.toLocaleString()} per month
                </p>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-8">
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full name</label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone number</label>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="e.g. 07xxxxxxxx"
                        />
                      </div>
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company name</label>
                        <input
                          type="text"
                          name="company"
                          id="company"
                          required
                          value={formData.company}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
                    <p className="mt-1 text-sm text-gray-500">Secured by Intersend Payment Gateway</p>

                    <div className="mt-6">
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium text-gray-700">Payment Methods</span>
                          <div className="flex space-x-2">
                            <div className="h-6 w-10 bg-green-100 rounded flex items-center justify-center text-xs font-bold text-green-800">VISA</div>
                            <div className="h-6 w-10 bg-red-100 rounded flex items-center justify-center text-xs font-bold text-red-800">MC</div>
                            <div className="h-6 w-10 bg-green-100 rounded flex items-center justify-center text-xs font-bold text-green-800">M-PESA</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card number</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <input
                                type="text"
                                name="cardNumber"
                                id="cardNumber"
                                required
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                className="block w-full pr-10 border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="XXXX XXXX XXXX XXXX"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">Expiration date</label>
                              <input
                                type="text"
                                name="expiry"
                                id="expiry"
                                required
                                value={formData.expiry}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="MM / YY"
                              />
                            </div>
                            <div>
                              <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                              <input
                                type="text"
                                name="cvc"
                                id="cvc"
                                required
                                value={formData.cvc}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="123"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center">
                        <input
                          id="agreeTerms"
                          name="agreeTerms"
                          type="checkbox"
                          required
                          checked={formData.agreeTerms}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
                          I agree to the <a href="#" className="text-green-600 hover:text-green-500">Terms of Service</a> and <a href="#" className="text-green-600 hover:text-green-500">Privacy Policy</a>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="bg-gray-50 p-4 rounded-md mb-6">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Subtotal</p>
                        <p>KES {
                          //@ts-ignore
                          plans[selectedPlan].price.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <p>Tax (16% VAT)</p>
                        <p>KES {
                          //@ts-ignore
                          (plans[selectedPlan].price * 0.16).toLocaleString()}</p>
                      </div>
                      <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between text-lg font-medium text-gray-900">
                        <p>Total</p>
                        <p>KES {
                          //@ts-ignore
                          (plans[selectedPlan].price * 1.16).toLocaleString()}</p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                        loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          Complete Subscription
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </span>
                      )}
                    </button>

                    <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span>Secure payment processing by Intersend</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Trusted by distributors nationwide
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-xl font-bold text-green-600">JN</div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold">Jane Njoroge</h4>
                  <p className="text-sm text-gray-600">Sales Director, KenyaTel Distributors</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">
                  "This system has completely transformed how we manage our SIM card distribution. The performance tracking helps us identify top performers and areas that need improvement. It's easy to use and the reports are invaluable."
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-xl font-bold text-green-600">DM</div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold">David Mutua</h4>
                  <p className="text-sm text-gray-600">Operations Manager, Eastlands Distribution</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">
                  "The fraud detection feature has saved us millions in potential losses. The onboarding system makes it easy to manage our growing team, and the support team is always responsive when we need assistance."
                </p>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-600">SO</div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold">Sarah Otieno</h4>
                  <p className="text-sm text-gray-600">Team Leader, Western Connect</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(4)].map((_, i) => (
                    <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <svg className="h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  "My team's performance improved by 35% after implementing this system. The real-time tracking allows us to make quick adjustments to our sales strategy, and the quality metrics keep us focused on sustainable growth."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Frequently asked questions</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Common questions about our subscription
            </p>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Everything you need to know about the platform and billing.
            </p>
          </div>
          <div className="mt-12">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">How does the billing cycle work?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  Your subscription starts the day you sign up and will be renewed every 30 days. You can upgrade, downgrade or cancel at any time from your account settings.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Can I change plans later?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and applied to your next billing cycle.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">How secure is my payment information?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  All payment information is securely processed through Intersend's PCI-compliant payment gateway. Your card details are never stored on our servers.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">What payment methods do you accept?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  We accept all major credit cards (Visa, Mastercard), M-Pesa, and bank transfers for annual subscriptions.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Is there a free trial available?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  Yes, we offer a 14-day free trial on all plans. No credit card is required to start your trial. You'll only be charged once you decide to continue with a paid subscription.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Do you offer custom enterprise solutions?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  Absolutely! For large distributors with specific needs, our team can create custom solutions. Contact our sales team to discuss your requirements.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Integration Partners */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Our Partners</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Integrated with trusted services
            </p>
          </div>
          <div className="mt-8 flex justify-center space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-32 h-16 bg-white shadow rounded-lg flex items-center justify-center">
                <div className="text-xl font-bold text-gray-700">Intersend</div>
              </div>
              <span className="mt-2 text-sm text-gray-500">Payments</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-16 bg-white shadow rounded-lg flex items-center justify-center">
                <div className="text-xl font-bold text-green-600">M-PESA</div>
              </div>
              <span className="mt-2 text-sm text-gray-500">Mobile Money</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-16 bg-white shadow rounded-lg flex items-center justify-center">
                <div className="text-xl font-bold text-green-600">Safaricom</div>
              </div>
              <span className="mt-2 text-sm text-gray-500">API Integration</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-16 bg-white shadow rounded-lg flex items-center justify-center">
                <div className="text-xl font-bold text-purple-600">AWS</div>
              </div>
              <span className="mt-2 text-sm text-gray-500">Cloud Hosting</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to streamline your operations?</span>
            <span className="block text-green-200">Start your free trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50"
              >
                Get started
              </a>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="#"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 bg-opacity-60 hover:bg-opacity-70"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-md bg-green-500 flex items-center justify-center text-white font-bold text-xl">SM</div>
                <span className="ml-2 text-xl font-bold text-white">SIMTrack</span>
              </div>
              <p className="text-gray-300 text-base">
                The complete SIM card management solution for distributors. Track sales, activations, and performance with ease.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Platform</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Features</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Pricing</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Security</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">API Documentation</a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Support</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Help Center</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Contact Us</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Training</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Status</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Company</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">About</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Blog</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Partners</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Careers</a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Legal</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Privacy Policy</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Terms of Service</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">Cookie Policy</a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-400 hover:text-white">GDPR Compliance</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2025 SIMTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}