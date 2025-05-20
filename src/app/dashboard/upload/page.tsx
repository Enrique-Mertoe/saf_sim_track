// "use client"
// import React, { useState } from 'react';
// import { SIMCard, SIMStatus } from '@/models';
// import { createSupabaseClient } from '@/lib/supabase/client';
// import Papa from 'papaparse';
// import * as XLSX from 'xlsx';
// import { Upload, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
// import alert from '@/ui/alert';
//
// const supabase = createSupabaseClient();
//
// // Define the structure of a Saraficom report row
// interface SaraficomReportRow {
//     'TM Date': string;
//     'ID Date': string;
//     'ID Month': string;
//     'Dealer Shortcode': string;
//     'Dealer Name': string;
//     'Sim Serial Number': string;
//     'Top Up Date': string;
//     'Top Up Amount': string;
//     'Agent MSISDN': string;
//     'BA Region': string;
//     'Territory': string;
//     'Cluster': string;
//     'Cumulative Usage': string;
//     'Cumulative Commission': string;
//     'Fraud Flagged': string;
//     'Fraud Suspension Date': string;
//     'Fraud Reason': string;
//     'Role': string;
//     'Quality': string;
// }
//
// interface SyncStats {
//     total: number;
//     updated: number;
//     activated: number;
//     quality: number;
//     notFound: number;
// }
//
// export default function SaraficomDataSync() {
//     const [isUploading, setIsUploading] = useState(false);
//     const [stats, setStats] = useState<SyncStats | null>(null);
//     const [errorRows, setErrorRows] = useState<SaraficomReportRow[]>([]);
//     const [fileType, setFileType] = useState<string>('');
//
//     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//
//         setIsUploading(true);
//         setStats(null);
//         setErrorRows([]);
//
//         // Determine file type
//         const fileExtension = file.name.split('.').pop()?.toLowerCase();
//         setFileType(fileExtension || '');
//
//         try {
//             if (fileExtension === 'csv') {
//                 processCSV(file);
//             } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
//                 processExcel(file);
//             } else {
//                 alert.error('Unsupported file format. Please upload a CSV or Excel file.');
//                 setIsUploading(false);
//             }
//         } catch (error) {
//             alert.error(`Error uploading file: ${error.message}`);
//             setIsUploading(false);
//         }
//     };
//
//     const processCSV = (file: File) => {
//         Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,
//             complete: async (results) => {
//                 const rows = results.data as SaraficomReportRow[];
//                 await syncSaraficomData(rows);
//             },
//             error: (error) => {
//                 alert.error(`Error parsing CSV: ${error.message}`);
//                 setIsUploading(false);
//             }
//         });
//     };
//
//     const processExcel = async (file: File) => {
//         try {
//             // Read the file as an ArrayBuffer
//             const arrayBuffer = await file.arrayBuffer();
//
//             // Parse the Excel file
//             const workbook = XLSX.read(arrayBuffer, { type: 'array' });
//
//             // Get the first sheet
//             const firstSheetName = workbook.SheetNames[0];
//             const worksheet = workbook.Sheets[firstSheetName];
//
//             // Convert to JSON with headers
//             const rows = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
//
//             // Get headers from the first row
//             const headers = rows[0];
//
//             // Map the data to match the expected structure
//             const formattedRows = rows.slice(1).map(row => {
//                 const formattedRow: any = {};
//                 Object.keys(row).forEach(key => {
//                     const headerKey = headers[key];
//                     formattedRow[headerKey] = row[key];
//                 });
//                 return formattedRow as SaraficomReportRow;
//             });
//
//             await syncSaraficomData(formattedRows);
//         } catch (error) {
//             alert.error(`Error processing Excel file: ${error.message}`);
//             setIsUploading(false);
//         }
//     };
//
//     const syncSaraficomData = async (reportRows: SaraficomReportRow[]) => {
//         const syncStats: SyncStats = {
//             total: reportRows.length,
//             updated: 0,
//             activated: 0,
//             quality: 0,
//             notFound: 0
//         };
//
//         const notFoundRows: SaraficomReportRow[] = [];
//
//         for (const row of reportRows) {
//             // Handle potentially missing keys in the row
//             const serialNumber = row['Sim Serial Number'];
//
//             if (!serialNumber) {
//                 syncStats.notFound++;
//                 notFoundRows.push(row);
//                 continue;
//             }
//
//             // Find matching SIM card in your database
//             const { data: simCards, error } = await supabase
//                 .from('sim_cards')
//                 .select('*')
//                 .eq('serial_number', serialNumber);
//
//             if (error) {
//                 console.error('Error querying database:', error);
//                 continue;
//             }
//
//             if (!simCards || simCards.length === 0) {
//                 // SIM card not found in your system
//                 syncStats.notFound++;
//                 notFoundRows.push(row);
//                 continue;
//             }
//
//             const simCard = simCards[0] as SIMCard;
//             const updates: Partial<SIMCard> = {};
//
//             // Check for activation status
//             if (row['Top Up Date'] && row['Top Up Amount']) {
//                 updates.status = SIMStatus.ACTIVATED;
//                 updates.activation_date = row['Top Up Date'];
//                 updates.top_up_amount = parseFloat(row['Top Up Amount']);
//                 syncStats.activated++;
//             }
//
//             // Check quality status
//             if (row['Quality'] === 'Y') {
//                 updates.quality = SIMStatus.QUALITY;
//                 syncStats.quality++;
//             } else if (row['Quality'] === 'N') {
//                 updates.quality = SIMStatus.NONQUALITY;
//             }
//
//             // Update fraud flags if needed
//             if (row['Fraud Flagged'] === 'Y') {
//                 updates.flags = [...(simCard.flags || []), 'fraud'];
//                 updates.fraud_reason = {
//                     flagged_date: row['TM Date'],
//                     suspension_date: row['Fraud Suspension Date'],
//                     reason: row['Fraud Reason']
//                 };
//             }
//
//             // Additional metadata that might be useful
//             updates.metadata = {
//                 ...(simCard.metadata || {}),
//                 agent_msisdn: row['Agent MSISDN'],
//                 ba_region: row['BA Region'],
//                 territory: row['Territory'],
//                 cluster: row['Cluster'],
//                 last_sync: new Date().toISOString()
//             };
//
//             // Update the SIM card in your database
//             if (Object.keys(updates).length > 0) {
//                 const { error: updateError } = await supabase
//                     .from('sim_cards')
//                     .update(updates)
//                     .eq('id', simCard.id);
//
//                 if (!updateError) {
//                     syncStats.updated++;
//                 } else {
//                     console.error('Error updating SIM card:', updateError);
//                 }
//             }
//         }
//
//         setStats(syncStats);
//         setErrorRows(notFoundRows);
//         setIsUploading(false);
//
//         // Show alert with summary
//         alert.success(`Sync completed: ${syncStats.updated} SIM cards updated, ${syncStats.notFound} not found`);
//     };
//
//     return (
//         <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center mb-4">
//                 <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg mr-3">
//                     <FileText className="text-blue-600 dark:text-blue-400" size={20} />
//                 </div>
//                 <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Saraficom Report Sync</h2>
//             </div>
//
//             <p className="text-gray-600 dark:text-gray-300 mb-6">
//                 Upload the Saraficom report to update your SIM card statuses, activations, and quality metrics.
//                 Supports both CSV and Excel (XLSX/XLS) formats.
//             </p>
//
//             <div className="flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 mb-6">
//                 <label className="flex flex-col items-center cursor-pointer">
//                     <div className="flex space-x-2">
//                         <Upload size={36} className="text-gray-400 dark:text-gray-500" />
//                         <FileSpreadsheet size={36} className="text-gray-400 dark:text-gray-500" />
//                     </div>
//                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3 mb-1">
//                         {isUploading ? 'Processing...' : 'Upload Saraficom Report'}
//                     </span>
//                     <span className="text-xs text-gray-500 dark:text-gray-400">CSV, XLSX or XLS format</span>
//                     <input
//                         type="file"
//                         className="hidden"
//                         accept=".csv,.xlsx,.xls"
//                         onChange={handleFileUpload}
//                         disabled={isUploading}
//                     />
//                 </label>
//             </div>
//
//             {isUploading && (
//                 <div className="mb-6 flex justify-center">
//                     <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
//                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400 mr-3"></div>
//                         <span className="text-blue-600 dark:text-blue-400 font-medium">
//                             Processing {fileType.toUpperCase()} file...
//                         </span>
//                     </div>
//                 </div>
//             )}
//
//             {stats && (
//                 <div className="mb-6">
//                     <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Sync Results</h3>
//
//                     <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//                         <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
//                             <div className="text-sm text-gray-500 dark:text-gray-400">Total Records</div>
//                             <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</div>
//                         </div>
//
//                         <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
//                             <div className="text-sm text-gray-500 dark:text-gray-400">Updated</div>
//                             <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.updated}</div>
//                         </div>
//
//                         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
//                             <div className="text-sm text-gray-500 dark:text-gray-400">Activated</div>
//                             <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.activated}</div>
//                         </div>
//
//                         <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
//                             <div className="text-sm text-gray-500 dark:text-gray-400">Quality</div>
//                             <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.quality}</div>
//                         </div>
//
//                         <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
//                             <div className="text-sm text-gray-500 dark:text-gray-400">Not Found</div>
//                             <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.notFound}</div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//
//             {errorRows.length > 0 && (
//                 <div>
//                     <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">SIM Cards Not Found</h3>
//                     <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
//                         <div className="overflow-x-auto">
//                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//                                 <thead className="bg-gray-50 dark:bg-gray-800">
//                                     <tr>
//                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial Number</th>
//                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dealer</th>
//                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Up Date</th>
//                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//                                     {errorRows.slice(0, 10).map((row, index) => (
//                                         <tr key={index}>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{row['Sim Serial Number']}</td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row['Dealer Name']}</td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row['Top Up Date']}</td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row['Top Up Amount']}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                         {errorRows.length > 10 && (
//                             <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400">
//                                 Showing 10 of {errorRows.length} not found SIM cards
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
// "use client"
// import { useState, useCallback, useEffect } from 'react';
//
// export default function ImprovedPDFTextExtractor() {
//   const [text, setText] = useState('');
//   const [fileName, setFileName] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [progress, setProgress] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);
//   const [pdfjsLib, setPdfjsLib] = useState(null);
//   const [isInitializing, setIsInitializing] = useState(true);
//
//   // Initialize PDF.js
//   useEffect(() => {
//     async function initializePdfJs() {
//       try {
//         setIsInitializing(true);
//         // Dynamically import PDF.js library
//         const pdfjs = await import('pdfjs-dist/webpack');
//
//         // Set up the worker using the webpack approach
//         // This way, the worker will always match the library version
//         setPdfjsLib(pdfjs);
//         setIsInitializing(false);
//       } catch (err) {
//         console.error('Error initializing PDF.js:', err);
//         setError('Failed to initialize PDF processing library. Please try again later.');
//         setIsInitializing(false);
//       }
//     }
//
//     initializePdfJs();
//   }, []);
//
//   const normalizeText = (text) => {
//     // Remove excessive whitespace and normalize line breaks
//     return text
//       .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
//       .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
//       .trim();
//   };
//
//   const extractText = useCallback(async (file) => {
//     if (!pdfjsLib) {
//       setError('PDF processing library not initialized yet. Please try again.');
//       return;
//     }
//
//     try {
//       setLoading(true);
//       setError('');
//       setText('');
//       setProgress(0);
//
//       // Read the file as ArrayBuffer
//       const arrayBuffer = await file.arrayBuffer();
//
//       // Load the PDF document with password support
//       // @ts-ignore
//       const loadingTask = pdfjsLib.getDocument({
//         data: arrayBuffer,
//         // Enable additional features for better text extraction
//         useSystemFonts: true,
//         disableFontFace: false,
//       });
//
//       // Handle password-protected PDFs
//       loadingTask.onPassword = (callback: (arg0: string) => void, reason: number) => {
//         const password = prompt(
//           reason === 1
//             ? 'Enter password to open this PDF file:'
//             : 'Invalid password. Please try again:',
//           ''
//         );
//
//         if (password) {
//           callback(password);
//         } else {
//           setError('Password required to extract text from this PDF.');
//           setLoading(false);
//           loadingTask.destroy();
//         }
//       };
//
//       const pdf = await loadingTask.promise;
//
//       // Get total number of pages
//       const numPages = pdf.numPages;
//       setTotalPages(numPages);
//
//       let fullText = '';
//
//       // Process pages in batches to avoid memory issues with large PDFs
//       const BATCH_SIZE = 10;
//       for (let i = 1; i <= numPages; i += BATCH_SIZE) {
//         const batch = [];
//
//         // Create batch of promises for current set of pages
//         for (let j = i; j <= Math.min(i + BATCH_SIZE - 1, numPages); j++) {
//           batch.push(processPage(pdf, j));
//         }
//
//         // Process batch
//         const batchResults = await Promise.all(batch);
//         fullText += batchResults.join('\n\n');
//
//         // Update progress after each batch
//         setProgress(Math.min(i + BATCH_SIZE - 1, numPages) / numPages * 100);
//       }
//
//       setText(normalizeText(fullText));
//       setLoading(false);
//       setProgress(100);
//     } catch (err) {
//       console.error('Error extracting text:', err);
//       setError(`Failed to extract text: ${err.message || 'Please make sure it is a valid PDF file.'}`);
//       setLoading(false);
//     }
//   }, [pdfjsLib]);
//
//   const processPage = async (pdf, pageNum) => {
//     try {
//       // Get the page
//       const page = await pdf.getPage(pageNum);
//
//       // Get text content with enhanced options
//       const textContent = await page.getTextContent({
//         normalizeWhitespace: true,
//         disableCombineTextItems: false
//       });
//
//       // Track lines for better paragraph detection
//       let lastY = null;
//       let lines = [];
//       let currentLine = [];
//
//       // Process each text item
//       textContent.items.forEach(item => {
//         // Skip empty items
//         if (!item.str.trim()) return;
//
//         // Check if we're on a new line based on y-position
//         if (lastY !== null && Math.abs(lastY - item.transform[5]) > 1) {
//           // New line detected
//           if (currentLine.length > 0) {
//             lines.push(currentLine.join(' '));
//             currentLine = [];
//           }
//         }
//
//         currentLine.push(item.str);
//         lastY = item.transform[5];
//       });
//
//       // Add the last line if it exists
//       if (currentLine.length > 0) {
//         lines.push(currentLine.join(' '));
//       }
//
//       // Combine lines into paragraphs
//       const pageText = lines.join('\n');
//
//       return `--- Page ${pageNum} ---\n${pageText}`;
//     } catch (err) {
//       console.error(`Error processing page ${pageNum}:`, err);
//       return `[Error extracting text from page ${pageNum}]`;
//     }
//   };
//
//   const handleFileChange = useCallback(async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//
//     if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
//       setError('Please select a valid PDF file.');
//       return;
//     }
//
//     setFileName(file.name);
//     await extractText(file);
//   }, [extractText]);
//
//   const handleDrop = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//
//     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
//       const file = e.dataTransfer.files[0];
//       if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
//         setError('Please select a valid PDF file.');
//         return;
//       }
//
//       setFileName(file.name);
//       extractText(file);
//     }
//   }, [extractText]);
//
//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//   }, []);
//
//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
//       <h1 className="text-2xl font-bold mb-6 text-gray-800">Enhanced PDF Text Extractor</h1>
//
//       {isInitializing ? (
//         <div className="p-4 mb-6 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
//           Initializing PDF processor...
//         </div>
//       ) : (
//         <div className="mb-6">
//           <div
//             onDrop={handleDrop}
//             onDragOver={handleDragOver}
//             className="block w-full text-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
//           >
//             <label htmlFor="pdf-upload" className="cursor-pointer">
//               <div className="flex flex-col items-center justify-center">
//                 <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
//                 </svg>
//                 <span className="text-gray-600 font-medium">Click to upload PDF or drag and drop</span>
//                 <span className="text-gray-500 text-sm mt-1">{fileName || 'No file selected'}</span>
//               </div>
//             </label>
//             <input
//               id="pdf-upload"
//               type="file"
//               accept=".pdf,application/pdf"
//               className="hidden"
//               onChange={handleFileChange}
//             />
//           </div>
//         </div>
//       )}
//
//       {error && (
//         <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md border border-red-200">
//           {error}
//         </div>
//       )}
//
//       {loading && (
//         <div className="py-4 mb-6">
//           <div className="flex justify-between items-center mb-2">
//             <span className="text-gray-600">Extracting text... {totalPages > 0 ? `(Page ${Math.ceil(progress / 100 * totalPages)} of ${totalPages})` : ''}</span>
//             <span className="text-gray-600">{progress.toFixed(0)}%</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2.5">
//             <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
//           </div>
//         </div>
//       )}
//
//       {text && (
//         <div className="mt-6">
//           <div className="flex justify-between items-center mb-3">
//             <h2 className="text-xl font-semibold text-gray-700">Extracted Text:</h2>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => {
//                   const blob = new Blob([text], { type: 'text/plain' });
//                   const url = URL.createObjectURL(blob);
//                   const a = document.createElement('a');
//                   a.href = url;
//                   a.download = fileName.replace('.pdf', '') + '-extracted.txt';
//                   document.body.appendChild(a);
//                   a.click();
//                   document.body.removeChild(a);
//                   URL.revokeObjectURL(url);
//                 }}
//                 className="p-2 bg-blue-100 rounded-md hover:bg-blue-200 text-blue-700 text-sm flex items-center"
//                 title="Download as text file"
//               >
//                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//                 </svg>
//                 Download
//               </button>
//               <button
//                 onClick={() => navigator.clipboard.writeText(text)}
//                 className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700 text-sm flex items-center"
//                 title="Copy to clipboard"
//               >
//                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
//                 </svg>
//                 Copy
//               </button>
//             </div>
//           </div>
//           <div className="relative">
//             <pre className="bg-white p-4 rounded-md border border-gray-300 text-gray-800 text-sm h-96 overflow-auto whitespace-pre-wrap">
//               {text}
//             </pre>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }