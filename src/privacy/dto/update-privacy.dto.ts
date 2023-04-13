import { PartialType } from '@nestjs/mapped-types';
import { CreatePrivacyDto } from './create-privacy.dto';

export class UpdatePrivacyDto extends PartialType(CreatePrivacyDto) {}
