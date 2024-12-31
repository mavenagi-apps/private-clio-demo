import { createClient } from 'redis';

const PRICE_PER_USER_MONTH = 50.0;

export const redisStore = () => {
  const getRedisClient = async () => {
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    return redisClient;
  };

  const getPrice = (subscription: string): number => {
    let price = PRICE_PER_USER_MONTH;
    if (subscription === 'professional') {
      price *= 1.5;
    } else if (subscription === 'enterprise') {
      price *= 2;
    }
    return price;
  };

  return {
    async setLicenses(organizationId: string, agentId: string, licenseCount: number): Promise<any> {
      const redis = await getRedisClient();
      const licenses = { user_licenses: licenseCount };
      await redis.json.set(`${organizationId}:${agentId}:licenses`, '$', licenses);
      const subscription = await this.getSubscription(organizationId, agentId);
      const monthlyPrice = getPrice(subscription.tier);

      return {
        user_licenses: licenseCount,
        subscription: subscription.tier,
        monthly_price_per_user: monthlyPrice,
        monthly_subscription_price_in_dollars: licenseCount * monthlyPrice,
      };
    },

    async getLicenses(organizationId: string, agentId: string): Promise<any> {
      const redis = await getRedisClient();
      const licenses = await redis.json.get(`${organizationId}:${agentId}:licenses`) || { user_licenses: 5 };
      const subscription = await this.getSubscription(organizationId, agentId);
      const monthlyPrice = getPrice(subscription.tier);

      return {
        user_licenses: licenses.user_licenses,
        subscription: subscription.tier,
        monthly_price_per_user: monthlyPrice,
        monthly_subscription_price_in_dollars: licenses.user_licenses * monthlyPrice,
      };
    },

    async setSubscription(organizationId: string, agentId: string, tier: string): Promise<any> {
      const redis = await getRedisClient();
      const validTiers = ['starter', 'professional', 'enterprise'];
      if (!validTiers.includes(tier)) {
        tier = 'enterprise';
      }
      const subscription = { tier };
      await redis.json.set(`${organizationId}:${agentId}:subscription`, '$', subscription);
      return subscription;
    },

    async getSubscription(organizationId: string, agentId: string): Promise<any> {
      const redis = await getRedisClient();
      const subscription = await redis.json.get(`${organizationId}:${agentId}:subscription`) || { tier: 'starter' };
      return subscription;
    },
  };
};
