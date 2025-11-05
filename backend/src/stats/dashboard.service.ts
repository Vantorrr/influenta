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
      const totalSpent = advertiser?.totalSpent || 0
      const roi = 0 // TODO: Рассчитывать ROI на основе реальных сделок

      return {
        profileViews,
        activeCampaigns,
        totalResponses,
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
}


