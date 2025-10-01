import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response as Resp, ResponseStatus } from './entities/response.entity';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { ListingsService } from '@/listings/listings.service';
import { Blogger } from '@/bloggers/entities/blogger.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { Listing } from '@/listings/entities/listing.entity';
import { TelegramService } from '@/telegram/telegram.service';
import { ConfigService } from '@nestjs/config';

@Controller('responses')
@UseGuards(JwtAuthGuard)
export class ResponsesController {
  constructor(
    @InjectRepository(Resp) private readonly responsesRepo: Repository<Resp>,
    @InjectRepository(Blogger) private readonly bloggersRepo: Repository<Blogger>,
    @InjectRepository(Advertiser) private readonly advertisersRepo: Repository<Advertiser>,
    @InjectRepository(Listing) private readonly listingsRepo: Repository<Listing>,
    private readonly listingsService: ListingsService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async create(
    @Body() data: { listingId: string; message: string; proposedPrice: number },
    @CurrentUser() user: User,
  ) {
    // bloggers only can respond
    if (user.role !== 'blogger') {
      return { success: false, message: 'Only bloggers can respond' } as any
    }
    // ensure blogger entity exists for this user
    const existing = await this.bloggersRepo.findOne({ where: { userId: user.id } })
    const blogger: Blogger = existing
      ? existing
      : (await this.bloggersRepo.save(
          this.bloggersRepo.create({ user: user as any, userId: user.id } as any) as any,
        )) as any
    // verify listing exists (will throw if not)
    await this.listingsService.findOne(data.listingId)
    const resp = this.responsesRepo.create({
      listingId: data.listingId as any,
      bloggerId: blogger.id as any,
      message: data.message,
      proposedPrice: data.proposedPrice,
      status: ResponseStatus.PENDING,
    })
    await this.responsesRepo.save(resp)

    // increment listing responsesCount
    try {
      const lst = await this.listingsRepo.findOne({ where: { id: data.listingId } })
      if (lst) {
        lst.responsesCount = (lst.responsesCount || 0) + 1
        await this.listingsRepo.save(lst)
      }
    } catch {}

    // Send Telegram notifications
    try {
      const listing = await this.listingsRepo.findOne({ where: { id: data.listingId }, relations: ['advertiser', 'advertiser.user'] })
      const frontendUrl = this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app'
      const botUsername = this.configService.get('app.telegram.botUsername') || process.env.TELEGRAM_BOT_USERNAME
      const title = listing?.title || 'объявление'
      const advTgId = (listing as any)?.advertiser?.user?.telegramId
      const messageText = `📩 <b>Новый отклик</b>\n\nНа ваше объявление: <b>${title}</b>\nЦена: ${data.proposedPrice}₽`;
      if (advTgId) {
        const webAppUrl = `${frontendUrl}/listings/${data.listingId}?source=bot&focus=response`
        const startAppParam = `listing_${data.listingId}`
        const startAppUrl = botUsername ? `https://t.me/${botUsername}?startapp=${encodeURIComponent(startAppParam)}` : undefined

        const kbRow: any[] = [{ text: 'Открыть объявление', web_app: { url: webAppUrl } }]
        if (startAppUrl) {
          kbRow.push({ text: 'Открыть в Mini App', url: startAppUrl })
        }

        await this.telegramService.sendMessage(parseInt(String(advTgId), 10), messageText, {
          inline_keyboard: [kbRow],
        })
      }
    } catch {}
    return { success: true, data: resp }
  }

  @Get('listing/:id')
  async byListing(@Param('id') listingId: string, @CurrentUser() user: User) {
    const listing = await this.listingsRepo.findOne({ where: { id: listingId }, relations: ['advertiser'] })
    if (!listing) return { data: [], total: 0 }

    // ensure requester is owner (advertiser)
    const advertiser = await this.advertisersRepo.findOne({ where: { userId: user.id } })
    if (!advertiser || advertiser.id !== listing.advertiserId) {
      return { data: [], total: 0 }
    }

    const list = await this.responsesRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.blogger', 'blogger')
      .leftJoinAndSelect('blogger.user', 'bloggerUser')
      .where('r.listingId = :id', { id: listingId })
      .orderBy('r.createdAt', 'DESC')
      .getMany()

    return { data: list, total: list.length }
  }

  @Get('my/sent')
  async mySent(@CurrentUser() user: User) {
    // Blogger responses
    const blogger = await this.bloggersRepo.findOne({ where: { userId: user.id } })
    if (!blogger) return { data: [], total: 0 }
    const list = await this.responsesRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.listing', 'listing')
      .where('r.bloggerId = :id', { id: blogger.id })
      .orderBy('r.createdAt', 'DESC')
      .getMany()
    return { data: list, total: list.length }
  }

  @Get('my/received')
  async myReceived(@CurrentUser() user: User) {
    // Advertiser received responses
    const advertiser = await this.advertisersRepo.findOne({ where: { userId: user.id } })
    if (!advertiser) return { data: [], total: 0 }
    const list = await this.responsesRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.listing', 'listing')
      .where('listing.advertiserId = :aid', { aid: advertiser.id })
      .orderBy('r.createdAt', 'DESC')
      .getMany()
    return { data: list, total: list.length }
  }
}


