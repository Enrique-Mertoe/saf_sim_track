"use client"
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const featureItem = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>Safaricom SIM Card Sales Tracking</title>
        <meta name="description" content="Efficiently track and manage SIM card sales for Safaricom" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-shrink-0"
              >
                <div className="h-8 w-8 bg-green-500 rounded-full"></div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="ml-3 font-semibold text-gray-900 text-lg"
              >
                SIM Tracker
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative pt-16 pb-32 overflow-hidden"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <motion.h1
                variants={fadeIn}
                className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
              >
                <span className="block">Manage SIM Sales</span>
                <span className="block text-green-600">with Precision</span>
              </motion.h1>
              <motion.p
                variants={fadeIn}
                className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
              >
                Track SIM card sales, monitor activations, and manage team performance all in one powerful, mobile-friendly platform.
              </motion.p>
              <motion.div
                variants={fadeIn}
                className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
              >
                <a href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.button>
                </a>
              </motion.div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md"
              >
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="aspect-w-10 aspect-h-16 sm:aspect-w-2 sm:aspect-h-1">
                    <div className="h-64 w-full bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center p-6">
                      <div className="w-full bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-inner">
                        <div className="h-8 w-full bg-gray-200 rounded-md mb-4"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded-md mb-4"></div>
                        <div className="flex space-x-2 mb-4">
                          <div className="h-8 w-8 bg-green-500 rounded-md"></div>
                          <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
                        </div>
                        <div className="h-4 w-full bg-gray-200 rounded-md mb-2"></div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                        <div className="h-20 w-full bg-gray-200 rounded-md"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerChildren}
        className="py-12 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <motion.h2
              variants={fadeIn}
              className="text-base text-green-600 font-semibold tracking-wide uppercase"
            >
              Features
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl"
            >
              Everything you need to manage SIM sales
            </motion.p>
            <motion.p
              variants={fadeIn}
              className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto"
            >
              Our platform provides all the tools needed for tracking, managing, and optimizing your SIM card sales operations.
            </motion.p>
          </div>

          <div className="mt-10">
            <motion.div
              variants={staggerChildren}
              className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3"
            >
              <motion.div variants={featureItem} className="relative bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="absolute -top-3 -left-3 bg-green-500 rounded-full p-3">
                  <Users className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">Team Management</h3>
                <p className="mt-2 text-base text-gray-500">
                  Efficiently manage team leaders and staff with role-based permissions and hierarchies.
                </p>
              </motion.div>

              <motion.div variants={featureItem} className="relative bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="absolute -top-3 -left-3 bg-green-500 rounded-full p-3">
                  <BarChart3 className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">Real-time Analytics</h3>
                <p className="mt-2 text-base text-gray-500">
                  Track sales performance, activation rates, and team metrics in real-time.
                </p>
              </motion.div>

              <motion.div variants={featureItem} className="relative bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="absolute -top-3 -left-3 bg-green-500 rounded-full p-3">
                  <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">Fraud Prevention</h3>
                <p className="mt-2 text-base text-gray-500">
                  Advanced monitoring tools to detect and prevent fraudulent activities.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Call to action section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="bg-green-600"
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-green-200">Login to your account today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50"
              >
                Login
              </motion.button>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-800 hover:bg-green-700"
              >
                Learn more
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-8 w-8 bg-green-500 rounded-full"></div>
            <div className="ml-3 text-white font-semibold">SIM Tracker</div>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Safaricom SIM Tracking. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}