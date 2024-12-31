import { createClient } from 'redis';

const PRICE_PER_USER_MONTH = 50.0;

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

const getPrice = (sub: string) => {
  let price = PRICE_PER_USER_MONTH;
  if (sub === 'professional') {
    price *= 1.5;
  } else if (sub === 'enterprise') {
    price *= 2;
  }
  return price;
};

export const redisStore = {
  async set(key: string, value: any): Promise<void> {
    const redis = await getRedisClient();
    await redis.json.set(key, '$', value);
  },

  async get(key: string): Promise<any> {
    const redis = await getRedisClient();
    return await redis.json.get(key);
  },

  async setLicenses(
    organizationId: string,
    agentId: string,
    licenseCount: number
  ): Promise<any> {
    const key = `${organizationId}:${agentId}:licenses`;
    if (typeof licenseCount !== 'number') {
      licenseCount = Number(licenseCount);
    }
    const licenses = { user_licenses: licenseCount };
    await this.set(key, licenses);
    const subName = (await this.getSubscription(organizationId, agentId)).tier;
    return {
      user_licenses: licenses.user_licenses,
      subscription: subName,
      monthly_price_per_user: getPrice(subName),
      monthly_subscription_price_in_dollars: licenseCount * getPrice(subName),
    };
  },

  async getLicenses(organizationId: string, agentId: string): Promise<any> {
    const key = `${organizationId}:${agentId}:licenses`;
    const licenses = (await this.get(key)) || { user_licenses: 5 };
    const subName = (await this.getSubscription(organizationId, agentId)).tier;
    return {
      user_licenses: licenses.user_licenses,
      subscription: subName,
      monthly_price_per_user: getPrice(subName),
      monthly_subscription_price_in_dollars:
        licenses.user_licenses * getPrice(subName),
    };
  },

  async setSubscription(
    organizationId: string,
    agentId: string,
    tier: string
  ): Promise<any> {
    const key = `${organizationId}:${agentId}:subscription`;
    tier = tier.toLowerCase();
    if (!['starter', 'professional', 'enterprise'].includes(tier)) {
      tier = 'enterprise';
    }
    const subscription = { tier };
    await this.set(key, subscription);
    return subscription;
  },

  async getSubscription(
    organizationId: string,
    agentId: string
  ): Promise<any> {
    const key = `${organizationId}:${agentId}:subscription`;
    const subscription = await this.get(key);
    return subscription || { tier: 'starter' };
  },
};

export const store = redisStore;
