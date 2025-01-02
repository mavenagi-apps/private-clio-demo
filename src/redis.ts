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
        key: string,
    ): Promise<any> {
      const redis = await getRedisClient();
      const value= await redis.json.get(
          `${organizationId}:${agentId}:${key}`);
      console.log('redis.get', key, value);
      return value;
    },
    async delete(
        organizationId: string,
        agentId: string,
        key: string,
    ): Promise<any> {
      const redis = await getRedisClient();
      console.log('redis.delete', key);
      return await redis.json.del(
          `${organizationId}:${agentId}:${key}`
      );
    },

  };
};
