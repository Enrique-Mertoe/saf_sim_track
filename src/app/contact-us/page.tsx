import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm">
              <div className="max-w-3xl mx-auto px-4 py-4">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contact Support</h1>
              </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-6 py-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Get in touch</h2>

                  <div className="space-y-6">
              {/* Contact Methods */}
              <div className="space-y-4">
                <ContactMethod
                  icon={<Mail className="h-5 w-5 text-green-600" />}
                  title="Email"
                  detail="support@simcardsystem.com"
                />
                <ContactMethod
                  icon={<Phone className="h-5 w-5 text-green-600" />}
                  title="Phone"
                  detail="+254 700 123 456"
                />
                <ContactMethod
                  icon={<MapPin className="h-5 w-5 text-green-600" />}
                  title="Office"
                  detail="Nairobi, Kenya"
                />
              </div>

              {/* Contact Form */}
              <form className="mt-8 space-y-4">
                <div>
                    <label htmlFor="name"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                        type="text"
                        id="name"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="email"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                        type="email"
                        id="email"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="message"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                    <textarea
                        id="message"
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <div className="max-w-3xl mx-auto px-4 py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">© 2025 SIM Card Management System.</p>
              </div>
      </footer>
    </div>
  );
}

function ContactMethod({ icon, title, detail }:any) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 pt-1">
        {icon}
      </div>
      <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{detail}</p>
      </div>
    </div>
  );
}