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
        firstName: { value: user.firstName, visibility: 'VISIBLE' },
        lastName: { value: user.lastName, visibility: 'VISIBLE' },
        userType: { value: user.userType, visibility: 'VISIBLE' },
        email: { value: user.email, visibility: 'VISIBLE' },
        companyName: { value: user.companyName, visibility: 'VISIBLE' },
        products: { value: user.products, visibility: 'VISIBLE' },
        memberSince: { value: user.memberSince, visibility: 'VISIBLE' },
        userId: { value: user.id, visibility: 'VISIBLE' }
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
