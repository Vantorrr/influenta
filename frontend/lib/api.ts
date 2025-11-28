import axios, { AxiosError } from 'axios'
import type { 
  ApiResponse, 
  PaginatedResponse,
  User,
  Blogger,
  Advertiser,
  Listing,
  Response,
  Message,
  BloggerFilters,
  ListingFilters,
  SocialPlatform
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Get Telegram init data
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData
    if (initData) {
      config.headers['X-Telegram-Init-Data'] = initData
    }
  }
  
  // Get JWT token if exists
  const token = localStorage.getItem('influenta_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<any>>) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // Сбрасываем сессию корректно
      localStorage.removeItem('influenta_token')
      localStorage.removeItem('influenta_user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  async loginWithTelegram(initData: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await api.post('/auth/telegram', { initData })
    return response.data
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get('/auth/me')
    return response.data
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get('/auth/me')
    return response.data
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.patch('/auth/profile', data)
    return response.data
  },
}

// Bloggers API
export const bloggersApi = {
  async createProfile(data: Partial<Blogger>): Promise<ApiResponse<Blogger>> {
    const response = await api.post('/bloggers', data)
    return response.data
  },

  async getProfile(): Promise<ApiResponse<Blogger>> {
    const response = await api.get('/bloggers/profile')
    return response.data
  },

  async updateProfile(data: Partial<Blogger>): Promise<ApiResponse<Blogger>> {
    const response = await api.patch('/bloggers/profile', data)
    return response.data
  },

  async search(
    filters: BloggerFilters,
    page = 1,
    limit = 500
  ): Promise<PaginatedResponse<Blogger>> {
    const params: Record<string, any> = { page, limit }
    if (filters?.search) params.search = filters.search
    if (filters?.verifiedOnly) params.verifiedOnly = true
    if (filters?.categories && filters.categories.length > 0) params.categories = filters.categories.join(',')
    if (typeof filters?.minSubscribers === 'number') params.minSubscribers = filters.minSubscribers
    if (typeof filters?.maxSubscribers === 'number') params.maxSubscribers = filters.maxSubscribers
    if (typeof filters?.minPrice === 'number') params.minPrice = filters.minPrice
    if (typeof filters?.maxPrice === 'number') params.maxPrice = filters.maxPrice

    const response = await api.get('/bloggers/search', { params })
    return response.data
  },

  async getById(id: string): Promise<ApiResponse<Blogger>> {
    const response = await api.get(`/bloggers/${id}`)
    return response.data
  },
}

// Advertisers API
export const advertisersApi = {
  async createProfile(data: Partial<Advertiser>): Promise<ApiResponse<Advertiser>> {
    const response = await api.post('/advertisers', data)
    return response.data
  },

  async getProfile(): Promise<ApiResponse<Advertiser>> {
    const response = await api.get('/advertisers/profile')
    return response.data
  },

  async updateProfile(data: Partial<Advertiser>): Promise<ApiResponse<Advertiser>> {
    const response = await api.patch('/advertisers/profile', data)
    return response.data
  },

  async getById(id: string): Promise<ApiResponse<Advertiser>> {
    const response = await api.get(`/advertisers/${id}`)
    return response.data
  },
}

// Listings API
export const listingsApi = {
  async create(data: Partial<Listing>): Promise<ApiResponse<Listing>> {
    const response = await api.post('/listings', data)
    return response.data
  },

  async update(id: string, data: Partial<Listing>): Promise<ApiResponse<Listing>> {
    const response = await api.patch(`/listings/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/listings/${id}`)
    return response.data
  },

  async search(
    filters: ListingFilters,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Listing>> {
    const response = await api.get('/listings/search', {
      params: { ...filters, page, limit },
    })
    return response.data
  },

  async getById(id: string): Promise<ApiResponse<Listing>> {
    const response = await api.get(`/listings/${id}`)
    return response.data
  },

  async getMyListings(page = 1, limit = 20): Promise<PaginatedResponse<Listing>> {
    const response = await api.get('/listings/my', {
      params: { page, limit },
    })
    return response.data
  },

  async updateStatus(id: string, status: string): Promise<ApiResponse<Listing>> {
    const response = await api.patch(`/listings/${id}/status`, { status })
    return response.data
  },

}

// Responses API
export const responsesApi = {
  async create(data: {
    listingId: string
    message: string
    proposedPrice: number
    proposalDetails?: any
  }): Promise<ApiResponse<Response>> {
    const response = await api.post('/responses', data)
    return response.data
  },

  async update(id: string, data: Partial<Response>): Promise<ApiResponse<Response>> {
    const response = await api.patch(`/responses/${id}`, data)
    return response.data
  },

  async accept(id: string): Promise<ApiResponse<Response>> {
    const response = await api.post(`/responses/${id}/accept`)
    return response.data
  },

  async reject(id: string, reason: string): Promise<ApiResponse<Response>> {
    const response = await api.post(`/responses/${id}/reject`, { reason })
    return response.data
  },

  async withdraw(id: string): Promise<ApiResponse<Response>> {
    const response = await api.post(`/responses/${id}/withdraw`)
    return response.data
  },

  async getMyResponses(
    type: 'sent' | 'received',
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Response>> {
    const response = await api.get(`/responses/my/${type}`, {
      params: { page, limit },
    })
    return response.data
  },

  async getById(id: string): Promise<ApiResponse<Response>> {
    const response = await api.get(`/responses/${id}`)
    return response.data
  },

  async getByListing(listingId: string): Promise<PaginatedResponse<Response>> {
    const response = await api.get(`/responses/listing/${listingId}`)
    return response.data
  },
}

// Messages API
export const messagesApi = {
  async send(responseId: string, content: string, attachments?: any[]): Promise<ApiResponse<Message>> {
    const response = await api.post('/chat/messages', {
      responseId,
      content,
      attachments,
    })
    return response.data
  },

  async getByResponse(responseId: string, page = 1, limit = 50): Promise<PaginatedResponse<Message>> {
    const response = await api.get(`/chat/messages/${responseId}`, {
      params: { page, limit },
    })
    return response.data
  },

  async markAsRead(id: string): Promise<ApiResponse<Message>> {
    const response = await api.post(`/chat/messages/${id}/read`)
    return response.data
  },
  
  async getChatList(): Promise<ApiResponse<any[]>> {
    const response = await api.get('/chat/list')
    return response.data
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.get('/chat/unread-count')
    return response.data
  },
}

// Stats API
export interface DashboardStats {
  profileViews: number
  profileViewsChange?: number
  activeResponses?: number
  activeResponsesChange?: number
  activeCampaigns?: number
  activeCampaignsChange?: number
  totalResponses?: number
  totalResponsesChange?: number
  firstListingWithResponses?: string | null
  recentActivity: any[]
  totalSpent?: number
  roi?: number
}

export const statsApi = {
  async getDashboard(): Promise<DashboardStats> {
    const response = await api.get('/stats/dashboard')
    return response.data
  },
  async getSeries(): Promise<{ labels: string[]; series: { name: string; data: number[] }[] }> {
    const response = await api.get('/stats/series')
    return response.data
  },
}

// Offers API
export const offersApi = {
  async create(data: {
    bloggerId: string
    message?: string
    proposedBudget: number
    projectTitle?: string
    projectDescription?: string
    format?: string
    deadline?: string
  }) {
    const response = await api.post('/offers', data)
    return response.data
  },

  async getMy() {
    const response = await api.get('/offers/my')
    return response.data
  },

  async getById(id: string) {
    const response = await api.get(`/offers/${id}`)
    return response.data
  },

  async respond(id: string, data: { accept: boolean; rejectionReason?: string }) {
    const response = await api.post(`/offers/${id}/respond`, data)
    return response.data
  },
}

// Analytics API
export const analyticsApi = {
  async track(event: string, params?: { targetType?: string; targetId?: string; targetUserId?: string; metadata?: any }) {
    const response = await api.post('/analytics/track', { event, ...params })
    return response.data
  },
}

// Social Platforms API
export const socialPlatformsApi = {
  async create(data: Partial<SocialPlatform>): Promise<SocialPlatform> {
    const response = await api.post('/social-platforms', data)
    return response.data
  },

  async getMyPlatforms(): Promise<SocialPlatform[]> {
    const response = await api.get('/social-platforms')
    return response.data
  },

  async getUserPlatforms(userId: string): Promise<SocialPlatform[]> {
    const response = await api.get(`/social-platforms/user/${userId}`)
    return response.data
  },

  async update(id: string, data: Partial<SocialPlatform>): Promise<SocialPlatform> {
    const response = await api.patch(`/social-platforms/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete(`/social-platforms/${id}`)
    return response.data
  },

  async addScreenshot(id: string, screenshotUrl: string): Promise<SocialPlatform> {
    const response = await api.post(`/social-platforms/${id}/screenshot`, { screenshotUrl })
    return response.data
  },
}

export default api

