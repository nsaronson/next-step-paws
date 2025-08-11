// API Configuration
const API_BASE_URL = 'https://bhgnyo79aa.execute-api.us-east-1.amazonaws.com/prod';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'owner';
  dogName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  dogName: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  slot?: TimeSlot;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  isBooked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupClass {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  spots: number;
  maxSpots: number;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  enrolledStudents: string[];
  waitlist: string[];
  createdAt: string;
  updatedAt: string;
}

// Authentication Token Management
class TokenManager {
  private readonly TOKEN_KEY = 'auth_token';
  
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Basic token expiration check (JWT has 3 parts separated by dots)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

export const tokenManager = new TokenManager();

// HTTP Client
class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = tokenManager.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse error JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle responses that don't return JSON (like health check)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

// API Service Functions
export const apiService = {
  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiClient.get('/health');
  },

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    
    if (response.token) {
      tokenManager.setToken(response.token);
    }
    
    return response;
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    dogName?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    
    if (response.token) {
      tokenManager.setToken(response.token);
    }
    
    return response;
  },

  logout(): void {
    tokenManager.removeToken();
  },

  // Users
  async getUsers(role?: string): Promise<User[]> {
    const endpoint = role ? `/api/users?role=${role}` : '/api/users';
    return apiClient.get<User[]>(endpoint);
  },

  async getUser(id: string): Promise<User> {
    return apiClient.get<User>(`/api/users/${id}`);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return apiClient.put<User>(`/api/users/${id}`, data);
  },

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return apiClient.get<Booking[]>('/api/bookings');
  },

  async createBooking(data: {
    slotId: string;
    dogName: string;
    notes?: string;
  }): Promise<Booking> {
    return apiClient.post<Booking>('/api/bookings', data);
  },

  async updateBooking(id: string, data: {
    dogName?: string;
    notes?: string;
    status?: string;
  }): Promise<Booking> {
    return apiClient.put<Booking>(`/api/bookings/${id}`, data);
  },

  async deleteBooking(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/api/bookings/${id}`);
  },

  // Time Slots
  async getSlots(params?: {
    date?: string;
    available?: boolean;
  }): Promise<TimeSlot[]> {
    let endpoint = '/api/slots';
    const queryParams = new URLSearchParams();
    
    if (params?.date) queryParams.append('date', params.date);
    if (params?.available) queryParams.append('available', 'true');
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    return apiClient.get<TimeSlot[]>(endpoint);
  },

  async createSlot(data: {
    date: string;
    time: string;
    duration?: number;
  }): Promise<TimeSlot> {
    return apiClient.post<TimeSlot>('/api/slots', data);
  },

  async deleteSlot(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/api/slots/${id}`);
  },

  // Group Classes
  async getClasses(level?: string): Promise<GroupClass[]> {
    const endpoint = level ? `/api/classes?level=${level}` : '/api/classes';
    return apiClient.get<GroupClass[]>(endpoint);
  },

  async createClass(data: {
    name: string;
    description?: string;
    schedule: string;
    maxSpots: number;
    price: number;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
  }): Promise<GroupClass> {
    return apiClient.post<GroupClass>('/api/classes', data);
  },

  async updateClass(id: string, data: Partial<GroupClass>): Promise<GroupClass> {
    return apiClient.put<GroupClass>(`/api/classes/${id}`, data);
  },

  async enrollInClass(id: string): Promise<{
    message: string;
    class: GroupClass;
  }> {
    return apiClient.post(`/api/classes/${id}/enroll`);
  },
};

// Authentication helper functions
export const authUtils = {
  isAuthenticated: () => tokenManager.isAuthenticated(),
  getToken: () => tokenManager.getToken(),
  logout: () => {
    tokenManager.removeToken();
    // Redirect to login or refresh page
    window.location.reload();
  },
};
