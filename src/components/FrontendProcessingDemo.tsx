import React, {useCallback, useState} from 'react';
import {ProcessingProgress} from '@/services/frontendTaskProcessor';
import {ControllableReportProcessor} from '@/app/dashboard/report/utils/frontendReportProcessor';
import {ProcessedReport, Report} from '@/app/dashboard/report/types';
import {User} from '@/models';

interface FrontendProcessingDemoProps {
  report: Report;
  user: User;
  onComplete?: (result: ProcessedReport) => void;
  onError?: (error: Error) => void;
}

const FrontendProcessingDemo: React.FC<FrontendProcessingDemoProps> = ({
  report,
  user,
  onComplete,
  onError
}) => {
  const [processor] = useState(() => new ControllableReportProcessor());
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('Ready to process');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingStats, setProcessingStats] = useState<ProcessingProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log entry
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  }, []);

  // Start processing
  const handleStart = useCallback(async () => {
    if (processor.isCurrentlyProcessing()) return;

    setIsProcessing(true);
    setIsPaused(false);
    setProgress(0);
    setStatus('Initializing...');
    setLogs([]);
    addLog('Starting frontend processing...');

    try {
      await processor.startProcessing(
        report,
        user,
        (progressValue) => {
          setProgress(progressValue);
          const stats = processor.getProgress();
          setProcessingStats(stats);
          
          if (stats) {
            setStatus(`Processing: ${stats.processedRecords}/${stats.totalRecords} records`);
          }
        },
        (result) => {
          addLog('Processing completed successfully!');
          setStatus('Completed');
          setIsProcessing(false);
          onComplete?.(result);
        },
        (error) => {
          addLog(`Processing failed: ${error.message}`);
          setStatus('Failed');
          setIsProcessing(false);
          onError?.(error);
        }
      );
    } catch (error) {
      //@ts-ignore
      addLog(`Failed to start processing: ${error.message}`);
      setStatus('Failed to start');
      setIsProcessing(false);
    }
  }, [processor, report, user, addLog, onComplete, onError]);

  // Pause processing
  const handlePause = useCallback(() => {
    processor.pauseProcessing();
    setIsPaused(true);
    setStatus('Paused');
    addLog('Processing paused by user');
  }, [processor, addLog]);

  // Resume processing
  const handleResume = useCallback(() => {
    processor.resumeProcessing();
    setIsPaused(false);
    setStatus('Resuming...');
    addLog('Processing resumed by user');
  }, [processor, addLog]);

  // Abort processing
  const handleAbort = useCallback(() => {
    processor.abortProcessing();
    setIsProcessing(false);
    setIsPaused(false);
    setStatus('Aborted');
    addLog('Processing aborted by user');
  }, [processor, addLog]);

  // Format time remaining
  const formatTimeRemaining = (ms?: number) => {
    if (!ms) return 'Calculating...';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Frontend Processing Demo
        </h2>
        <p className="text-gray-600">
          Processing {report.records.length} records using frontend chunking
        </p>
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-600">{status}</div>
      </div>

      {/* Stats Section */}
      {processingStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Records</div>
            <div className="font-semibold">
              {processingStats.processedRecords} / {processingStats.totalRecords}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Chunks</div>
            <div className="font-semibold">
              {processingStats.currentChunk} / {processingStats.totalChunks}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">ETA</div>
            <div className="font-semibold">
              {formatTimeRemaining(processingStats.estimatedTimeRemaining)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Errors</div>
            <div className="font-semibold text-red-600">
              {processingStats.errors.length}
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleStart}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Start Processing'}
        </button>
        
        {isProcessing && !isPaused && (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Pause
          </button>
        )}
        
        {isProcessing && isPaused && (
          <button
            onClick={handleResume}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Resume
          </button>
        )}
        
        {isProcessing && (
          <button
            onClick={handleAbort}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Abort
          </button>
        )}
      </div>

      {/* Error Display */}
      {processingStats?.errors && processingStats.errors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Errors</h3>
          <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
            {processingStats.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-700 mb-1">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Logs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Processing Logs</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Benefits Callout */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded p-4">
        <h4 className="font-semibold text-green-800 mb-2">Frontend Processing Benefits:</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✅ No server timeouts - processing runs entirely in browser</li>
          <li>✅ User controls - pause, resume, or abort anytime</li>
          <li>✅ Real-time progress - see exactly what's happening</li>
          <li>✅ Reliable - no serverless function limitations</li>
          <li>✅ Scalable - handles any dataset size through chunking</li>
        </ul>
      </div>
    </div>
  );
};

export default FrontendProcessingDemo;