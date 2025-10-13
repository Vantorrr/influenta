import { PartialType } from '@nestjs/swagger';
import { CreateSocialPlatformDto } from './create-social-platform.dto';

export class UpdateSocialPlatformDto extends PartialType(CreateSocialPlatformDto) {}
