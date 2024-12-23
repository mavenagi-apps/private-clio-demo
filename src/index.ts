import { resetProfiles, setProfile, getProfile } from './data';
import { MavenAGIClient } from 'mavenagi';
import { cases } from "@/cases";
import { users } from "@/users";
import { store } from "@/redis";

// Constants for Redis keys
const LICENSE_KEY = 'licenses';
const SUBSCRIPTION_KEY = 'subscription';

export default {
  async preInstall({
    organizationId,
    agentId,
    settings,
  }: {
    organizationId: string;
    agentId: string;
    settings: Record<string, unknown>;
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
    settings: Record<string, unknown>;
  }) {
    const mavenAgi = new MavenAGIClient({
      organizationId,
      agentId,
    });

    // Initialize default values
    await store().set(organizationId, agentId, LICENSE_KEY, { user_licenses: 5 });
    await store().set(organizationId, agentId, SUBSCRIPTION_KEY, { tier: 'starter' });

    await resetProfiles(organizationId, agentId);

    // Register actions
    const actions = [
      {
        actionId: { referenceId: 'get-profile' },
        name: 'Gets the user\'s profile',
        description: 'Gets the user\'s profile including name, user type, email, and membership duration',
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
    const userId = user?.defaultUserData?.userId ?? users[0]?.id;

    switch (actionId) {
      case 'get-profile':
        return JSON.stringify({
          profile: await getProfile(organizationId, agentId, userId),
        });

      case 'get-current-licenses':
        return JSON.stringify(
          await store().get(organizationId, agentId, LICENSE_KEY)
        );

      case 'change-subscription': {
        const tier = parameters.subscription_tier as string;
        if (!['enterprise', 'professional', 'starter'].includes(tier)) {
          return JSON.stringify({
            success: false,
            message: 'Invalid subscription tier. Valid values are "Enterprise", "Professional", or "Starter".',
          });
        }

        await store().set(organizationId, agentId, SUBSCRIPTION_KEY, { tier });
        const licenses = await store().get(organizationId, agentId, LICENSE_KEY);
        
        return JSON.stringify({
          subscription: { tier },
          licenses,
          success: true,
          message: `Subscription successfully changed to ${tier}.`,
        });
      }

      case 'get-subscription':
        const [subscription, licenses] = await Promise.all([
          store().get(organizationId, agentId, SUBSCRIPTION_KEY),
          store().get(organizationId, agentId, LICENSE_KEY)
        ]);
        return JSON.stringify({ subscription, licenses });

      case 'add-licenses': {
        const licenses = await store().get(organizationId, agentId, LICENSE_KEY) || { user_licenses: 0 };
        const count = licenses.user_licenses;
        const addedLicenses = Number(parameters.count);
        const newLicenses = { user_licenses: count + addedLicenses };
        await store().set(organizationId, agentId, LICENSE_KEY, newLicenses);
        return JSON.stringify(newLicenses);
      }

      case 'remove-licenses': {
        const licenses = await store().get(organizationId, agentId, LICENSE_KEY) || { user_licenses: 0 };
        const count = licenses.user_licenses;
        const removedLicenses = Number(parameters.count);
        const newLicenses = { user_licenses: Math.max(0, count - removedLicenses) };
        await store().set(organizationId, agentId, LICENSE_KEY, newLicenses);
        return JSON.stringify(newLicenses);
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