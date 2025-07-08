// backend/src/services/analyticsService.ts
import { redis } from '../config/redis';
import { prisma } from '../config/database';

interface UserAnalytics {
  userId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
}

interface BusinessMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalMessages: number;
  totalChats: number;
  averageSessionDuration: number;
  retentionRate: number;
  churnRate: number;
}

class AnalyticsService {
  private events: UserAnalytics[] = [];
  private batchSize = 100;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    this.startBatchProcessor();
  }

  // Track user events
  async trackEvent(analytics: UserAnalytics): Promise<void> {
    // Add to batch
    this.events.push({
      ...analytics,
      timestamp: new Date(),
    });

    // Real-time analytics for critical events
    if (this.isCriticalEvent(analytics.event)) {
      await this.processRealTimeEvent(analytics);
    }

    // Cache for immediate queries
    await this.cacheUserActivity(analytics);
  }

  // Track user registration
  async trackUserRegistration(userId: string, source: string, ip?: string): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'user_registered',
      properties: {
        source,
        registrationDate: new Date(),
      },
      ip,
    });

    // Update daily metrics
    await this.updateDailyMetric('new_users', 1);
  }

  // Track user login
  async trackUserLogin(userId: string, ip?: string, userAgent?: string): Promise<void> {
    const sessionId = this.generateSessionId();
    
    await this.trackEvent({
      userId,
      event: 'user_login',
      sessionId,
      ip,
      userAgent,
      properties: {
        loginTime: new Date(),
      },
    });

    // Update last seen
    await redis.setex(`user:${userId}:last_seen`, 86400, Date.now().toString());
    await this.updateDailyMetric('active_users', 1);
  }

  // Track message sent
  async trackMessageSent(userId: string, chatId: string, messageType: string): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'message_sent',
      properties: {
        chatId,
        messageType,
        timestamp: new Date(),
      },
    });

    await this.updateDailyMetric('messages_sent', 1);
    await this.updateUserEngagement(userId, 'message_sent');
  }

  // Track chat created
  async trackChatCreated(userId: string, chatType: string, memberCount: number): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'chat_created',
      properties: {
        chatType,
        memberCount,
        timestamp: new Date(),
      },
    });

    await this.updateDailyMetric('chats_created', 1);
  }

  // Track feature usage
  async trackFeatureUsage(userId: string, feature: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'feature_used',
      properties: {
        feature,
        ...properties,
      },
    });

    await redis.hincrby(`feature_usage:${feature}`, 'count', 1);
  }

  // Track user session duration
  async trackSessionEnd(userId: string, sessionId: string, duration: number): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'session_end',
      sessionId,
      properties: {
        duration,
        endTime: new Date(),
      },
    });

    // Update average session duration
    await this.updateSessionDuration(duration);
  }

  // Get business metrics
  async getBusinessMetrics(startDate?: Date, endDate?: Date): Promise<BusinessMetrics> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const [
      totalUsers,
      newUsers,
      totalMessages,
      totalChats,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      prisma.chat.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.getActiveUsersCount(start, end),
    ]);

    const averageSessionDuration = await this.getAverageSessionDuration();
    const retentionRate = await this.calculateRetentionRate(start, end);
    const churnRate = await this.calculateChurnRate(start, end);

    return {
      totalUsers,
      activeUsers,
      newUsers,
      totalMessages,
      totalChats,
      averageSessionDuration,
      retentionRate,
      churnRate,
    };
  }

  // Get user engagement metrics
  async getUserEngagementMetrics(userId: string): Promise<any> {
    const userMetrics = await redis.hgetall(`user:${userId}:metrics`);
    
    return {
      messagesSent: parseInt(userMetrics.messages_sent || '0'),
      chatsCreated: parseInt(userMetrics.chats_created || '0'),
      sessionsCount: parseInt(userMetrics.sessions_count || '0'),
      totalTimeSpent: parseInt(userMetrics.total_time_spent || '0'),
      lastActive: userMetrics.last_active,
      engagementScore: await this.calculateEngagementScore(userId),
    };
  }

  // Get popular features
  async getPopularFeatures(limit = 10): Promise<Array<{ feature: string; usage: number }>> {
    const features = await redis.keys('feature_usage:*');
    const results = [];

    for (const featureKey of features) {
      const feature = featureKey.replace('feature_usage:', '');
      const usage = await redis.hget(featureKey, 'count');
      results.push({
        feature,
        usage: parseInt(usage || '0'),
      });
    }

    return results
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit);
  }

  // Get real-time analytics
  async getRealTimeAnalytics(): Promise<any> {
    const [
      onlineUsers,
      messagesLastHour,
      activeChats,
      newRegistrations,
    ] = await Promise.all([
      this.getOnlineUsersCount(),
      this.getMessagesInLastHour(),
      this.getActiveChatsCount(),
      this.getNewRegistrationsToday(),
    ]);

    return {
      onlineUsers,
      messagesLastHour,
      activeChats,
      newRegistrations,
      timestamp: new Date(),
    };
  }

  // Revenue tracking (for premium features)
  async trackRevenue(userId: string, amount: number, currency: string, source: string): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'revenue_generated',
      properties: {
        amount,
        currency,
        source,
        timestamp: new Date(),
      },
    });

    // Update daily revenue
    await this.updateDailyMetric('revenue', amount);
    await redis.hincrby(`revenue:${currency}`, 'total', Math.round(amount * 100)); // Store in cents
  }

  // Conversion tracking
  async trackConversion(userId: string, conversionType: string, value?: number): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'conversion',
      properties: {
        conversionType,
        value,
        timestamp: new Date(),
      },
    });

    await redis.hincrby(`conversions:${conversionType}`, 'count', 1);
    if (value) {
      await redis.hincrby(`conversions:${conversionType}`, 'value', Math.round(value * 100));
    }
  }

  // A/B Testing support
  async trackABTest(userId: string, testName: string, variant: string, converted = false): Promise<void> {
    await this.trackEvent({
      userId,
      event: 'ab_test',
      properties: {
        testName,
        variant,
        converted,
        timestamp: new Date(),
      },
    });

    await redis.hincrby(`ab_test:${testName}:${variant}`, 'views', 1);
    if (converted) {
      await redis.hincrby(`ab_test:${testName}:${variant}`, 'conversions', 1);
    }
  }

  // Private helper methods
  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.events.length > 0) {
        await this.flushEvents();
      }
    }, this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    const eventsToProcess = this.events.splice(0, this.batchSize);
    
    try {
      // Store in database for long-term analytics
      await this.storeEventsInDB(eventsToProcess);
      
      // Process for real-time dashboards
      await this.processEventsForRealTime(eventsToProcess);
      
      console.log(`📊 Processed ${eventsToProcess.length} analytics events`);
    } catch (error) {
      console.error('Failed to process analytics events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToProcess);
    }
  }

  private async storeEventsInDB(events: UserAnalytics[]): Promise<void> {
    // Implementation would depend on your analytics database
    // Could be ClickHouse, BigQuery, or a separate analytics table
    
    const analyticsData = events.map(event => ({
      userId: event.userId,
      event: event.event,
      properties: JSON.stringify(event.properties || {}),
      timestamp: event.timestamp,
      sessionId: event.sessionId,
      ip: event.ip,
      userAgent: event.userAgent,
    }));

    // Batch insert into analytics table
    // await prisma.analyticsEvent.createMany({ data: analyticsData });
  }

  private async processEventsForRealTime(events: UserAnalytics[]): Promise<void> {
    for (const event of events) {
      // Update real-time counters in Redis
      const today = new Date().toISOString().split('T')[0];
      await redis.hincrby(`daily_metrics:${today}`, event.event, 1);
    }
  }

  private isCriticalEvent(event: string): boolean {
    const criticalEvents = ['user_registered', 'revenue_generated', 'error_occurred'];
    return criticalEvents.includes(event);
  }

  private async processRealTimeEvent(analytics: UserAnalytics): Promise<void> {
    // Send to real-time dashboard via WebSocket
    // Or trigger alerts for important events
    if (analytics.event === 'revenue_generated') {
      // Trigger revenue alert
      console.log(`💰 Revenue event: $${analytics.properties?.amount} from user ${analytics.userId}`);
    }
  }

  private async cacheUserActivity(analytics: UserAnalytics): Promise<void> {
    const userKey = `user:${analytics.userId}:activity`;
    await redis.lpush(userKey, JSON.stringify(analytics));
    await redis.ltrim(userKey, 0, 100); // Keep last 100 activities
    await redis.expire(userKey, 86400 * 7); // 7 days
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updateDailyMetric(metric: string, value: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby(`daily_metrics:${today}`, metric, value);
  }

  private async updateUserEngagement(userId: string, action: string): Promise<void> {
    const userMetricsKey = `user:${userId}:metrics`;
    await redis.hincrby(userMetricsKey, action, 1);
    await redis.hset(userMetricsKey, 'last_active', new Date().toISOString());
    await redis.expire(userMetricsKey, 86400 * 30); // 30 days
  }

  private async updateSessionDuration(duration: number): Promise<void> {
    await redis.lpush('session_durations', duration.toString());
    await redis.ltrim('session_durations', 0, 1000); // Keep last 1000 sessions
  }

  private async getActiveUsersCount(start: Date, end: Date): Promise<number> {
    // Count users who were active in the date range
    const activeUsers = await redis.zcount(
      'user_activity',
      start.getTime(),
      end.getTime()
    );
    return activeUsers;
  }

  private async getAverageSessionDuration(): Promise<number> {
    const durations = await redis.lrange('session_durations', 0, -1);
    if (durations.length === 0) return 0;
    
    const total = durations.reduce((sum, duration) => sum + parseInt(duration), 0);
    return Math.round(total / durations.length);
  }

  private async calculateRetentionRate(start: Date, end: Date): Promise<number> {
    // Calculate user retention rate
    // This is a simplified version
    const totalUsers = await prisma.user.count({
      where: { createdAt: { lt: start } }
    });
    
    if (totalUsers === 0) return 0;
    
    const activeUsers = await this.getActiveUsersCount(start, end);
    return Math.round((activeUsers / totalUsers) * 100);
  }

  private async calculateChurnRate(start: Date, end: Date): Promise<number> {
    const retentionRate = await this.calculateRetentionRate(start, end);
    return Math.round(100 - retentionRate);
  }

  private async calculateEngagementScore(userId: string): Promise<number> {
    const metrics = await redis.hgetall(`user:${userId}:metrics`);
    
    const messagesSent = parseInt(metrics.messages_sent || '0');
    const chatsCreated = parseInt(metrics.chats_created || '0');
    const sessionsCount = parseInt(metrics.sessions_count || '0');
    
    // Simple engagement score calculation
    return Math.min(100, (messagesSent * 2) + (chatsCreated * 5) + (sessionsCount * 3));
  }

  private async getOnlineUsersCount(): Promise<number> {
    return await redis.scard('online_users');
  }

  private async getMessagesInLastHour(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return await prisma.message.count({
      where: {
        createdAt: { gte: oneHourAgo }
      }
    });
  }

  private async getActiveChatsCount(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return await prisma.chat.count({
      where: {
        lastMessageAt: { gte: oneHourAgo }
      }
    });
  }

  private async getNewRegistrationsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await prisma.user.count({
      where: {
        createdAt: { gte: today }
      }
    });
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;