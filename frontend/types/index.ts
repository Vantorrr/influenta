// User types
export interface User {
  id: string
  telegramId: string
  username?: string
  firstName: string
  lastName?: string
  photoUrl?: string
  email?: string
  bio?: string
  role: UserRole
  isActive: boolean
  isVerified: boolean
    onboardingCompleted?: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  BLOGGER = 'blogger',
  ADVERTISER = 'advertiser',
  ADMIN = 'admin',
}

// Blogger types
export interface Blogger {
  id: string
  userId: string
  user?: User
  bio?: string
  categories: BloggerCategory[]
  subscribersCount: number
  averageViews: number
  engagementRate: number
  pricePerPost: number
  pricePerStory?: number
  postExamples: PostExample[]
  contacts?: ContactInfo
  isPublic: boolean
  isVerified: boolean
  rating: number
  completedCampaigns: number
  createdAt: Date
  updatedAt: Date
}

export interface PostExample {
  url: string
  description: string
  views: number
  date: Date
}

export interface ContactInfo {
  telegram?: string
  whatsapp?: string
  email?: string
  phone?: string
}

export enum BloggerCategory {
  LIFESTYLE = 'lifestyle',
  TECH = 'tech',
  BEAUTY = 'beauty',
  FASHION = 'fashion',
  FOOD = 'food',
  TRAVEL = 'travel',
  FITNESS = 'fitness',
  GAMING = 'gaming',
  EDUCATION = 'education',
  BUSINESS = 'business',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

// Advertiser types
export interface Advertiser {
  id: string
  userId: string
  user?: User
  companyName: string
  description?: string
  website?: string
  contacts?: ContactInfo
  campaignHistory: CampaignHistory[]
  isVerified: boolean
  rating: number
  completedCampaigns: number
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}

export interface CampaignHistory {
  title: string
  description: string
  budget: number
  date: Date
  bloggersCount: number
}

// Listing types
export interface Listing {
  id: string
  advertiserId: string
  advertiser?: Advertiser
  title: string
  description: string
  targetCategories: BloggerCategory[]
  budget: number
  format: PostFormat
  requirements?: ListingRequirements
  deadline?: Date
  status: ListingStatus
  viewsCount: number
  responsesCount: number
  additionalInfo?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ListingRequirements {
  minSubscribers?: number
  maxSubscribers?: number
  minEngagementRate?: number
  minRating?: number
  verifiedOnly?: boolean
}

export enum ListingStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum PostFormat {
  POST = 'post',
  STORY = 'story',
  LIVE = 'live',
  POST_AND_STORY = 'post_and_story',
  ANY = 'any',
}

// Response types
export interface Response {
  id: string
  listingId: string
  listing?: Listing
  bloggerId: string
  blogger?: Blogger
  message: string
  proposedPrice: number
  status: ResponseStatus
  rejectionReason?: string
  acceptedAt?: Date
  rejectedAt?: Date
  proposalDetails?: ProposalDetails
  createdAt: Date
  updatedAt: Date
}

export interface ProposalDetails {
  deliveryTime?: number // в днях
  examples?: string[]
  additionalServices?: string[]
}

export enum ResponseStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

// Message types
export interface Message {
  id: string
  responseId: string
  response?: Response
  senderId: string
  sender?: User
  content: string
  isRead: boolean
  readAt?: Date
  attachments?: MessageAttachment[]
  createdAt: Date
  updatedAt: Date
}

export interface MessageAttachment {
  type: 'image' | 'document' | 'link'
  url: string
  name?: string
  size?: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Filter types
export interface BloggerFilters {
  categories?: BloggerCategory[]
  minSubscribers?: number
  maxSubscribers?: number
  minPrice?: number
  maxPrice?: number
  minRating?: number
  verifiedOnly?: boolean
  search?: string
}

export interface ListingFilters {
  categories?: BloggerCategory[]
  minBudget?: number
  maxBudget?: number
  format?: PostFormat
  status?: ListingStatus
  search?: string
}

