// src/pages/Reports/types.ts

export interface SafaricomRecord {
  tmDate: string;
  id: string;
  dateId: string;
  month: string;
  dealerShortcode: string;
  dealerName: string;
  simSerialNumber: string;
  topUpDate: string;
  topUpAmount: number;
  agentMSISDN: string;
  ba: string;
  region: string;
  territory: string;
  cluster: string;
  cumulativeUsage: number;
  cumulativeCommission: string;
  fraudFlagged: string;
  fraudSuspensionDate: string;
  fraudReason: string;
  role: string;
  quality: string;
}

export interface DatabaseRecord {
  simSerialNumber: string;
  simId: string;
  team: string;
  uploadedBy: string;
  createdAt: string;
  // Additional database fields can be added here
}

export interface Report {
  records: SafaricomRecord[];
  filename: string;
  uploadDate: string;
  recordCount: number;
}

export interface ProcessedRecord extends SafaricomRecord {
  matched: boolean;
  qualitySim: boolean;
  team: string;
  uploadedBy: string;
}

export interface TeamReport {
  teamName: string;
  records: ProcessedRecord[];
  matchedCount: number;
  qualityCount: number;
}

export interface ProcessedReport {
  rawRecords: ProcessedRecord[];
  teamReports: TeamReport[];
  matchedCount: number;
  qualityCount: number;
  unmatchedCount: number;
  totalCount: number;
  // rawData: any; // Excel data
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: any;
}