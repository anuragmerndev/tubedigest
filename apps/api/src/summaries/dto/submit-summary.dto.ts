import { IsUrl } from 'class-validator';

export class SubmitSummaryDto {
  @IsUrl({}, { message: 'Must be a valid URL' })
  url: string;
}
