import { createClient } from 'redis';

export async function getRedisClient() {
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
}

const PRICE_PER_USER_MONTH = 50.0;

export const redisStore = () => {
  return {
    async set(
      organizationId: string,
      agentId: string,
      key: string,
      data: any
    ): Promise<any> {
      const redis = await getRedisClient();
      console.log('redis.set', key, data);
      await redis.json.set(
        `${organizationId}:${agentId}:${key}`,
        '$',
        data
      );
      return data;
    },

    async get(
      organizationId: string,
      agentId: string,
      key: string
    ): Promise<any> {
      const redis = await getRedisClient();
      const data = await redis.json.get(
        `${organizationId}:${agentId}:${key}`
      );
      return data;
    },

    async setLicenses(organizationId: string, agentId: string, licenseCount: number) {
      const redis = await getRedisClient();
      const licenses = { user_licenses: licenseCount };
      await redis.json.set(`${organizationId}:${agentId}:licenses`, '$', licenses);
    },

    async getLicenses(organizationId: string, agentId: string) {
      const redis = await getRedisClient();
      const licenses = await redis.json.get(`${organizationId}:${agentId}:licenses`) || { user_licenses: 0 };
      return licenses;
    },

    async setSubscription(organizationId: string, agentId: string, tier: string) {
      const redis = await getRedisClient();
      const subscription = { tier };
      await redis.json.set(`${organizationId}:${agentId}:subscription`, '$', subscription);
    },

    async getSubscription(organizationId: string, agentId: string) {
      const redis = await getRedisClient();
      const subscription = await redis.json.get(`${organizationId}:${agentId}:subscription`) || { tier: 'starter' };
      return subscription;
    },

    calculatePrice(subscriptionTier: string): number {
      let price = PRICE_PER_USER_MONTH;
      if (subscriptionTier === 'professional') {
        price *= 1.5;
      } else if (subscriptionTier === 'enterprise') {
        price *= 2;
      }
      return price;
    },
  };
};
