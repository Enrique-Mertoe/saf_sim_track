
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function CircularLoader({ isVisible = false }) {
  const [mounted, setMounted] = useState(false);

  // Control animation state
  useEffect(() => {
    if (isVisible) {
      setMounted(true);
    } else {
      // When hiding, wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setMounted(false);
      }, 300); // Match animation duration

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!mounted && !isVisible) return null;

  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 z-500 transition-all duration-300 ease-in-out ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
    }`}>
      <div className="bg-white rounded-full p-2 shadow-lg flex items-center justify-center">
        <Loader2 className={`text-green-500 animate-spin ${
          isVisible ? 'h-10 w-10' : 'h-0 w-0'
        } transition-all duration-300`} />
      </div>
    </div>
  );
}