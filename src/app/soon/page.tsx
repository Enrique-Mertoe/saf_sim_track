"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const ComingSoonPage: React.FC = () => {
  const [days, setDays] = useState<number>(30);
  const [hours, setHours] = useState<number>(12);
  const [minutes, setMinutes] = useState<number>(45);
  const [seconds, setSeconds] = useState<number>(0);
  const [email, setEmail] = useState<string>('');

  // Set launch date to 30 days from now
  useEffect(() => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 30);

    const updateCountdown = () => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();

      const newDays = Math.floor(difference / (1000 * 60 * 60 * 24));
      const newHours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const newMinutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const newSeconds = Math.floor((difference % (1000 * 60)) / 1000);

      setDays(newDays);
      setHours(newHours);
      setMinutes(newMinutes);
      setSeconds(newSeconds);
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you! We'll notify ${email} when we launch.`);
    setEmail('');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const shapeVariants = {
    animate: {
      y: [0, -20, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 15,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      {/* Animated background shapes */}
      <motion.div
        className="fixed top-0 left-0 w-64 h-64 rounded-full bg-green-300 dark:bg-green-800 opacity-10 blur-3xl transform -translate-x-1/2 -translate-y-1/2"
        variants={shapeVariants}
        animate="animate"
      />
      <motion.div
        className="fixed bottom-0 right-0 w-96 h-96 rounded-full bg-teal-300 dark:bg-teal-800 opacity-10 blur-3xl transform translate-x-1/4 translate-y-1/4"
        variants={shapeVariants}
        animate="animate"
        transition={{ delay: 5 }}
      />
      <motion.div
        className="fixed top-1/2 right-1/4 w-48 h-48 rounded-full bg-emerald-300 dark:bg-emerald-800 opacity-10 blur-3xl"
        variants={shapeVariants}
        animate="animate"
        transition={{ delay: 10 }}
      />

      <motion.div
        className="relative max-w-3xl w-full text-center z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div
          className="mx-auto w-24 h-24 mb-8 rounded-full bg-gradient-to-r from-green-400 to-teal-400 dark:from-green-500 dark:to-teal-500 flex items-center justify-center shadow-lg"
          variants={itemVariants}
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              "0 10px 25px -5px rgba(74, 222, 128, 0.4)",
              "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <span className="text-4xl font-bold text-white">G</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-8 text-gray-800 dark:text-gray-100 relative inline-block"
          variants={itemVariants}
        >
          Coming Soon
          <motion.span
            className="absolute bottom-0 left-1/2 h-1 bg-green-400 dark:bg-green-500 rounded"
            initial={{ width: 0, x: "-50%" }}
            animate={{ width: "100px", x: "-50%" }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          ></motion.span>
        </motion.h1>

        {/* Loading bar */}
        <motion.div
          className="w-48 h-1 mx-auto mb-8 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
          variants={itemVariants}
        >
          <motion.div
            className="h-full bg-green-400 dark:bg-green-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
          ></motion.div>
        </motion.div>

        {/* Description */}
        <motion.p
          className="text-lg mb-10 text-gray-600 dark:text-gray-300 max-w-lg mx-auto"
          variants={itemVariants}
        >
          We're working hard to bring you something amazing. Our new green-themed website is almost ready. Stay tuned for the launch!
        </motion.p>

        {/* Countdown */}
        <motion.div
          className="flex justify-center gap-4 md:gap-6 mb-12"
          variants={itemVariants}
        >
          <CountdownItem value={days} label="Days" />
          <CountdownItem value={hours} label="Hours" />
          <CountdownItem value={minutes} label="Minutes" />
          <CountdownItem value={seconds} label="Seconds" />
        </motion.div>

        {/* Email form */}
        <motion.form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto mb-12 flex flex-col sm:flex-row overflow-hidden rounded-full shadow-md"
          variants={itemVariants}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to get notified"
            required
            className="flex-grow py-3 px-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-none outline-none w-full sm:w-auto"
          />
          <motion.button
            type="submit"
            className="w-full sm:w-auto py-3 px-6 bg-green-500 text-white font-semibold"
            whileHover={{ backgroundColor: "#22c55e" }} // green-600
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Notify Me
          </motion.button>
        </motion.form>

        {/* Social links */}
        <motion.div
          className="flex justify-center gap-5"
          variants={itemVariants}
        >
          <SocialLink icon={<Facebook size={18} />} href="#" />
          <SocialLink icon={<Twitter size={18} />} href="#" />
          <SocialLink icon={<Instagram size={18} />} href="#" />
          <SocialLink icon={<Linkedin size={18} />} href="#" />
        </motion.div>
      </motion.div>
    </div>
  );
};

// Countdown item component
const CountdownItem: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const paddedValue = value.toString().padStart(2, '0');

  return (
    <motion.div
      className="relative bg-white dark:bg-gray-800 rounded-lg px-4 py-3 min-w-20 shadow-md overflow-hidden"
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <motion.div
        className="absolute top-0 left-0 h-1 bg-green-400 dark:bg-green-500 w-full"
        initial={{scaleX: 1, originX: 0}}
        animate={{
          scaleX: [1, 0],
          transition: {
            duration: label === "Seconds" ? 60 :
                     label === "Minutes" ? 3600 :
                     label === "Hours" ? 86400 :
                     2592000, // Days (30 days)
            repeat: Infinity,
            ease: "linear"
          }
        }}
      />
      <span className="block text-2xl font-bold text-green-600 dark:text-green-400">{paddedValue}</span>
      <span className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</span>
    </motion.div>
  );
};

// Social link component
const SocialLink: React.FC<{ icon: React.ReactNode; href: string }> = ({ icon, href }) => {
  return (
    <motion.a
      href={href}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-green-500 dark:text-green-400 shadow-md"
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {icon}
    </motion.a>
  );
};

export default ComingSoonPage;