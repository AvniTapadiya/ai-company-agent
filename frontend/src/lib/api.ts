import { CompanyRequest, AnalyzeResponse, QualifyResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function analyzeCompany(data: CompanyRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
    },
    body: JSON.stringify({
      company_name: data.company_name,
      company_url: data.company_url,
      company_details: data.company_details || "",
    }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to analyze company (Status: ${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore parsing error, fallback to default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function qualifyCompany(data: CompanyRequest): Promise<QualifyResponse> {
  const response = await fetch(`${API_BASE_URL}/qualify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
    },
    body: JSON.stringify({
      company_name: data.company_name,
      company_url: data.company_url,
      company_details: data.company_details || "",
    }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to qualify company (Status: ${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore parsing error, fallback to default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
