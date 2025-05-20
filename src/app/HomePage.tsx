// File: app/page.tsx
"use client";

import {useEffect, useState, useRef} from "react";
import {motion, useScroll, useTransform} from "framer-motion";

export default function Home() {
    const [activeFeature, setActiveFeature] = useState(0);
    const features = [
        {
            title: "SIM Management",
            description: "Track SIM card sales, activations, and performance metrics.",
            icon: "chart-bar",
        },
        {
            title: "Team Performance",
            description: "Monitor team metrics and quality targets with real-time reporting.",
            icon: "users",
        },
        {
            title: "User Onboarding",
            description: "Streamlined process for adding team members with role-based access.",
            icon: "user-plus",
        },
        {
            title: "Quality Control",
            description: "Advanced metrics to ensure high-quality activations and fraud prevention.",
            icon: "shield-check",
        },
    ];

    const dashboardRef = useRef(null);
    const {scrollYProgress} = useScroll({
        target: dashboardRef,
        offset: ["start end", "end start"],
    });

    const dashboardScale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
    const dashboardOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [features.length]);
    const [blobs, setBlobs] = useState<any[]>([])
    useEffect(() => {
        const newBlobs = Array.from({length: 20}).map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 300 + 50}px`,
            height: `${Math.random() * 300 + 50}px`,
            opacity: Math.random() * 0.4,
            animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
        }))
        setBlobs(newBlobs)
    }, [])

    return (
        <main className="overflow-x-hidden">
            {/* Hero Section */}
            <section
                className="relative h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-indigo-900 overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                    <div className="absolute top-0 left-0 w-full h-full">
                        {blobs.map((style, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full bg-white/10"
                                style={{
                                    ...style,
                                    filter: 'blur(50px)',
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="container mx-auto px-6 z-10">
                    <motion.div
                        initial={{opacity: 0, y: 50}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.8}}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                            SIM Card Management System
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-10">
                            Track, manage, and optimize your SIM card sales and activations with our comprehensive
                            solution
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                onClick={e => {
                                    location.href = "/dashboard"
                                }}
                                className="bg-white text-green-900 font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                Get Started
                            </motion.button>
                            <motion.button
                                 onClick={e => {
                                    location.href = "/soon"
                                }}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-white/10 transition-all duration-300"
                            >
                                Book Demo
                            </motion.button>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{opacity: 0, y: 100}}
                    animate={{opacity: 0.7, y: 0}}
                    transition={{delay: 0.5, duration: 0.8}}
                    className="absolute bottom-0 w-full flex justify-center"
                >
                    <div className="animate-bounce mb-8 text-white">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </div>
                </motion.div>
            </section>

            {/* Stats Section */}
            <section className="bg-white py-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {value: "99.8%", label: "Uptime"},
                            {value: "5M+", label: "SIM Cards Tracked"},
                            {value: "500+", label: "Teams Using Our System"},
                            {value: "93%", label: "Average Quality Rate"},
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{opacity: 0, y: 30}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{delay: index * 0.1, duration: 0.5}}
                                className="bg-gradient-to-br from-green-50 to-indigo-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <h2 className="text-4xl font-bold text-green-900 mb-2">{stat.value}</h2>
                                <p className="text-gray-600 text-lg">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Everything you need to manage your SIM card sales and activations efficiently
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="space-y-8">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{opacity: 0, x: -50}}
                                        whileInView={{opacity: 1, x: 0}}
                                        viewport={{once: true}}
                                        transition={{delay: index * 0.1, duration: 0.5}}
                                        className={`cursor-pointer p-6 rounded-xl transition-all duration-300 ${
                                            activeFeature === index
                                                ? "bg-green-700 text-white shadow-lg"
                                                : "bg-white hover:bg-green-50 shadow-md"
                                        }`}
                                        onClick={() => setActiveFeature(index)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`p-3 rounded-lg ${
                                                    activeFeature === index ? "bg-white/20" : "bg-green-100"
                                                }`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`h-6 w-6 ${
                                                        activeFeature === index ? "text-white" : "text-green-700"
                                                    }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    {feature.icon === "chart-bar" && (
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                        />
                                                    )}
                                                    {feature.icon === "users" && (
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                        />
                                                    )}
                                                    {feature.icon === "user-plus" && (
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                                        />
                                                    )}
                                                    {feature.icon === "shield-check" && (
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                        />
                                                    )}
                                                </svg>
                                            </div>
                                            <div>
                                                <h3
                                                    className={`text-xl font-bold mb-2 ${
                                                        activeFeature === index ? "text-white" : "text-gray-900"
                                                    }`}
                                                >
                                                    {feature.title}
                                                </h3>
                                                <p
                                                    className={
                                                        activeFeature === index ? "text-white/90" : "text-gray-600"
                                                    }
                                                >
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <motion.div
                            ref={dashboardRef}
                            style={{scale: dashboardScale, opacity: dashboardOpacity}}
                            className="bg-white p-4 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                                {/* Dashboard Mockup - placeholder for actual screenshot */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-green-900 to-indigo-800 opacity-10"></div>
                                <div className="p-8">
                                    <div className="h-8 bg-green-700 rounded-lg w-full mb-8 opacity-80"></div>
                                    <div className="grid grid-cols-4 gap-4 mb-8">
                                        {[1, 2, 3, 4].map((item) => (
                                            <div key={item} className="h-24 bg-green-600 rounded-lg opacity-60"></div>
                                        ))}
                                    </div>
                                    <div className="h-64 bg-white rounded-lg shadow-md p-4">
                                        <div className="h-8 bg-green-100 rounded w-1/3 mb-4"></div>
                                        <div className="space-y-2">
                                            {[1, 2, 3, 4, 5].map((item) => (
                                                <div key={item} className="h-6 bg-gray-200 rounded"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Features visual representation based on selected feature */}
                                <div
                                    className={`absolute inset-0 transition-opacity duration-500 ${activeFeature === 0 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div
                                        className="absolute bottom-8 right-8 w-1/2 h-1/3 bg-white/90 rounded-lg shadow-lg p-4">
                                        <div className="h-4 w-1/2 bg-green-600 rounded mb-2"></div>
                                        <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5, 6].map((_, i) => (
                                                <div key={i} className="h-20 w-full bg-green-600 rounded-sm opacity-60"
                                                     style={{opacity: 0.3 + (i * 0.1)}}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`absolute inset-0 transition-opacity duration-500 ${activeFeature === 1 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div
                                        className="absolute bottom-8 right-8 w-2/3 h-1/2 bg-white/90 rounded-lg shadow-lg p-4">
                                        <div className="h-4 w-1/3 bg-green-600 rounded mb-2"></div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[1, 2, 3].map((_, i) => (
                                                <div key={i}
                                                     className="h-24 rounded overflow-hidden border border-gray-200">
                                                    <div className="h-4 w-full bg-green-600 rounded-t"></div>
                                                    <div className="p-2">
                                                        <div className="h-3 w-full bg-gray-200 rounded mb-1"></div>
                                                        <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                                    </div>
                                                    <div className="h-8 flex items-end justify-end p-2">
                                                        <div className="h-4 w-12 bg-green-100 rounded"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`absolute inset-0 transition-opacity duration-500 ${activeFeature === 2 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div
                                        className="absolute top-1/4 right-8 w-2/3 h-1/2 bg-white/90 rounded-lg shadow-lg p-4">
                                        <div className="h-6 w-full flex justify-between items-center mb-4">
                                            <div className="h-4 w-1/3 bg-green-600 rounded"></div>
                                            <div className="h-8 w-8 rounded-full bg-green-100"></div>
                                        </div>
                                        <div className="space-y-3">
                                            {[1, 2, 3, 4].map((_, i) => (
                                                <div key={i} className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 mr-2"></div>
                                                    <div className="flex-1">
                                                        <div className="h-3 w-1/3 bg-gray-200 rounded mb-1"></div>
                                                        <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                                    </div>
                                                    <div className="h-6 w-16 rounded bg-green-100"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`absolute inset-0 transition-opacity duration-500 ${activeFeature === 3 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div
                                        className="absolute top-1/3 left-8 w-2/3 h-1/2 bg-white/90 rounded-lg shadow-lg p-4">
                                        <div className="h-4 w-1/2 bg-green-600 rounded mb-4"></div>
                                        <div className="relative h-32">
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-red-100 rounded"></div>
                                            <div
                                                className="absolute inset-x-0 bottom-0 h-1/4 bg-green-100 rounded"></div>
                                            <div className="absolute inset-x-0 bottom-0 flex justify-around">
                                                {[1, 2, 3, 4, 5].map((_, i) => (
                                                    <div key={i} className="h-24 w-8 bg-green-600 rounded-t" style={{
                                                        height: `${40 + (i % 3) * 20}%`,
                                                        opacity: 0.5 + (i * 0.1)
                                                    }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            A simplified workflow for managing your SIM card operations
                        </p>
                    </motion.div>

                    <div className="relative">
                        <div
                            className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-green-200 -translate-y-1/2"></div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                {
                                    title: "Register SIM Cards",
                                    description: "Record new SIM card sales with bulk upload options",
                                    icon: "sim-card",
                                },
                                {
                                    title: "Track Activations",
                                    description: "Monitor SIM activation status and top-up activities",
                                    icon: "activity",
                                },
                                {
                                    title: "Measure Quality",
                                    description: "Track quality metrics and fraud detection",
                                    icon: "chart-square-bar",
                                },
                                {
                                    title: "Generate Reports",
                                    description: "Create performance reports for team evaluation",
                                    icon: "document-report",
                                },
                            ].map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{opacity: 0, y: 30}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{delay: index * 0.1, duration: 0.5}}
                                    className="relative"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <div
                                                className={`w-16 h-16 rounded-full flex items-center justify-center z-10 relative bg-green-700 text-white`}
                                            >
                                                <span className="text-xl font-bold">{index + 1}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl shadow-lg p-6 mt-4 text-center">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                            <p className="text-gray-600">{step.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-gradient-to-br from-green-900 via-green-800 to-indigo-900 text-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">What Our Clients Say</h2>
                        <p className="text-xl text-green-100 max-w-3xl mx-auto">
                            Don't take our word for it — hear from the teams using our system
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                quote:
                                    "The SIM Card Management System has transformed our operations. We've seen a 35% increase in quality metrics since implementation.",
                                author: "Sarah Johnson",
                                position: "Team Leader at Safaricom",
                            },
                            {
                                quote:
                                    "The reporting capabilities are outstanding. I can track my team's performance in real-time and make data-driven decisions.",
                                author: "Michael Ndung'u",
                                position: "Distribution Manager",
                            },
                            {
                                quote:
                                    "User onboarding is seamless and the system is intuitive. Our team adapted to it within days and saw immediate benefits.",
                                author: "Alice Kamau",
                                position: "Operations Director",
                            },
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{opacity: 0, y: 30}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{delay: index * 0.1, duration: 0.5}}
                                className="bg-white/10 backdrop-blur-lg p-8 rounded-xl"
                            >
                                <svg
                                    className="h-10 w-10 text-green-300 mb-4"
                                    fill="currentColor"
                                    viewBox="0 0 32 32"
                                >
                                    <path
                                        d="M10 8v6a6 6 0 01-6 6H4v6h6v-6a6 6 0 016-6V8h-6zm16 0v6a6 6 0 01-6 6h0v6h6v-6a6 6 0 016-6V8h-6z"/>
                                </svg>
                                <p className="text-lg mb-6">{testimonial.quote}</p>
                                <div>
                                    <p className="font-bold">{testimonial.author}</p>
                                    <p className="text-green-300 text-sm">{testimonial.position}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                        className="bg-gradient-to-br from-green-50 to-indigo-50 rounded-2xl shadow-xl p-12 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-5">
                            <svg
                                className="w-full h-full"
                                viewBox="0 0 200 200"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fill="#3b82f6"
                                    d="M41.9,-70.8C54.3,-63.5,64.3,-52.3,72.4,-39.5C80.5,-26.7,86.6,-13.4,86.3,-0.2C86,13,79.3,26,70.6,36.8C61.9,47.6,51.3,56.3,39.5,61.7C27.8,67.1,13.9,69.3,0.1,69.1C-13.6,68.9,-27.3,66.4,-40.3,60.9C-53.4,55.3,-65.9,46.8,-73.8,35C-81.7,23.2,-85,8.1,-83.4,-6.1C-81.8,-20.3,-75.3,-33.7,-66.1,-44.8C-56.9,-55.9,-45,-64.8,-32.6,-71.8C-20.1,-78.8,-7.1,-83.9,4.2,-90.7C15.4,-97.5,29.5,-78.1,41.9,-70.8Z"
                                    transform="translate(100 100)"
                                />
                            </svg>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                            <div className="md:pr-8 mb-8 md:mb-0">
                                <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
                                <p className="text-xl text-gray-600 max-w-lg">
                                    Transform your SIM card management process with our comprehensive system. Book a
                                    demo today and see how we can help optimize your operations.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.button
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    className="bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:bg-green-800 transition-all duration-300"
                                >
                                    Start Free Trial
                                </motion.button>
                                <motion.button
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    className="bg-white text-green-700 border border-green-700 font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-50 transition-all duration-300"
                                >
                                    Schedule Demo
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">SIM Manager</h3>
                            <p className="text-gray-400">
                                Comprehensive SIM card management solution for distributors and teams.
                            </p>
                            <div className="flex space-x-4 mt-6">
                                {["facebook", "twitter", "linkedin", "instagram"].map((social) => (
                                    <a
                                        key={social}
                                        href="#"
                                        className="text-gray-400 hover:text-white transition-colors duration-300"
                                    >
                                        <span className="sr-only">{social}</span>
                                        <div
                                            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                            <svg
                                                className="h-4 w-4"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"/>
                                            </svg>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </footer>
        </main>
    )
}
