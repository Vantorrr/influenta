// Platform Configuration
export const PLATFORM_CONFIG = {
  name: 'Influencer Platform',
  description: 'Платформа для взаимодействия блогеров и рекламодателей',
  version: '1.0.0',
}

// Admin Configuration
export const ADMIN_CONFIG = {
  telegramIds: [
    741582706,   // Admin 1
    8141463258,  // Admin 2
  ],
  emails: [
    'admin@example.com',
  ],
}

// Commission Configuration
export const COMMISSION_CONFIG = {
  platformCommission: 0.1, // 10%
  minWithdrawal: 1000,
}

// Limits Configuration
export const LIMITS_CONFIG = {
  maxListingsPerAdvertiser: 10,
  maxResponsesPerListing: 50,
  minBloggerSubscribers: 1000,
  maxPostExamples: 5,
  maxFileSize: 10 * 1024 * 1024, // 10MB
}

// Categories Labels
export const CATEGORY_LABELS: Record<string, string> = {
  lifestyle: 'Лайфстайл',
  tech: 'Технологии',
  beauty: 'Красота',
  fashion: 'Мода',
  food: 'Еда',
  travel: 'Путешествия',
  fitness: 'Фитнес',
  gaming: 'Игры',
  education: 'Образование',
  business: 'Бизнес',
  entertainment: 'Развлечения',
  humor: 'Юмор',
  other: 'Другое',
}

// Post Format Labels
export const POST_FORMAT_LABELS: Record<string, string> = {
  post: 'Пост',
  story: 'Сторис',
  live: 'Эфир/Reels',
  post_and_story: 'Пост + Сторис',
  any: 'Любой формат',
}

// Status Labels
export const STATUS_LABELS: Record<string, string> = {
  // Listing statuses
  active: 'Активно',
  closed: 'Закрыто',
  paused: 'На паузе',
  completed: 'Завершено',
  // Response statuses
  pending: 'На рассмотрении',
  accepted: 'Принято',
  rejected: 'Отклонено',
  withdrawn: 'Отозвано',
}


















