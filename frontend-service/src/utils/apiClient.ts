const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiClient {
  async request(endpoint: string, options: RequestInit = {}, token?: string): Promise<any> {
    const authToken = token || localStorage.getItem('nutriconnect_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config);
      
      if (response.status === 401) {
        localStorage.removeItem('nutriconnect_token');
        window.location.href = '/login';
        return;
      }

      return await response.json();
    } catch (error: any) {
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
  
  delete(endpoint: string) { 
    return this.request(endpoint, { method: 'DELETE' }); 
  }
}

export const apiClient = new ApiClient();
