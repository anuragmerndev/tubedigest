import { Injectable } from '@nestjs/common';
import DodoPayments from 'dodopayments';

@Injectable()
export class DodoClientService {
  readonly client: DodoPayments;

  constructor() {
    this.client = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY,
      environment:
        (process.env.DODO_ENVIRONMENT as 'test_mode' | 'live_mode') ??
        'test_mode',
    });
  }
}
