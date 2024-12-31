import { MavenAGIClient } from 'mavenagi';
import { redisStore } from '@/redis';
import { User, users } from '@/users';

const PROFILE = 'profile';

export const setProfile = async (
  organizationId: string,
  agentId: string,
  user: User
) => {
  const mavenAgi = new MavenAGIClient({
    organizationId,
    agentId,
  });

  // Set initial profile data on install
  await redisStore().set(organizationId, agentId, `${user.id}:${PROFILE}`, user);

  // Update user profile using the correct API structure
  await mavenAgi.users.createOrUpdate({
    userId: { referenceId: user.id },
    data: {
      name: { value: `${user.firstName} ${user.lastName}`, visibility: 'VISIBLE' },
      identifiers: [
        { value: user.email, type: 'EMAIL', visibility: 'VISIBLE' },
      ],
    },
  });
};

export const getProfile = async (
  organizationId: string,
  agentId: string,
  userId: string
) => {
  const redis = redisStore();
  const profile = await redis.get(`${organizationId}:${agentId}:${userId}:${PROFILE}`);
  return profile || users.find(user => user.id === userId);
};

export const resetProfiles = async (
  organizationId: string,
  agentId: string
) => {
  const redis = redisStore();
  await redis.set(`${organizationId}:${agentId}:profiles`, users);
  return users;
};
