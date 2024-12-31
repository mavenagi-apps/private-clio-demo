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
  console.log('Calculating price for subscription tier:', sub);
  if (sub === 'professional') {
    price *= 1.5;
  } else if (sub === 'enterprise') {
    price *= 2;
  }
  console.log('Price per user:', price);
  return price;
};

export const redisStore = () => {
  return {
    async setLicenses(
      organizationId: string,
      agentId: string,
      licenseCount: number
    ): Promise<any> {
      const redis = await getRedisClient();
      if (typeof licenseCount !== 'number') {
        licenseCount = Number(licenseCount);
      }
      const licenses = {
        user_licenses: licenseCount,
      };
      console.log('Setting licenses:', licenses);
      await redis.json.set(
        `${organizationId}:${agentId}:licenses`,
        '$',
        licenses
      );
      const subName = (await this.getSubscription(organizationId, agentId))
        .tier;
      return {
        user_licenses: licenses.user_licenses,
        subscription: subName,
        monthly_price_per_user: getPrice(subName),
        monthly_subscription_price_in_dollars: licenseCount * getPrice(subName),
      };
    },

    async getLicenses(organizationId: string, agentId: string): Promise<any> {
      const redis = await getRedisClient();
      const licenses = (await redis.json.get(
        `${organizationId}:${agentId}:licenses`
      )) as any;
      console.log('Retrieved licenses:', licenses);
      const subName = (await this.getSubscription(organizationId, agentId))
        .tier;
      const user_licenses = licenses?.user_licenses || 5;
      return {
        user_licenses,
        subscription: subName,
        monthly_price_per_user: getPrice(subName),
        monthly_subscription_price_in_dollars:
          user_licenses * getPrice(subName),
      };
    },

    async setSubscription(
      organizationId: string,
      agentId: string,
      tier: string
    ): Promise<any> {
      const redis = await getRedisClient();
      console.log('Setting subscription tier:', tier);
      tier = tier.toLowerCase();
      if (tier !== 'starter' && tier !== 'professional' && tier !== 'enterprise') {
        tier = 'enterprise';
      }
      const subscription = {
        tier,
      };
      console.log('Subscription object:', subscription);
      await redis.json.set(
        `${organizationId}:${agentId}:subscription`,
        '$',
        subscription
      );
      return subscription;
    },

    async getSubscription(
      organizationId: string,
      agentId: string
    ): Promise<any> {
      const redis = await getRedisClient();
      const subscription = await redis.json.get(
        `${organizationId}:${agentId}:subscription`
      );
      console.log('Retrieved subscription:', subscription);
      return (
        subscription || {
          tier: 'starter',
        }
      );
    },
  };
};

export const store = redisStore;
