import { createClient } from 'redis';

const PRICE_PER_USER_MONTH = 50.0;

export async function getRedisClient() {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  return redisClient;
}

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

      await redis.json.set(
        `${organizationId}:${agentId}:licenses`,
        '$',
        licenses
      );

      return {
        user_licenses: licenses.user_licenses,
        monthly_price_per_user: PRICE_PER_USER_MONTH,
        monthly_subscription_price_in_dollars:
          licenseCount * PRICE_PER_USER_MONTH,
      };
    },

    async getLicenses(organizationId: string, agentId: string): Promise<any> {
      const redis = await getRedisClient();
      const licenses = (await redis.json.get(
        `${organizationId}:${agentId}:licenses`
      )) as any;

      const user_licenses = licenses?.user_licenses || 5; // Default to 5 licenses if none exist

      return {
        user_licenses,
        monthly_price_per_user: PRICE_PER_USER_MONTH,
        monthly_subscription_price_in_dollars:
          user_licenses * PRICE_PER_USER_MONTH,
      };
    },
  };
};
