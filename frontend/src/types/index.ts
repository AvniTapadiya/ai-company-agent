// Type definitions for AI Company Qualification System API

export interface CompanyRequest {
  company_name: string;
  company_url: string;
  company_details?: string;
}

export interface WebpageData {
  url: string;
  title: string;
  markdown: string;
}

export interface AnalyzeResponse {
  success: boolean;
  company_name?: string;
  website?: string;
  total_pages_scraped?: number;
  saved_to?: string;
  website_data?: WebpageData[];
  error?: string;
}

export interface QualificationData {
  qualified: boolean;
  lead_score: number;
  lead_status: 'HOT' | 'WARM' | 'COLD' | 'ERROR';
  best_service: string | null;
  secondary_service: string | null;
  pain_points: string[];
  buying_signals: string[];
  solutions: string[];
  why_hyperlinq: string;
}

export interface QualifyResponse {
  success: boolean;
  company_name?: string;
  qualification?: QualificationData;
  error?: string;
}
