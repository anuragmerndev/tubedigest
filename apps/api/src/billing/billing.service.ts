import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from 'standardwebhooks';
import { Organization, OrgPlan } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { Subscription } from './subscription.entity';
import { DodoClientService } from './dodo-client.service';

interface SubscriptionEventData {
  subscription_id: string;
  customer: { customer_id: string; email: string; name: string };
  status: string;
  next_billing_date?: string;
  previous_billing_date?: string;
}

interface WebhookEvent {
  type: string;
  data: SubscriptionEventData;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dodo: DodoClientService,
  ) {}

  private async getOrgForClerk(clerkId: string): Promise<Organization> {
    const user = await this.userRepo.findOne({ where: { clerkId } });
    if (!user?.orgId) throw new NotFoundException('Organisation not found');
    const org = await this.orgRepo.findOne({ where: { id: user.orgId } });
    if (!org) throw new NotFoundException('Organisation not found');
    return org;
  }

  async getSubscription(clerkId: string): Promise<Subscription | null> {
    const org = await this.getOrgForClerk(clerkId);
    return this.subscriptionRepo.findOne({ where: { orgId: org.id } });
  }

  async createCheckout(clerkId: string): Promise<{ checkout_url: string }> {
    const org = await this.getOrgForClerk(clerkId);

    const session = await this.dodo.client.checkoutSessions.create({
      product_cart: [{ product_id: process.env.DODO_PRODUCT_ID!, quantity: 1 }],
      customer: org.dodoCustomerId
        ? { customer_id: org.dodoCustomerId }
        : undefined,
      return_url: `${process.env.FRONTEND_URL}/dashboard?billing=success`,
    });

    if (!session.checkout_url) {
      throw new Error('Dodo did not return a checkout URL');
    }
    return { checkout_url: session.checkout_url };
  }

  async getBillingPortal(clerkId: string): Promise<{ link: string }> {
    const org = await this.getOrgForClerk(clerkId);
    if (!org.dodoCustomerId) {
      throw new NotFoundException(
        'No billing account found for this organisation',
      );
    }
    const session = await this.dodo.client.customers.customerPortal.create(
      org.dodoCustomerId,
    );
    return { link: session.link };
  }

  async handleWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const secret = process.env.DODO_WEBHOOK_SECRET!;
    const wh = new Webhook(secret);

    const webhookHeaders = {
      'webhook-id': String(headers['webhook-id'] ?? ''),
      'webhook-signature': String(headers['webhook-signature'] ?? ''),
      'webhook-timestamp': String(headers['webhook-timestamp'] ?? ''),
    };

    let event: WebhookEvent;
    try {
      event = wh.verify(
        rawBody.toString('utf8'),
        webhookHeaders,
      ) as WebhookEvent;
    } catch {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'subscription.active':
        await this.handleSubscriptionActive(event.data);
        break;
      case 'subscription.renewed':
        await this.handleSubscriptionRenewed(event.data);
        break;
      case 'subscription.cancelled':
      case 'subscription.expired':
        await this.handleSubscriptionEnded(event.data);
        break;
      case 'subscription.on_hold':
        await this.handleSubscriptionOnHold(event.data);
        break;
      default:
        break;
    }
  }

  private async handleSubscriptionActive(
    data: SubscriptionEventData,
  ): Promise<void> {
    const org = await this.orgRepo.findOne({
      where: { dodoCustomerId: data.customer.customer_id },
    });
    if (!org) return;

    await this.subscriptionRepo.upsert(
      {
        orgId: org.id,
        dodoSubscriptionId: data.subscription_id,
        status: 'active',
        currentPeriodStart: data.previous_billing_date
          ? new Date(data.previous_billing_date)
          : null,
        currentPeriodEnd: data.next_billing_date
          ? new Date(data.next_billing_date)
          : null,
      },
      { conflictPaths: ['orgId'] },
    );

    org.plan = OrgPlan.PRO;
    await this.orgRepo.save(org);
  }

  private async handleSubscriptionRenewed(
    data: SubscriptionEventData,
  ): Promise<void> {
    const sub = await this.subscriptionRepo.findOne({
      where: { dodoSubscriptionId: data.subscription_id },
    });
    if (!sub) return;

    sub.status = 'active';
    if (data.next_billing_date) {
      sub.currentPeriodEnd = new Date(data.next_billing_date);
    }
    await this.subscriptionRepo.save(sub);
  }

  private async handleSubscriptionEnded(
    data: SubscriptionEventData,
  ): Promise<void> {
    const sub = await this.subscriptionRepo.findOne({
      where: { dodoSubscriptionId: data.subscription_id },
    });
    if (!sub) return;

    sub.status = data.status;
    await this.subscriptionRepo.save(sub);

    const org = await this.orgRepo.findOne({ where: { id: sub.orgId } });
    if (org) {
      org.plan = OrgPlan.FREE;
      await this.orgRepo.save(org);
    }
  }

  private async handleSubscriptionOnHold(
    data: SubscriptionEventData,
  ): Promise<void> {
    const sub = await this.subscriptionRepo.findOne({
      where: { dodoSubscriptionId: data.subscription_id },
    });
    if (!sub) return;

    sub.status = 'on_hold';
    await this.subscriptionRepo.save(sub);
  }
}
