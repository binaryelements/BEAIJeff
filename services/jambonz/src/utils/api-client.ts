interface ApiClientConfig {
  baseUrl: string;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'http://private-api:3000'
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Phone number management
  async getPhoneNumberConfig(phoneNumber: string) {
    return this.request(`/api/phone-numbers/lookup/${phoneNumber}`, {
      method: 'GET',
    });
  }

  // Call management
  async createCall(data: {
    callSid: string;
    companyId?: number;
    phoneNumberId?: number;
    phoneNumber?: string;
    calledNumber?: string;
    status?: string;
    metadata?: Record<string, any>;
  }) {
    return this.request('/api/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCall(callSid: string, data: {
    status?: string;
    department?: string;
    transferReason?: string;
    resolution?: string;
    customerSatisfied?: boolean;
    conversationSummary?: string;
    endedAt?: string;
    duration?: number;
    metadata?: Record<string, any>;
  }) {
    return this.request(`/api/calls/${callSid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addTranscripts(callSid: string, transcripts: Array<{
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>) {
    return this.request('/api/calls/transcripts', {
      method: 'POST',
      body: JSON.stringify({
        callSid,
        transcripts,
      }),
    });
  }

  async addEvent(callSid: string, eventType: string, eventData?: Record<string, any>) {
    return this.request('/api/calls/events', {
      method: 'POST',
      body: JSON.stringify({
        callSid,
        eventType,
        eventData,
      }),
    });
  }

  async createCallback(data: {
    callId?: number;
    phoneNumber: string;
    preferredTime: string;
    topic: string;
    scheduledFor?: string;
  }) {
    return this.request('/api/callbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Contact management
  async searchContacts(companyId: number, params: {
    query?: string;
    phoneNumber?: string;
    name?: string;
    email?: string;
  }) {
    const queryParams = new URLSearchParams({
      companyId: companyId.toString(),
      ...params
    });
    return this.request(`/api/contacts/search?${queryParams}`, {
      method: 'GET',
    });
  }

  async getContactByPhone(companyId: number, phoneNumber: string) {
    return this.request(`/api/contacts/lookup/${phoneNumber}?companyId=${companyId}`, {
      method: 'GET',
    });
  }

  async createOrUpdateContact(contactData: {
    companyId: number;
    name: string;
    phoneNumber: string;
    email?: string;
    companyName?: string;
    department?: string;
    role?: string;
    notes?: string;
    customFields?: Record<string, any>;
  }) {
    return this.request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateCallWithContact(callSid: string, contactId: number, collectedData: any) {
    return this.request(`/api/calls/${callSid}`, {
      method: 'PATCH',
      body: JSON.stringify({
        contactId,
        collectedData,
      }),
    });
  }
}

// Utility function for parsing destination
export const parseDestination = (transferNumber: string, transferTrunk?: string) => {
  if (transferTrunk) {
    return `${transferNumber}@${transferTrunk}`;
  }
  return transferNumber;
};

// Create singleton instance
const apiClient = new ApiClient({
  baseUrl: process.env.PRIVATE_API_URL || 'http://private-api:3000'
});

export default apiClient;