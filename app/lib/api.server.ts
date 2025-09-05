import { redirect } from "react-router";

// When called from loaders/actions, use the private API directly
// This runs on the server, so it can access the Docker network
const API_BASE_URL = 'http://private-api:3000';

export interface ApiError {
  error: string;
  details?: any;
  status: number;
}

export class ApiClient {
  private static async makeRequest(
    path: string,
    options: RequestInit = {},
    request?: Request
  ) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Forward cookies from the request for authentication
    if (request) {
      const cookie = request.headers.get('cookie');
      if (cookie) {
        headers['cookie'] = cookie;
      }
    }

    const url = `${API_BASE_URL}${path}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw { 
          error: error.error || 'Request failed', 
          details: error.details,
          status: response.status 
        };
      }

      return response.json();
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      throw { 
        error: 'Network error', 
        details: error,
        status: 500 
      };
    }
  }

  // Authentication
  static async login(email: string, password: string) {
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async getCurrentUser(request: Request) {
    return this.makeRequest('/auth/me', {}, request);
  }

  static async logout(request: Request) {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    }, request);
  }

  // Companies
  static async getCompanies(request: Request) {
    return this.makeRequest('/api/companies', {}, request);
  }

  static async getCompany(id: string, request: Request) {
    return this.makeRequest(`/api/companies/${id}`, {}, request);
  }

  static async createCompany(data: any, request: Request) {
    return this.makeRequest('/api/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }, request);
  }

  static async updateCompany(id: string, data: any, request: Request) {
    return this.makeRequest(`/api/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, request);
  }

  // Phone Numbers
  static async getPhoneNumbers(companyId: string, request: Request) {
    return this.makeRequest(`/api/phone-numbers/company/${companyId}`, {}, request);
  }

  static async getPhoneNumber(phoneNumber: string, request: Request) {
    return this.makeRequest(`/api/phone-numbers/lookup/${phoneNumber}`, {}, request);
  }

  static async createPhoneNumber(data: any, request: Request) {
    return this.makeRequest('/api/phone-numbers', {
      method: 'POST',
      body: JSON.stringify(data),
    }, request);
  }

  static async updatePhoneNumber(id: string, data: any, request: Request) {
    return this.makeRequest(`/api/phone-numbers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, request);
  }

  // Calls
  static async getCalls(params: URLSearchParams, request: Request) {
    return this.makeRequest(`/api/calls?${params.toString()}`, {}, request);
  }

  static async getCall(identifier: string, request: Request) {
    return this.makeRequest(`/api/calls/${identifier}`, {}, request);
  }

  static async getCallTranscripts(callSid: string, request: Request) {
    return this.makeRequest(`/api/calls/${callSid}/transcripts`, {}, request);
  }

  static async getCallStats(params: URLSearchParams, request: Request) {
    return this.makeRequest(`/api/calls/stats/summary?${params.toString()}`, {}, request);
  }

  // Callbacks
  static async getCallbacks(request: Request) {
    return this.makeRequest('/api/callbacks', {}, request);
  }

  static async createCallback(data: any, request: Request) {
    return this.makeRequest('/api/calls/callbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    }, request);
  }

  static async updateCallbackStatus(id: string, status: string, request: Request) {
    return this.makeRequest(`/callbacks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, request);
  }

  // Data Collection (Contacts with collected data)
  static async getDataCollection(params: URLSearchParams, request: Request) {
    return this.makeRequest(`/api/contacts?${params.toString()}`, {}, request);
  }
}

// Session management utilities
export async function requireAuth(request: Request) {
  try {
    const user = await ApiClient.getCurrentUser(request);
    if (!user) {
      throw redirect('/login');
    }
    return user;
  } catch (error) {
    throw redirect('/login');
  }
}

export async function getOptionalAuth(request: Request) {
  try {
    return await ApiClient.getCurrentUser(request);
  } catch {
    return null;
  }
}