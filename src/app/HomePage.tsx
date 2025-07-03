"use client"
import {useEffect, useState} from "react";
import {motion} from "framer-motion";
import {BarChart3, Bot, MessageCircle, Mic, MicOff, Shield, Sparkles, TrendingUp, Users} from "lucide-react";

export default function Home() {
    const [activeFeature, setActiveFeature] = useState(0);
    const [showAIDemo, setShowAIDemo] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [liveStats, setLiveStats] = useState(null);
    const [aiDemoMessages, setAiDemoMessages] = useState([
        { type: 'ai', content: '👋 Hi! I\'m **Mantix AI**, your intelligent SIM management copilot. Ask me anything!' }
    ]);
    const [demoInput, setDemoInput] = useState('');

    const features = [
        {
            title: "🤖 AI-Powered Insights",
            description: "Mantix AI analyzes your data and provides intelligent recommendations",
            icon: <Bot className="w-8 h-8" />,
            color: "from-blue-500 to-indigo-600",
            isAI: true
        },
        {
            title: "📊 Smart SIM Tracking",
            description: "AI-enhanced real-time tracking with predictive analytics",
            icon: <BarChart3 className="w-8 h-8" />,
            color: "from-green-500 to-green-600"
        },
        {
            title: "👥 Intelligent Team Analytics",
            description: "AI-driven performance insights and quality monitoring",
            icon: <Users className="w-8 h-8" />,
            color: "from-purple-500 to-purple-600"
        },
        {
            title: "🛡️ AI Quality Control",
            description: "Automated fraud detection with machine learning",
            icon: <Shield className="w-8 h-8" />,
            color: "from-red-500 to-red-600"
        },
        {
            title: "📈 Predictive Reports",
            description: "AI-generated reports with trend forecasting",
            icon: <TrendingUp className="w-8 h-8" />,
            color: "from-orange-500 to-orange-600"
        },
        {
            title: "💬 Natural Language Queries",
            description: "Ask questions in plain English and get instant answers",
            icon: <MessageCircle className="w-8 h-8" />,
            color: "from-teal-500 to-cyan-600"
        }
    ];

    const stats = [
        {value: "99.8%", label: "AI Accuracy", icon: "🎯"},
        {value: "5M+", label: "AI Queries Processed", icon: "🤖"},
        {value: "500+", label: "AI-Powered Teams", icon: "🚀"},
        {value: "85%", label: "Efficiency Boost", icon: "⚡"}
    ];

    const steps = [
        {title: "Ask Mantix AI", desc: "Natural language queries", icon: "🤖"},
        {title: "Get Insights", desc: "AI analyzes your data", icon: "🧠"},
        {title: "Take Action", desc: "Smart recommendations", icon: "⚡"},
        {title: "Track Results", desc: "AI-powered monitoring", icon: "📊"}
    ];

    // AI Demo Functions
    //@ts-ignore
    const handleAIDemoMessage = (message) => {
        setAiDemoMessages(prev => [...prev, { type: 'user', content: message }]);
        
        // Simulate AI response
        setTimeout(() => {
            const responses = [
                "📊 I found 1,247 active SIM cards with 94.2% activation rate. Your team is performing excellently!",
                "🎯 Based on your data, I recommend focusing on the Northern region - it shows 23% growth potential.",
                "⚡ Your current efficiency is 89%. I can help optimize your routes to reach 95%+",
                "🚀 Great question! Your top performing team leader is Sarah with 97% quality score."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setAiDemoMessages(prev => [...prev, { type: 'ai', content: randomResponse }]);
        }, 1500);
        
        setDemoInput('');
    };

    const startVoiceInput = () => {
        setIsListening(true);
        // Simulate voice input
        setTimeout(() => {
            setIsListening(false);
            handleAIDemoMessage("Show me today's SIM activation performance");
        }, 2000);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Compact */}
            <section
                className="relative bg-gradient-to-br from-slate-900 via-green-900 to-indigo-900 text-white overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
                </div>

                <div className="relative container mx-auto px-6 py-20">
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            AI-Powered SIM Management
                            <span className="block text-green-400 flex items-center justify-center gap-3">
                                Made Intelligent
                                <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-yellow-400 animate-pulse" />
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
                            Meet <strong className="text-green-400">Mantix AI</strong> - your intelligent copilot that understands natural language, 
                            provides instant insights, and optimizes your SIM operations automatically
                        </p>

                        {/* AI Demo Preview */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-2xl mx-auto border border-white/20"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Bot className="w-6 h-6 text-green-400" />
                                <span className="text-green-400 font-semibold">Try Mantix AI</span>
                                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">LIVE DEMO</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm text-slate-300 mb-3">Ask me anything about SIM management:</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleAIDemoMessage("What's my team's performance today?")}
                                        className="text-xs bg-green-600/20 text-green-300 px-3 py-2 rounded-lg hover:bg-green-600/30 transition-colors"
                                    >
                                        📊 Team Performance
                                    </button>
                                    <button 
                                        onClick={() => handleAIDemoMessage("Show me SIM activation trends")}
                                        className="text-xs bg-blue-600/20 text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-600/30 transition-colors"
                                    >
                                        📈 Activation Trends
                                    </button>
                                    <button 
                                        onClick={() => setShowAIDemo(true)}
                                        className="text-xs bg-purple-600/20 text-purple-300 px-3 py-2 rounded-lg hover:bg-purple-600/30 transition-colors"
                                    >
                                        💬 Full Demo
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.a
                                href={"/subscribe"}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-sm cursor-pointer font-semibold text-lg shadow-lg transition-all duration-300"
                            >
                                Choose plan
                            </motion.a>
                            <motion.a
                                href={"/accounts/login"}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-sm cursor-pointer font-semibold text-lg shadow-lg transition-all duration-300"
                            >
                                Sign in
                            </motion.a>
                            <motion.a
                                href={"/app-download"}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-sm cursor-pointer font-semibold text-lg shadow-lg transition-all duration-300 flex items-center gap-2"
                            >
                                <span className="text-xl">📱</span> Get Mobile App
                            </motion.a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats - Compact */}
            <section className="py-16 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{opacity: 0, y: 20}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{delay: index * 0.1}}
                                className="bg-white p-6 rounded-2xl shadow-sm text-center hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="text-3xl mb-2">{stat.icon}</div>
                                <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-slate-600 text-sm">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features - More Visual */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Powerful features designed for modern SIM card management
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{opacity: 0, y: 30}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{delay: index * 0.1}}
                                className="group"
                            >
                                <div
                                    className={`bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 h-full relative overflow-hidden ${
                                        feature.isAI ? 'ring-2 ring-green-500/20' : ''
                                    }`}
                                >
                                    {feature.isAI && (
                                        <div className="absolute top-4 right-4">
                                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> AI
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                                    
                                    {feature.isAI && (
                                        <button 
                                            onClick={() => setShowAIDemo(true)}
                                            className="mt-4 text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all"
                                        >
                                            Try it now <Bot className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works - Streamlined */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-slate-600">
                            Get started in minutes, not hours
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{opacity: 0, y: 30}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{delay: index * 0.2}}
                                    className="text-center"
                                >
                                    <div className="relative mb-6">
                                        <div
                                            className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-lg">
                                            {step.icon}
                                        </div>
                                        <div
                                            className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                                    <p className="text-slate-600 text-sm">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof - Compact */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Trusted by Teams Worldwide
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                quote: "Mantix AI revolutionized our operations! It predicted a 23% efficiency boost and delivered exactly that. Our team now saves 4 hours daily.",
                                author: "Sarah Johnson",
                                role: "Team Leader, Safaricom",
                                avatar: "👩‍💼"
                            },
                            {
                                quote: "I just ask Mantix AI 'Show me regional performance' and get instant insights. No more manual reports - the AI does everything!",
                                author: "Michael Ndung'u",
                                role: "Distribution Manager",
                                avatar: "👨‍💼"
                            },
                            {
                                quote: "The AI catches quality issues before we even notice them. It's like having a brilliant analyst working 24/7 for our team.",
                                author: "Alice Kamau",
                                role: "Operations Director",
                                avatar: "👩‍💻"
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{opacity: 0, y: 30}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{delay: index * 0.1}}
                                className="bg-slate-50 p-8 rounded-2xl"
                            >
                                <div className="text-4xl mb-4">💬</div>
                                <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{testimonial.avatar}</div>
                                    <div>
                                        <div className="font-semibold text-slate-900">{testimonial.author}</div>
                                        <div className="text-sm text-slate-600">{testimonial.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile App Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Take SIM Management Mobile
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Our Android app puts the power of SIM Manager in your pocket
                        </p>
                    </motion.div>

                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <motion.div
                            initial={{opacity: 0, x: -30}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true}}
                            className="md:w-1/2 flex justify-center"
                        >
                            <div className="relative">
                                {/* Phone mockup */}
                                <div className="w-64 h-[500px] bg-slate-800 rounded-[36px] p-3 shadow-2xl relative overflow-hidden border-8 border-slate-700">
                                    <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 rounded-t-[28px] flex justify-center items-start pt-1">
                                        <div className="w-24 h-4 bg-slate-900 rounded-full"></div>
                                    </div>
                                    <div className="w-full h-full bg-gradient-to-br from-green-600 to-indigo-600 rounded-[24px] flex items-center justify-center overflow-hidden">
                                        <div className="text-white text-center p-6">
                                            <div className="text-5xl mb-4">📱</div>
                                            <h3 className="text-xl font-bold mb-2">SIM Manager</h3>
                                            <p className="text-green-100 text-sm">Mobile Experience</p>
                                            <div className="mt-8 grid grid-cols-2 gap-3">
                                                {["📊", "📈", "🔔", "⚙️"].map((icon, i) => (
                                                    <div key={i} className="bg-white/10 p-3 rounded-lg">
                                                        <div className="text-2xl">{icon}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative elements */}
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-green-100 rounded-full opacity-70 z-[-1]"></div>
                                <div className="absolute -top-4 -left-4 w-16 h-16 bg-indigo-100 rounded-full opacity-70 z-[-1]"></div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{opacity: 0, x: 30}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true}}
                            transition={{delay: 0.2}}
                            className="md:w-1/2"
                        >
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Why Go Mobile?</h3>
                                    <ul className="space-y-4">
                                        {[
                                            {icon: "🚀", text: "Access your SIM data from anywhere, anytime"},
                                            {icon: "🔔", text: "Receive instant notifications on important events"},
                                            {icon: "📊", text: "View real-time performance metrics on the go"},
                                            {icon: "🔄", text: "Seamlessly sync between desktop and mobile"}
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <span className="text-2xl">{item.icon}</span>
                                                <span className="text-slate-700">{item.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <motion.div
                                    whileHover={{scale: 1.03}}
                                    whileTap={{scale: 0.98}}
                                    className="mt-8"
                                >
                                    <a 
                                        href="/app-download" 
                                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300"
                                    >
                                        <span className="text-xl">📲</span>
                                        Download Our Android App
                                    </a>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA - Clean */}
            <section className="py-20 bg-gradient-to-r from-green-600 to-indigo-600">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        className="text-center text-white"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center justify-center gap-3">
                            Ready for AI-Powered SIM Management?
                            <Bot className="w-8 h-8 md:w-10 md:h-10 text-green-300" />
                        </h2>
                        <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
                            Join hundreds of teams already using <strong>Mantix AI</strong> to get instant insights, 
                            automate reports, and optimize operations with natural language commands
                        </p>
                        
                        {/* AI Features Highlight */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
                            <div className="text-center">
                                <MessageCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                <p className="text-green-100">Ask questions in plain English</p>
                            </div>
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                <p className="text-green-100">Get predictive insights</p>
                            </div>
                            <div className="text-center">
                                <Sparkles className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                <p className="text-green-100">Automate complex tasks</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.a
                                href={"/subscribe"}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-sm cursor-pointer font-semibold text-lg shadow-lg transition-all duration-300"
                            >
                                Choose plan
                            </motion.a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-8 md:mb-0">
                            <h3 className="text-2xl font-bold mb-2">SIM Manager</h3>
                            <p className="text-slate-400">Streamlined SIM card management for modern teams</p>
                        </div>
                        <div className="flex space-x-6">
                            {['Privacy', 'Terms', 'Support', 'Contact'].map((link) => (
                                <a key={link} href="#" className="text-slate-400 hover:text-white transition-colors">
                                    {link}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
                        <p>&copy; 2025 SIM Manager. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* AI Demo Modal */}
            {showAIDemo && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowAIDemo(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Demo Header */}
                        <div className="bg-gradient-to-r from-green-600 to-indigo-600 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bot className="w-6 h-6" />
                                <div>
                                    <h3 className="font-semibold">Mantix AI Demo</h3>
                                    <p className="text-xs opacity-80">Try the AI assistant</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAIDemo(false)}
                                className="text-white/80 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Demo Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4">
                            {aiDemoMessages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-lg ${
                                        msg.type === 'user' 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Demo Input */}
                        <div className="border-t p-4">
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={demoInput}
                                    onChange={(e) => setDemoInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && demoInput.trim() && handleAIDemoMessage(demoInput)}
                                    placeholder="Ask about SIM management..."
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    onClick={startVoiceInput}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isListening ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => demoInput.trim() && handleAIDemoMessage(demoInput)}
                                    disabled={!demoInput.trim()}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>
                            
                            {/* Quick Demo Actions */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[
                                    "Show team performance",
                                    "What's my SIM activation rate?",
                                    "Generate weekly report",
                                    "Find top performing regions"
                                ].map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAIDemoMessage(prompt)}
                                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-3 text-center">
                                <p className="text-xs text-gray-500">
                                    This is a demo. <a href="/accounts/login" className="text-green-600 hover:text-green-700">Sign up</a> to access the full AI assistant.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
