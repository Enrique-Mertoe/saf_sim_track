import React, { useState, useRef } from 'react';
import { Button } from '@/ui/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/Card';
import { toast } from '@/ui/components/Toast';
import { Alert, AlertDescription, AlertTitle } from '@/ui/components/Alert';
import { Progress } from '@/ui/components/Progress';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { SIMCardCreate, SIMStatus } from '@/models';
import {createSupabaseClient} from "@/lib/supabase/client";
// import { createSupabaseClient } from '@/lib/supabase';

interface BulkUploadProps {
  currentUser: {
    id: string;
    team_id?: string;
  };
};

// Helper function to validate SIM data
const validateSIMData = (record: any, rowIndex: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  const requiredFields = [
    'serial_number', 'customer_msisdn', 'customer_id_number',
    'agent_msisdn', 'sale_date', 'sale_location', 'team_id', 'region'
  ];

  requiredFields.forEach(field => {
    if (!record[field]) {
      errors.push(`Row ${rowIndex}: Missing ${field.replace('_', ' ')}`);
    }
  });

  // Phone number validation
  if (record.customer_msisdn && !/^[0-9]{10,12}$/.test(record.customer_msisdn)) {
    errors.push(`Row ${rowIndex}: Invalid customer phone number format`);
  }

  if (record.agent_msisdn && !/^[0-9]{10,12}$/.test(record.agent_msisdn)) {
    errors.push(`Row ${rowIndex}: Invalid agent phone number format`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const BulkSIMCardUpload: React.FC<BulkUploadProps> = ({ currentUser }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedResult, setProcessedResult] = useState<{
    totalRecords: number;
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setProcessedResult(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setProcessedResult(null);
    }
  };

  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const resetUpload = () => {
    setFile(null);
    setProcessedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async () => {
    if (!file || !currentUser.id) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Determine file type and parse accordingly
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // Start progress animation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 5, 90); // Max out at 90% until processing is complete
          return newProgress;
        });
      }, 300);

      let parsedData: any[] = [];

      if (fileExtension === 'csv') {
        // Parse CSV with PapaParse
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
        });
        parsedData = result.data;
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // Parse Excel with SheetJS
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        parsedData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error('Unsupported file type. Please upload CSV or Excel file.');
      }

      // Process the data
      const result = await processCsvData(parsedData, currentUser.id);

      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      setProcessedResult(result);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = [
      'serial_number', 'customer_msisdn', 'customer_id_number',
      'agent_msisdn', 'sale_date', 'sale_location', 'team_id',
      'region', 'status', 'top_up_amount'
    ].join(',');

    const sampleRow = [
      '89254021374259XXXXX', '254722XXXXXX', 'ID123456',
      '254733XXXXXX', '2025-05-12', 'Nairobi CBD', currentUser.team_id || 'TEAM_ID',
      'Nairobi', 'NEW', '50'
    ].join(',');

    const csvContent = `${headers}\n${sampleRow}`;

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sim_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Bulk SIM Card Registration</CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          Upload multiple SIM cards at once using CSV or Excel file.
          <Button variant="link" className="p-0 h-auto text-green-500 dark:text-green-400" onClick={downloadTemplate}>
            Download template
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!file && (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800"
            onDrop={handleFileDrop}
            onDragOver={preventDefault}
            onDragEnter={preventDefault}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4 text-gray-600 dark:text-gray-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 14.9861C11 15.5384 11.4477 15.9861 12 15.9861C12.5523 15.9861 13 15.5384 13 14.9861V7.82831L16.2428 11.0711C16.6333 11.4616 17.2665 11.4616 17.657 11.0711C18.0475 10.6806 18.0475 10.0474 17.657 9.65692L12.7071 4.70692C12.3166 4.3164 11.6834 4.3164 11.2929 4.70692L6.34292 9.65692C5.9524 10.0474 5.9524 10.6806 6.34292 11.0711C6.73345 11.4616 7.36661 11.4616 7.75714 11.0711L11 7.82831V14.9861Z" fill="currentColor" />
                  <path d="M4 14H6V18H18V14H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14Z" fill="currentColor" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">CSV or Excel files (up to 5MB)</p>
            </label>
          </div>
        )}

        {file && !isProcessing && !processedResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-600 dark:text-green-400">
                    <path d="M7 18H17V16H7V18Z" fill="currentColor" />
                    <path d="M17 14H7V12H17V14Z" fill="currentColor" />
                    <path d="M7 10H11V8H7V10Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 5.13401 17.866 2 14 2H6ZM6 4H13V9H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4ZM15 4.10002C16.6113 4.4271 17.9413 5.52906 18.584 7H15V4.10002Z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={resetUpload} className="border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
                <Button size="sm" onClick={processFile} className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600">
                  Process File
                </Button>
              </div>
            </div>

            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
              <AlertTitle className="text-green-800 dark:text-green-300">File requirements</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                  <li>File must be CSV or Excel format</li>
                  <li>First row must contain column headers</li>
                  <li>Required fields: serial_number, customer_msisdn, customer_id_number, agent_msisdn, sale_date, sale_location, team_id, region</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Processing file...</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2 bg-gray-200 dark:bg-gray-700" />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {uploadProgress < 100 ?
                "Validating and processing records. This may take a moment..." :
                "Finalizing upload..."
              }
            </p>
          </div>
        )}

        {processedResult && (
          <div className="space-y-5">
            <div className={`p-4 ${processedResult.failedCount === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'} rounded-lg border ${processedResult.failedCount === 0 ? 'border-green-200 dark:border-green-800' : 'border-yellow-200 dark:border-yellow-800'}`}>
              <h3 className={`text-lg font-medium ${processedResult.failedCount === 0 ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                Upload {processedResult.failedCount === 0 ? 'Complete' : 'Completed with Errors'}
              </h3>

              <div className="mt-3 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{processedResult.totalRecords}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Successful</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{processedResult.successCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{processedResult.failedCount}</p>
                </div>
              </div>
            </div>

            {processedResult.errors.length > 0 && (
              <div className="max-h-60 overflow-y-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="text-md font-medium text-red-800 dark:text-red-300 mb-2">Error Details</h3>
                <ul className="space-y-1 list-disc list-inside text-sm text-red-700 dark:text-red-300">
                  {processedResult.errors.slice(0, 100).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {processedResult.errors.length > 100 && (
                    <li className="font-medium">...and {processedResult.errors.length - 100} more errors</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {processedResult.successCount > 0 && (
                <Button variant="outline" onClick={() => window.location.href = '/sim-cards'} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  View SIM Cards
                </Button>
              )}
              <Button onClick={resetUpload} className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600">
                Upload Another File
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to process the CSV file
const processCsvData = async (data: any[], userId: string): Promise<{
  totalRecords: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}> => {
    const supabase = createSupabaseClient();
    const result = {
        totalRecords: data.length,
        successCount: 0,
        failedCount: 0,
        errors: [] as string[]
    };

    // Prepare data for insertion
    const validRecords: SIMCardCreate[] = [];

    // Validate each record
    data.forEach((record, index) => {
        const rowIndex = index + 2; // +2 because of 0-index and header row
        const validation = validateSIMData(record, rowIndex);

        if (validation.valid) {
            // Format the record for insertion
            const simRecord: SIMCardCreate = {
                serial_number: record.serial_number?.trim(),
                customer_id_number: record.customer_id_number?.trim(),
                agent_msisdn: record.agent_msisdn?.trim(),
                sale_date: record.sale_date,
                sale_location: record.sale_location?.trim(),
                team_id: record.team_id?.trim(),
                region: record.region?.trim(),
                status: record.status || SIMStatus.INACTIVE,
                sold_by_user_id: userId,
                top_up_amount: record.top_up_amount ? Number(record.top_up_amount) : undefined,
                customer_id_front_url: record.customer_id_front_url,
                customer_id_back_url: record.customer_id_back_url
            } as SIMCardCreate;

            validRecords.push(simRecord);
        } else {
            result.errors.push(...validation.errors);
        }
    });

    // Only proceed with insertion if we have valid records
    if (validRecords.length > 0) {
        try {
            // Insert records in batches for better performance
            const batchSize = 50;
            for (let i = 0; i < validRecords.length; i += batchSize) {
                const batch = validRecords.slice(i, i + batchSize);
                const {data, error} = await supabase
                    .from('sim_cards')
                    .insert(batch);

                if (error) {
                    console.error('Error inserting batch:', error);
                    batch.forEach((_, idx) => {
                        const rowIndex = i + idx + 2;
                        result.errors.push(`Row ${rowIndex}: Database error - ${error.message}`);
                        result.failedCount++;
                    });
                } else {
                    result.successCount += batch.length;
                }
            }
        } catch (error) {
            console.error('Error processing batch insert:', error);
            result.errors.push(`Batch processing error: ${(error as Error).message}`);
            result.failedCount += validRecords.length;
        }
    }

    return result;
}