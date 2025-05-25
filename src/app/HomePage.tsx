"use client"
import {useEffect, useState} from "react";
import {motion} from "framer-motion";

export default function Home() {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            title: "SIM Tracking",
            description: "Real-time tracking of SIM card sales and activations",
            icon: "📊",
            color: "from-blue-500 to-blue-600"
        },
        {
            title: "Team Analytics",
            description: "Performance metrics and quality monitoring",
            icon: "👥",
            color: "from-green-500 to-green-600"
        },
        {
            title: "Quality Control",
            description: "Fraud prevention and quality assurance",
            icon: "🛡️",
            color: "from-purple-500 to-purple-600"
        },
        {
            title: "Easy Reports",
            description: "Automated reporting and data insights",
            icon: "📈",
            color: "from-orange-500 to-orange-600"
        }
    ];

    const stats = [
        {value: "99.8%", label: "Uptime", icon: "⚡"},
        {value: "5M+", label: "SIMs Tracked", icon: "📱"},
        {value: "500+", label: "Active Teams", icon: "🏢"},
        {value: "93%", label: "Quality Rate", icon: "✨"}
    ];

    const steps = [
        {title: "Upload SIMs", desc: "Bulk upload SIM card data", icon: "📤"},
        {title: "Track Status", desc: "Monitor activations live", icon: "📍"},
        {title: "Check Quality", desc: "Automated quality checks", icon: "🔍"},
        {title: "Get Reports", desc: "Instant performance reports", icon: "📋"}
    ];

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
                className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
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
                            SIM Card Management
                            <span className="block text-blue-400">Made Simple</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
                            Track, manage, and optimize your SIM operations with real-time insights and automated
                            reporting
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.a
                                href={"/accounts/login"}

                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-sm cursor-pointer font-semibold text-lg shadow-lg transition-all duration-300"
                            >
                                Start Free Trial
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

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                    className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 h-full">
                                    <div
                                        className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
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
                                            className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-lg">
                                            {step.icon}
                                        </div>
                                        <div
                                            className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
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
                                quote: "Increased our quality metrics by 35% in just 3 months. The real-time tracking is game-changing.",
                                author: "Sarah Johnson",
                                role: "Team Leader, Safaricom",
                                avatar: "👩‍💼"
                            },
                            {
                                quote: "The reporting features save us hours every week. Everything we need in one dashboard.",
                                author: "Michael Ndung'u",
                                role: "Distribution Manager",
                                avatar: "👨‍💼"
                            },
                            {
                                quote: "Simple to use, powerful features. Our team was up and running in minutes.",
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

            {/* CTA - Clean */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        className="text-center text-white"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Ready to Transform Your SIM Management?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join hundreds of teams already using our platform to streamline their operations
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.a
                                href={"/accounts/login"}

                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-sm cursor-pointer font-semibold text-lg shadow-lg transition-all duration-300"
                            >
                                Start Free Trial
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
        </div>
    );
}