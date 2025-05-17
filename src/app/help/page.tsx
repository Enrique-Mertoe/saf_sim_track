"use client"
import { useState } from "react";
import { Search, HelpCircle, FileText, Users, CreditCard, BarChart2, ChevronDown, ChevronRight } from "lucide-react";

export default function HelpPage() {
  const [expandedItem, setExpandedItem] = useState("overview");

  const faqItems = [
    {
      id: "overview",
      title: "System Overview",
      content: "The SIM Card Management System is a web-based application designed to track SIM card sales by various teams and match them against Safaricom activation reports. The system helps distributors monitor which sold SIM cards have been activated, their top-up status, and generates performance reports for team evaluation."
    },
    {
      id: "simrecording",
      title: "How to Record SIM Cards",
      content: "You can record SIM cards individually by entering the serial number, or upload multiple SIM cards using a CSV/Excel file. Navigate to the SIM Card Recording module and follow the on-screen instructions. All recorded SIMs will be tracked for matching against Safaricom reports."
    },
    {
      id: "reports",
      title: "Uploading Safaricom Reports",
      content: "To upload a Safaricom report, go to the Report Upload section, select the file from your computer, specify the report period, and click 'Upload'. The system will automatically process the report and match it against recorded SIM cards."
    },
    {
      id: "performance",
      title: "Understanding Performance Metrics",
      content: "Team performance is measured based on match rate (percentage of recorded SIMs found in Safaricom reports) and quality rate (percentage of matched SIMs with top-ups ≥ 50 KES). Teams with rates above 95% receive a 'Well done' rating, those between 90-95% get an 'Improve' rating, and those below 90% need immediate attention."
    }
  ];

  const handleToggle = (itemId:any) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  return (
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <h1 className="ml-3 text-xl font-semibold text-gray-900">SIM Card Management System</h1>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
              placeholder="Search help topics"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <HelpCircle className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">How can we help you?</h2>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
            Find answers to common questions about the SIM Card Management System
          </p>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          <CategoryCard
            icon={<FileText className="h-6 w-6 text-blue-600" />}
            title="Documentation"
            description="Comprehensive guides for using the system"
          />
          <CategoryCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="User Management"
            description="Adding, updating or removing users"
          />
          <CategoryCard
            icon={<CreditCard className="h-6 w-6 text-blue-600" />}
            title="SIM Management"
            description="Recording and tracking SIM cards"
          />
          <CategoryCard
            icon={<BarChart2 className="h-6 w-6 text-blue-600" />}
            title="Reports"
            description="Understanding performance metrics"
          />
          <CategoryCard
            icon={<Search className="h-6 w-6 text-blue-600" />}
            title="Matching Process"
            description="How SIM cards are matched to reports"
          />
          <CategoryCard
            icon={<HelpCircle className="h-6 w-6 text-blue-600" />}
            title="Common Issues"
            description="Troubleshooting common problems"
          />
        </div>

        {/* FAQ Accordion */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqItems.map((item) => (
                <div key={item.id}
                     className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 rounded-lg overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                  onClick={() => handleToggle(item.id)}
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white">{item.title}</span>
                  {expandedItem === item.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedItem === item.id && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                      <p className="text-gray-700 dark:text-gray-300">{item.content}</p>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Help Section with SVG */}
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10 lg:flex lg:items-center">
            <div className="lg:w-1/2">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Still need help?</h3>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Our support team is ready to assist you with any questions or issues you may encounter.
              </p>
              <div className="mt-6">
                <a
                  href="#"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Contact Support
                </a>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 lg:w-1/2 flex justify-center">
              <SupportSVG />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 SIM Card Management System. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy</a>
              <a href="/contact-us" className="text-sm text-gray-500 hover:text-gray-900">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CategoryCard({ icon, title, description }:any) {
  return (
      
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg dark:shadow-gray-700">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportSVG() {
  return (
    <svg width="280" height="200" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="50" width="300" height="200" rx="10" className="fill-[#EBF4FF] dark:fill-gray-700"/>
      <rect x="80" y="80" width="240" height="30" rx="5" fill="white" stroke="#BFDBFE" strokeWidth="2" />
      <rect x="80" y="130" width="240" height="30" rx="5" fill="white" stroke="#BFDBFE" strokeWidth="2" />
      <rect x="80" y="180" width="240" height="30" rx="5" fill="white" stroke="#BFDBFE" strokeWidth="2" />
      <circle cx="350" cy="95" r="8" fill="#3B82F6" />
      <circle cx="350" cy="145" r="8" fill="#3B82F6" />
      <circle cx="350" cy="195" r="8" fill="#3B82F6" />
      <path d="M346 95 L350 99 L354 91" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M346 145 L350 149 L354 141" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M346 195 L350 199 L354 191" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}