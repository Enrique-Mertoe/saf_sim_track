// src/pages/Reports/utils/reportParser.ts
import * as XLSX from 'xlsx';
import {Report, SafaricomRecord, ValidationError} from '../types';

/**
 * Parse an Excel file containing Safaricom report data
 */
export const parseReport = async (file: File): Promise<Report> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file');
        }

        // Parse the Excel file
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        // Map to our data structure
        const records: SafaricomRecord[] = jsonData.map((row) => ({
          tmDate: row['TM Date'] || '',
          id: row['ID'] || '',
          dateId: row['ID Date'] || '',
          month: row['Month'] || '',
          dealerShortcode: row['Dealer Shortcode'] || '',
          dealerName: row['Dealer Name'] || '',
          simSerialNumber: row['Sim Serial Number'] || '',
          topUpDate: row['Top Up Date'] || '',
          topUpAmount: parseFloat(row['Top Up Amount']) || 0,
          agentMSISDN: row['Agent MSISDN'] || '',
          ba: row['BA'] || '',
          region: row['Region'] || '',
          territory: row['Territory'] || '',
          cluster: row['Cluster'] || '',
          cumulativeUsage: parseFloat(row['Cumulative Usage']) || 0,
          cumulativeCommission: row['Cumulative Commission'] || '',
          fraudFlagged: row['Fraud Flagged'] || '',
          fraudSuspensionDate: row['Fraud Suspension Date'] || '',
          fraudReason: row['Fraud Reason'] || '',
          role: row['Role'] || '',
          quality: row['Quality'] || '',
        }));

        resolve({
          records,
          filename: file.name,
          uploadDate: new Date().toISOString(),
          recordCount: records.length,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate the report data
 */
export const validateReport = (report: Report): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  // Validate each record
  report.records.forEach((record, index) => {
    // Check required fields
    if (!record.simSerialNumber) {
      errors.push({
        row: index + 2, // +2 because of the header row and 0-indexing
        column: 'Sim Serial Number',
        message: 'SIM Serial Number is required',
        value: record.simSerialNumber,
      });
    }

    // Validate SIM Serial Number format (should be numeric and have appropriate length)
    if (record.simSerialNumber && !/^\d{20}$/.test(record.simSerialNumber)) {
      errors.push({
        row: index + 2,
        column: 'Sim Serial Number',
        message: 'SIM Serial Number must be 20 digits',
        value: record.simSerialNumber,
      });
    }

    // Validate Top Up Amount (should be a number)
    if (isNaN(record.topUpAmount)) {
      errors.push({
        row: index + 2,
        column: 'Top Up Amount',
        message: 'Top Up Amount must be a number',
        value: record.topUpAmount,
      });
    }

    // Additional validations can be added here
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};