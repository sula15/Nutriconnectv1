const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3002';
const PAYMENT_SERVICE_URL = process.env.REACT_APP_PAYMENT_SERVICE_URL || 'http://localhost:3003';

// Service URL mapping
const SERVICE_ENDPOINTS: Record<string, string> = {
  // Auth Service (port 3001)
  '/auth': AUTH_SERVICE_URL,
  '/menus': AUTH_SERVICE_URL,
  '/nutrition': AUTH_SERVICE_URL,
  '/v1': AUTH_SERVICE_URL,
  
  // Order Service (port 3002)
  '/orders': ORDER_SERVICE_URL,
  
  // Payment Service (port 3003)
  '/payments': PAYMENT_SERVICE_URL
};

class ApiClient {
  // Determine which service to call based on endpoint
  private getServiceUrl(endpoint: string): string {
    // Find matching service endpoint
    const serviceKey = Object.keys(SERVICE_ENDPOINTS).find(key => 
      endpoint.startsWith(key)
    );
    
    // Return the corresponding service URL or default to auth service
    return serviceKey ? SERVICE_ENDPOINTS[serviceKey] : AUTH_SERVICE_URL;
  }

  async request(endpoint: string, options: RequestInit = {}, token?: string): Promise<any> {
    const authToken = token || localStorage.getItem('nutriconnect_token');
    const serviceUrl = this.getServiceUrl(endpoint);
    const fullUrl = `${serviceUrl}/api${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${fullUrl}`);
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(fullUrl, config);
      
      if (response.status === 401) {
        console.warn('🔐 Authentication failed - redirecting to login');
        localStorage.removeItem('nutriconnect_token');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      console.log(`📡 API Response from ${serviceUrl}:`, data);
      return data;
    } catch (error: any) {
      console.error(`❌ API Error for ${fullUrl}:`, error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  get(endpoint: string, token?: string) { 
    return this.request(endpoint, {}, token); 
  }
  
  post(endpoint: string, data: any) { 
    return this.request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  }
  
  put(endpoint: string, data: any) { 
    return this.request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }); 
  }

  patch(endpoint: string, data: any) { 
    return this.request(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }); 
  }
  
  delete(endpoint: string) { 
    return this.request(endpoint, { method: 'DELETE' }); 
  }
}

export const apiClient = new ApiClient();