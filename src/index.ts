import { resetProfiles, setProfile, getProfile } from './data';
import { MavenAGIClient } from 'mavenagi';
import { cases } from "@/cases";
import { users } from "@/users";

// Stripe-provided test key for demo purposes.
const STRIPE_TEST_KEY = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
const STRIPE_TEST_CUSTOMER_ID = 'cus_R4dnq4Cifq7N2D';

export default {
  async preInstall({
    organizationId,
    agentId,
    settings,
  }: {
    organizationId: string;
    agentId: string;
    settings: AppSettings;
  }) {
    // Pre-install logic here if needed
  },

  async postInstall({
    organizationId,
    agentId,
    settings,
  }: {
    organizationId: string;
    agentId: string;
    settings: AppSettings;
  }) {
    const mavenAgi = new MavenAGIClient({
      organizationId,
      agentId,
    });

    await resetProfiles(organizationId, agentId);

    // Register actions
    const actions = [
      {
        actionId: { referenceId: 'get-profile' },
        name: 'Gets the user\'s profile',
        description: 'Gets the user\'s profile including name, user type, email, location, and membership duration',
        userInteractionRequired: false,
        userFormParameters: [],
      },
      {
        actionId: { referenceId: 'get-current-licenses' },
        name: 'Gets the number of user licenses and the monthly payment',
        description: 'Gets the number of user licenses and the monthly subscription payment',
        userInteractionRequired: false,
        userFormParameters: [],
      },
      {
        actionId: { referenceId: 'change-subscription' },
        name: 'Change subscription',
        description: 'Change subscription tier for account. Changes can also be upgrades and downgrades.',
        userInteractionRequired: true,
        userFormParameters: [
          {
            id: 'subscription_tier',
            label: 'Subscription Tier',
            description: 'The level of the account. Values can be "enterprise", "professional", or "starter".',
            required: true,
          },
        ],
      },
      {
        actionId: { referenceId: 'get-subscription' },
        name: 'Get subscription',
        description: 'Get subscription tier',
        userInteractionRequired: false,
        userFormParameters: [],
      },
    ];

    for (const action of actions) {
      await mavenAgi.actions.createOrUpdate(action);
    }
  },

  async executeAction({
    organizationId,
    agentId,
    actionId,
    parameters,
    user,
  }: {
    organizationId: string;
    agentId: string;
    actionId: string;
    parameters: Record<string, any>;
    user: { defaultUserData: { userId: string } };
  }) {
    console.log('user', user);
    console.log('parameters', parameters);

    const userId = user?.defaultUserData?.userId ?? users[0]?.id;

    switch (actionId) {
      case 'get-profile':
        return JSON.stringify({
          profile: await getProfile(organizationId, agentId, userId),
        });

      case 'get-current-licenses':
        return JSON.stringify(
          await redisStore().getLicenses(organizationId, agentId)
        );

      case 'change-subscription': {
        const tier = parameters.subscription_tier as string;
        if (!['enterprise', 'professional', 'starter'].includes(tier)) {
          return JSON.stringify({
            success: false,
            message: 'Invalid subscription tier. Valid values are "enterprise", "professional", or "starter".',
          });
        }
        return JSON.stringify({
          subscription: await redisStore().setSubscription(organizationId, agentId, tier),
          licenses: await redisStore().getLicenses(organizationId, agentId),
          success: true,
          message: `Subscription successfully changed to ${tier}.`,
        });
      }

      case 'get-subscription':
        return JSON.stringify({
          subscription: await redisStore().getSubscription(organizationId, agentId),
          licenses: await redisStore().getLicenses(organizationId, agentId),
        });

      case 'add-licenses': {
        const licenses = await redisStore().getLicenses(organizationId, agentId);
        const count = licenses?.user_licenses ?? 0;
        const addedLicenses = Number(parameters.count);
        return JSON.stringify(
          await redisStore().setLicenses(organizationId, agentId, count + addedLicenses)
        );
      }

      case 'remove-licenses': {
        const licenses = await redisStore().getLicenses(organizationId, agentId);
        const count = licenses?.user_licenses ?? 0;
        const removedLicenses = Number(parameters.count);
        return JSON.stringify(
          await redisStore().setLicenses(organizationId, agentId, Math.max(0, count - removedLicenses))
        );
      }

      case 'delete-case': {
        const profile = await getProfile(organizationId, agentId, userId);
        if (profile.userType !== 'Admin') {
          return JSON.stringify({ success: false, message: 'Permission denied: Only Admin users can delete cases' });
        }
        const caseIndex = cases.findIndex((c) => c.number === parameters.number);
        if (caseIndex === -1) {
          return JSON.stringify({ success: false, message: 'Case not found' });
        }
        cases.splice(caseIndex, 1);
        return JSON.stringify({ success: true, message: 'Case deleted successfully' });
      }

      case 'reset-profiles':
        return JSON.stringify(await resetProfiles(organizationId, agentId));

      default:
        return JSON.stringify({ error: 'Unknown action' });
    }
  },
};
