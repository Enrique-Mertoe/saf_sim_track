import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function Progress({
  progress = 0,
  total = 100,
  current = 0,
  showButtons = false,
  onIncrement = () => {},
  onReset = () => {},
  className = ""
}) {
  const isComplete = progress === 100;

  return (
    <div className={`w-full bg-white rounded-lg ${className}`}>
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            {isComplete ? 'Complete!' : 'Progress'}
          </span>
          <span className="text-sm font-medium text-green-600">
            {progress}%
          </span>
        </div>

        {/* Progress bar container */}
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress bar fill */}
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isComplete 
                ? 'bg-green-500 shadow-md shadow-green-200' 
                : 'bg-green-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current/Total items */}
        <div className="mt-1 flex justify-between items-center">
          {isComplete ? (
            <div className="flex items-center text-green-600 font-medium">
              <CheckCircle size={16} className="mr-1" />
              <span>All items processed successfully!</span>
            </div>
          ) : (
            <span className="text-sm text-gray-600">
              {current}/{total} items
            </span>
          )}
        </div>
      </div>

      {/* Optional control buttons */}
      {showButtons && (
        <div className="flex space-x-2 mt-3">
          <button
            onClick={onIncrement}
            disabled={isComplete}
            className={`px-3 py-1 rounded text-white text-sm font-medium transition-all ${
              isComplete 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isComplete ? 'Completed' : 'Process Next'}
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm font-medium transition-all"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// Example usage:
// function Demo() {
//   const [progress, setProgress] = React.useState(35);
//   const [current, setCurrent] = React.useState(35);
//   const [total] = React.useState(100);
//
//   const handleIncrement = () => {
//     if (progress < 100) {
//       setProgress(prev => Math.min(prev + 10, 100));
//       setCurrent(prev => Math.min(prev + 10, total));
//     }
//   };
//
//   const handleReset = () => {
//     setProgress(0);
//     setCurrent(0);
//   };
//
//   return (
//     <div className="p-6 max-w-md mx-auto space-y-6">
//       <h2 className="text-lg font-semibold text-gray-800">Progress Bar Examples</h2>
//
//       {/* Example 1: Basic usage */}
//       <div className="space-y-1">
//         <h3 className="text-sm font-medium text-gray-600">Basic Example (35%)</h3>
//         <Progress progress={35} current={35} total={100} />
//       </div>
//
//       {/* Example 2: Complete status */}
//       <div className="space-y-1">
//         <h3 className="text-sm font-medium text-gray-600">Complete Example (100%)</h3>
//         <Progress progress={100} current={100} total={100} />
//       </div>
//
//       {/* Example 3: Interactive with buttons */}
//       <div className="space-y-1">
//         <h3 className="text-sm font-medium text-gray-600">Interactive Example ({progress}%)</h3>
//         <Progress
//           progress={progress}
//           current={current}
//           total={total}
//           showButtons={true}
//           onIncrement={handleIncrement}
//           onReset={handleReset}
//         />
//       </div>
//     </div>
//   );
// }