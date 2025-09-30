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

@Controller('responses')
@UseGuards(JwtAuthGuard)
export class ResponsesController {
  constructor(
    @InjectRepository(Resp) private readonly responsesRepo: Repository<Resp>,
    @InjectRepository(Blogger) private readonly bloggersRepo: Repository<Blogger>,
    private readonly listingsService: ListingsService,
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
    let blogger = await this.bloggersRepo.findOne({ where: { id: user.id } })
    if (!blogger) {
      blogger = this.bloggersRepo.create({ id: user.id } as any)
      await this.bloggersRepo.save(blogger)
    }
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
    return { success: true, data: resp }
  }
}


