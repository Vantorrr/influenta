import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'
import { AnalyticsEvent } from '@/analytics/analytics.entity'
import { User } from '@/users/entities/user.entity'
import { Blogger } from '@/bloggers/entities/blogger.entity'
import { Advertiser } from '@/advertisers/entities/advertiser.entity'
import { Listing, ListingStatus } from '@/listings/entities/listing.entity'
import { Response, ResponseStatus } from '@/responses/entities/response.entity'

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Blogger)
    private readonly bloggersRepo: Repository<Blogger>,
    @InjectRepository(Advertiser)
    private readonly advertisersRepo: Repository<Advertiser>,
    @InjectRepository(Listing)
    private readonly listingsRepo: Repository<Listing>,
    @InjectRepository(Response)
    private readonly responsesRepo: Repository<Response>,
  ) {}

  async getDashboard(userId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user) return { profileViews: 0, activeResponses: 0, recentActivity: [] }

    const profileViews = await this.analyticsRepo.count({ where: { event: 'profile_view', targetUserId: userId, createdAt: MoreThan(since) } }).catch(() => 0)

    if (user.role === 'blogger') {
      const blogger = await this.bloggersRepo.findOne({ where: { userId } }).catch(() => null)
      const activeResponses = blogger
        ? await this.responsesRepo.count({ where: { bloggerId: blogger.id, status: ResponseStatus.PENDING } }).catch(() => 0)
        : 0
      const acceptedResponses = blogger
        ? await this.responsesRepo.count({ where: { bloggerId: blogger.id, status: ResponseStatus.ACCEPTED } }).catch(() => 0)
        : 0
      return {
        profileViews,
        activeResponses,
        recentActivity: [],
      }
    }

    if (user.role === 'advertiser') {
      const advertiser = await this.advertisersRepo.findOne({ where: { userId } }).catch(() => null)
      const activeCampaigns = advertiser
        ? await this.listingsRepo.count({ where: { advertiserId: advertiser.id, status: ListingStatus.ACTIVE } }).catch(() => 0)
        : 0
      const totalResponses = advertiser
        ? await this.responsesRepo
            .createQueryBuilder('r')
            .innerJoin('r.listing', 'listing')
            .where('listing.advertiserId = :aid', { aid: advertiser.id })
            .andWhere('r.status = :status', { status: 'pending' })
            .getCount()
            .catch(() => 0)
        : 0
      
      // Найти первое объявление с pending откликами
      let firstListingWithResponses = null
      if (advertiser && totalResponses > 0) {
        const responseWithListing = await this.responsesRepo
          .createQueryBuilder('r')
          .innerJoin('r.listing', 'listing')
          .where('listing.advertiserId = :aid', { aid: advertiser.id })
          .andWhere('r.status = :status', { status: 'pending' })
          .select(['r.id', 'r.listingId'])
          .orderBy('r.createdAt', 'DESC')
          .getOne()
          .catch(() => null)
        
        if (responseWithListing) {
          firstListingWithResponses = responseWithListing.listingId
        }
      }
      
      const totalSpent = advertiser?.totalSpent || 0
      const roi = 0

      return {
        profileViews,
        activeCampaigns,
        totalResponses,
        firstListingWithResponses,
        totalSpent,
        roi,
        recentActivity: [],
      }
    }

    return {
      profileViews,
      activeResponses: 0,
      recentActivity: [],
    }
  }

  async getSeries(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    const days = 7
    const labels: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      labels.push(d.toISOString().slice(0, 10))
    }

    const viewsByDay: Record<string, number> = {}
    const responsesByDay: Record<string, number> = {}
    labels.forEach(l => { viewsByDay[l] = 0; responsesByDay[l] = 0 })

    // Profile views per day (analytics events)
    try {
      const raw = await this.analyticsRepo
        .createQueryBuilder('a')
        .select("to_char(a.createdAt, 'YYYY-MM-DD')", 'd')
        .addSelect('COUNT(*)', 'c')
        .where('a.event = :event', { event: 'profile_view' })
        .andWhere('a.targetUserId = :uid', { uid: userId })
        .andWhere("a.createdAt >= NOW() - INTERVAL '7 days'")
        .groupBy("to_char(a.createdAt, 'YYYY-MM-DD')")
        .getRawMany()
      raw.forEach((r: any) => { viewsByDay[r.d] = parseInt(r.c, 10) })
    } catch {}

    // Responses per day
    try {
      if (user?.role === 'blogger') {
        const blogger = await this.bloggersRepo.findOne({ where: { userId } })
        if (blogger) {
          const raw = await this.responsesRepo
            .createQueryBuilder('r')
            .select("to_char(r.createdAt, 'YYYY-MM-DD')", 'd')
            .addSelect('COUNT(*)', 'c')
            .where('r.bloggerId = :bid', { bid: blogger.id })
            .andWhere("r.createdAt >= NOW() - INTERVAL '7 days'")
            .groupBy("to_char(r.createdAt, 'YYYY-MM-DD')")
            .getRawMany()
          raw.forEach((r: any) => { responsesByDay[r.d] = parseInt(r.c, 10) })
        }
      } else if (user?.role === 'advertiser') {
        const advertiser = await this.advertisersRepo.findOne({ where: { userId } })
        if (advertiser) {
          const raw = await this.responsesRepo
            .createQueryBuilder('r')
            .innerJoin('r.listing', 'l')
            .select("to_char(r.createdAt, 'YYYY-MM-DD')", 'd')
            .addSelect('COUNT(*)', 'c')
            .where('l.advertiserId = :aid', { aid: advertiser.id })
            .andWhere("r.createdAt >= NOW() - INTERVAL '7 days'")
            .groupBy("to_char(r.createdAt, 'YYYY-MM-DD')")
            .getRawMany()
          raw.forEach((r: any) => { responsesByDay[r.d] = parseInt(r.c, 10) })
        }
      }
    } catch {}

    return {
      labels,
      series: [
        { name: 'Просмотры', data: labels.map(l => viewsByDay[l] || 0) },
        { name: 'Отклики', data: labels.map(l => responsesByDay[l] || 0) },
      ],
    }
  }
}

