// backend/src/services/paymentService.ts
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { analyticsService } from './analyticsService';
import { emailService } from './emailService';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  maxUsers?: number;
  maxStorage?: number; // in GB
  maxFileSize?: number; // in MB
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
  subscriptionId?: string;
}

interface Invoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  description: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

class PaymentService {
  private stripe: Stripe;
  private subscriptionPlans: Map<string, SubscriptionPlan> = new Map();

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    this.initializeSubscriptionPlans();
  }

  private initializeSubscriptionPlans() {
    const plans: SubscriptionPlan[] = [
      {
        id: 'basic',
        name: 'Basic',
        price: 0,
        currency: 'usd',
        interval: 'month',
        features: [
          'Unlimited messages',
          'Up to 10 group chats',
          '1GB file storage',
          'Basic support'
        ],
        maxUsers: 10,
        maxStorage: 1,
        maxFileSize: 5,
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Everything in Basic',
          'Unlimited group chats',
          '10GB file storage',
          'Priority support',
          'Advanced emoji reactions',
          'Message scheduling',
          'Read receipts'
        ],
        maxUsers: 100,
        maxStorage: 10,
        maxFileSize: 25,
      },
      {
        id: 'business',
        name: 'Business',
        price: 19.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Everything in Premium',
          'Unlimited users',
          '100GB file storage',
          '24/7 priority support',
          'Advanced admin controls',
          'Analytics dashboard',
          'API access',
          'Custom branding'
        ],
        maxStorage: 100,
        maxFileSize: 100,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 49.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Everything in Business',
          'Unlimited storage',
          'Dedicated support manager',
          'Custom integrations',
          'SSO integration',
          'Advanced security features',
          'SLA guarantee',
          'On-premise deployment option'
        ],
        maxFileSize: 500,
      },
    ];

    plans.forEach(plan => {
      this.subscriptionPlans.set(plan.id, plan);
    });
  }

  // Create payment intent
  async createPaymentIntent(
    userId: string,
    amount: number,
    currency = 'usd',
    description?: string
  ): Promise<PaymentResult> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description: description || 'JustConnect Payment',
        metadata: {
          userId,
          userEmail: user.email,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    }
  }

  // Create subscription
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const plan = this.subscriptionPlans.get(planId);
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Create or retrieve Stripe customer
      let customer = await this.getOrCreateCustomer(user.email, userId);

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
    const subscription = await this.stripe.subscriptions.create({
  customer: customer.id,
  items: [
    {
      price: this.getPriceId(planId), // Use pre-created price IDs
    },
  ],
  payment_behavior: 'default_incomplete',
  payment_settings: { save_default_payment_method: 'on_subscription' },
  expand: ['latest_invoice.payment_intent'],
  metadata: {
    userId,
    planId,
  },
});

      // Save subscription to database
      await this.saveSubscriptionToDB(userId, planId, subscription);

      // Track revenue
      await analyticsService.trackRevenue(userId, plan.price, plan.currency, 'subscription');

      // Send confirmation email
      await emailService.sendEmail({
        to: user.email,
        subject: `Subscription Confirmation - ${plan.name}`,
        html: `
          <h2>Subscription Confirmed! 🎉</h2>
          <p>Thank you for subscribing to JustConnect ${plan.name}.</p>
          <p>Your subscription includes:</p>
          <ul>
            ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        `,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      };
    } catch (error) {
      console.error('Subscription creation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Subscription failed' 
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, immediate = false): Promise<boolean> {
    try {
      const dbSubscription = await prisma.subscription.findFirst({
        where: { userId, status: 'active' }
      });

      if (!dbSubscription) {
        return false;
      }

      if (immediate) {
        await this.stripe.subscriptions.cancel(dbSubscription.stripeSubscriptionId);
      } else {
        await this.stripe.subscriptions.update(dbSubscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update database
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: immediate ? 'cancelled' : 'pending_cancellation',
          cancelledAt: immediate ? new Date() : undefined,
        },
      });

      // Send confirmation email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Subscription Cancelled',
          html: `
            <h2>Subscription Cancelled</h2>
            <p>Your subscription has been ${immediate ? 'cancelled immediately' : 'scheduled for cancellation at the end of the billing period'}.</p>
            <p>You can reactivate your subscription anytime from your account settings.</p>
          `,
        });
      }

      return true;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return false;
    }
  }

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<any> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'pending_cancellation'] } }
    });

    if (!subscription) {
      return this.subscriptionPlans.get('basic'); // Default to basic plan
    }

    const plan = this.subscriptionPlans.get(subscription.planId);
    return {
      ...plan,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.status === 'pending_cancellation',
    };
  }

  // Check if user has access to feature
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    const featureAccess: Record<string, string[]> = {
      'unlimited_groups': ['premium', 'business', 'enterprise'],
      'file_sharing': ['basic', 'premium', 'business', 'enterprise'],
      'large_files': ['premium', 'business', 'enterprise'],
      'priority_support': ['premium', 'business', 'enterprise'],
      'analytics': ['business', 'enterprise'],
      'api_access': ['business', 'enterprise'],
      'custom_branding': ['business', 'enterprise'],
      'sso': ['enterprise'],
    };

    const allowedPlans = featureAccess[feature] || [];
    return allowedPlans.includes(subscription.id);
  }

  // Process webhook events
  async processWebhook(payload: Buffer, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSuccess(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailure(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  // Get subscription plans
  getSubscriptionPlans(): SubscriptionPlan[] {
    return Array.from(this.subscriptionPlans.values());
  }

  // Generate invoice
  async generateInvoice(userId: string, amount: number, description: string): Promise<Invoice> {
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        amount,
        currency: 'usd',
        description,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return invoice as Invoice;
  }

  // Private helper methods
  private async getOrCreateCustomer(email: string, userId: string) {
    const existingCustomer = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomer.data.length > 0) {
      return existingCustomer.data[0];
    }

    return await this.stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  private async saveSubscriptionToDB(userId: string, planId: string, stripeSubscription: any) {
    await prisma.subscription.create({
      data: {
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer,
        status: 'active',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const userId = paymentIntent.metadata.userId;
    
    await analyticsService.trackRevenue(
      userId,
      paymentIntent.amount / 100,
      paymentIntent.currency,
      'one_time_payment'
    );

    // Send receipt email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Payment Receipt',
        html: `
          <h2>Payment Successful</h2>
          <p>Thank you for your payment of $${(paymentIntent.amount / 100).toFixed(2)}.</p>
          <p>Transaction ID: ${paymentIntent.id}</p>
        `,
      });
    }
  }

  private async handlePaymentFailure(paymentIntent: any) {
    const userId = paymentIntent.metadata.userId;
    
    // Send failure notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Payment Failed',
        html: `
          <h2>Payment Failed</h2>
          <p>Your payment of $${(paymentIntent.amount / 100).toFixed(2)} could not be processed.</p>
          <p>Please check your payment method and try again.</p>
        `,
      });
    }
  }

  private async handleInvoicePaymentSuccess(invoice: any) {
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;

    // Update subscription in database
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'active',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    await analyticsService.trackRevenue(
      userId,
      invoice.amount_paid / 100,
      invoice.currency,
      'subscription'
    );
  }

  private async handleInvoicePaymentFailure(invoice: any) {
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;

    // Update subscription status
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'past_due' },
    });

    // Send payment failure notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Payment Failed - Action Required',
        html: `
          <h2>Payment Failed</h2>
          <p>We couldn't process your subscription payment.</p>
          <p>Please update your payment method to continue using JustConnect Premium features.</p>
        `,
      });
    }
  }

  private async handleSubscriptionUpdate(subscription: any) {
    const userId = subscription.metadata.userId;

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionCancellation(subscription: any) {
    const userId = subscription.metadata.userId;

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    // Send cancellation confirmation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Subscription Cancelled',
        html: `
          <h2>Subscription Cancelled</h2>
          <p>Your subscription has been cancelled. You'll continue to have access to premium features until ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}.</p>
          <p>We're sad to see you go! You can reactivate your subscription anytime.</p>
        `,
      });
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;