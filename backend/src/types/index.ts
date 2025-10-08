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

export enum PostFormat {
  POST = 'post',
  STORY = 'story',
  LIVE = 'live',
  POST_AND_STORY = 'post_and_story',
  ANY = 'any',
}

export enum ListingStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum ResponseStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

// Русские лейблы для сопоставления с сохраненными строками в БД
export const BLOGGER_CATEGORY_LABEL_RU: Record<BloggerCategory, string> = {
  [BloggerCategory.LIFESTYLE]: 'Лайфстайл',
  [BloggerCategory.TECH]: 'Технологии',
  [BloggerCategory.BEAUTY]: 'Красота',
  [BloggerCategory.FASHION]: 'Мода',
  [BloggerCategory.FOOD]: 'Еда',
  [BloggerCategory.TRAVEL]: 'Путешествия',
  [BloggerCategory.FITNESS]: 'Фитнес',
  [BloggerCategory.GAMING]: 'Игры',
  [BloggerCategory.EDUCATION]: 'Образование',
  [BloggerCategory.BUSINESS]: 'Бизнес',
  [BloggerCategory.ENTERTAINMENT]: 'Развлечения',
  [BloggerCategory.OTHER]: 'Другое',
}

