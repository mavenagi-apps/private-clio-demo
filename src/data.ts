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
    organizationId: organizationId,
    agentId: agentId,
  });

  // Set initial profile data in Redis using setLicenses for user count simulation
  const licenses = await redisStore().setLicenses(organizationId, agentId, 1); // Set a single license for demo purposes

  await mavenAgi.users.createOrUpdate({
    userId: { referenceId: user.id },
    identifiers: [{ type: 'EMAIL', value: user.email }],
    data: {
      firstName: { value: user.firstName, visibility: 'VISIBLE' },
      lastName: { value: user.lastName, visibility: 'VISIBLE' },
      userType: { value: user.userType, visibility: 'VISIBLE' },
      email: { value: user.email, visibility: 'VISIBLE' },
      companyName: { value: user.companyName, visibility: 'VISIBLE' },
      products: { value: user.products, visibility: 'VISIBLE' },
      memberSince: { value: user.memberSince, visibility: 'VISIBLE' },
      userId: { value: user.id, visibility: 'VISIBLE' },
    },
  });
};

export const resetProfiles = async (organizationId: string, agentId: string) => {
  users.map(async (user) => {
    await setProfile(organizationId, agentId, user);
  });
  return { success: true };
};

export const getProfile = async (
  organizationId: string,
  agentId: string,
  userId: string
): Promise<User & { ageInDays: number }> => {
  const profile = await redisStore().getLicenses(organizationId, agentId); // Retrieve licenses data instead
  console.log('profile', profile);

  const memberSince = new Date(profile?.memberSince || new Date());
  const currentDate = new Date();
  const ageInDays = (currentDate.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24);

  return {
    ...profile,
    ageInDays: Math.floor(ageInDays),
  };
};
