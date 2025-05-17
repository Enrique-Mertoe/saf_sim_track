// components/UserProfileSkeleton.tsx
export default function UserProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-colors duration-300">
        <div className="h-32 bg-gray-200 dark:bg-gray-700"></div>
        <div className="px-6 py-4 sm:px-8 sm:py-6 flex flex-col sm:flex-row justify-between -mt-12">
          <div className="flex flex-col sm:flex-row items-start">
            {/* Avatar placeholder */}
            <div className="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-600 ring-4 ring-white dark:ring-gray-800"></div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              {/* Name placeholder */}
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
              {/* Status and role placeholder */}
              <div className="flex items-center mt-2">
                <div className="h-5 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="mx-2 h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
          {/* Action buttons placeholder */}
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
            <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile details skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
            </div>
            <div className="p-6 space-y-4">
              {/* Contact items */}
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-1"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats and activity skeleton */}
        <div className="lg:col-span-2">
          {/* Stats skeleton */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance metrics */}
                {[1, 2].map((metric) => (
                  <div key={metric} className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-gray-300 dark:bg-gray-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data visualization placeholder */}
              <div className="mt-6 h-64 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
          </div>

          {/* Activity skeleton */}
          <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
            </div>
            <div className="p-6">
              {/* Activity list */}
              <div className="space-y-6">
                {[1, 2, 3].map((activity) => (
                  <div key={activity} className="flex">
                    <div className="mr-4">
                      <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                      <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}