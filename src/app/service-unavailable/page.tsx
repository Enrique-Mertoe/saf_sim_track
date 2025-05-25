"use client";

import React, {Suspense, useEffect, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {AlertTriangle, Info, Lock, Users, UserX} from 'lucide-react';
import useApp from "@/ui/provider/AppProvider";
import {motion} from 'framer-motion';

// Component that uses useSearchParams
function ServiceUnavailableContent() {
  const searchParams = useSearchParams();
  const { user } = useApp();
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    setType(searchParams.get('type'));
  }, [searchParams]);

  // Define content based on the type of unavailability
  const getContent = () => {
    switch (type) {
      case 'team-leader':
        return {
          title: 'Subscription Required',
          icon: <Lock className="h-16 w-16 text-yellow-500" />,
          message: 'Your subscription has expired or is not active.',
          description: 'As a Team Leader, you need an active subscription to access the system. Please contact your administrator to renew your subscription.',
          actionText: 'Contact Administrator',
          actionLink: 'mailto:admin@example.com',
          color: 'yellow'
        };

      case 'no-admin':
        return {
          title: 'No Administrator Found',
          icon: <UserX className="h-16 w-16 text-red-500" />,
          message: 'Your team is not linked to an administrator.',
          description: 'Your team needs to be linked to an administrator to use the system. Please contact support for assistance.',
          actionText: 'Contact Support',
          actionLink: 'mailto:support@example.com',
          color: 'red'
        };

      case 'no-team':
        return {
          title: 'No Team Assignment',
          icon: <Users className="h-16 w-16 text-blue-500" />,
          message: 'You are not assigned to a team.',
          description: 'You need to be assigned to a team by a Team Leader to access the system. Please contact your Team Leader for assistance.',
          actionText: 'Contact Team Leader',
          actionLink: 'mailto:teamleader@example.com',
          color: 'blue'
        };

      case 'no-team-leader':
        return {
          title: 'No Team Leader',
          icon: <UserX className="h-16 w-16 text-purple-500" />,
          message: 'Your team does not have an assigned Team Leader.',
          description: 'Your team needs a Team Leader to use the system. Please contact your administrator for assistance.',
          actionText: 'Contact Administrator',
          actionLink: 'mailto:admin@example.com',
          color: 'purple'
        };

      case 'team-leader-no-subscription':
        return {
          title: 'Team Leader Subscription Required',
          icon: <Lock className="h-16 w-16 text-orange-500" />,
          message: 'Your Team Leader\'s subscription has expired or is not active.',
          description: 'Your Team Leader needs an active subscription for you to access the system. Please contact your Team Leader to renew their subscription.',
          actionText: 'Contact Team Leader',
          actionLink: 'mailto:teamleader@example.com',
          color: 'orange'
        };

      default:
        return {
          title: 'Service Unavailable',
          icon: <Info className="h-16 w-16 text-gray-500" />,
          message: 'The service is currently unavailable.',
          description: 'We apologize for the inconvenience. Please try again later or contact support for assistance.',
          actionText: 'Contact Support',
          actionLink: 'mailto:support@example.com',
          color: 'gray'
        };
    }
  };

  const content = getContent();
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`max-w-md w-full rounded-lg shadow-lg border ${colorClasses[content.color as keyof typeof colorClasses]} p-8`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-6">
          {content.icon}
        </div>

        <h1 className="text-2xl font-bold mb-2">{content.title}</h1>

        <div className="flex items-center mb-4">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p className="font-semibold">{content.message}</p>
        </div>

        <p className="mb-8 text-gray-600">{content.description}</p>

        <a 
          href={content.actionLink}
          className={`px-4 py-2 rounded-md font-medium text-white ${
            content.color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' :
            content.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
            content.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
            content.color === 'purple' ? 'bg-purple-500 hover:bg-purple-600' :
            content.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
            'bg-gray-500 hover:bg-gray-600'
          } transition-colors duration-200`}
        >
          {content.actionText}
        </a>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please contact support.</p>
          <p className="mt-1">User ID: {user?.id || 'Not logged in'}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Main component that wraps the content in Suspense
export default function ServiceUnavailablePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ServiceUnavailableContent />
      </Suspense>
    </div>
  );
}
