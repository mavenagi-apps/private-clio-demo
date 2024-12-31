import { resetProfiles, setProfile, getProfile } from './data';
import { MavenAGIClient } from 'mavenagi';
import { store } from './redis';
import { cases } from './cases';

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
    await store.set(organizationId, agentId, LICENSE_KEY, { user_licenses: 5 });
    await store.set(organizationId, agentId, SUBSCRIPTION_KEY, { tier: 'starter' });

    await resetProfiles(organizationId, agentId);

    // Register actions
    const actions = [
      {
        actionId: { referenceId: 'get-profile' },
        name: "Get User's Profile",
        description: "Retrieve the user's profile, including name, user type, and more.",
        userInteractionRequired: false,
        userFormParameters: [],
      },
      {
        actionId: { referenceId: 'get-subscription' },
        name: 'Get Subscription Details',
        description: 'Retrieve subscription details and associated licenses.',
        userInteractionRequired: false,
        userFormParameters: [],
      },
      {
        actionId: { referenceId: 'change-subscription' },
        name: 'Change Subscription',
        description: 'Update the subscription tier for the account.',
        userInteractionRequired: true,
        userFormParameters: [
          {
            id: 'subscription_tier',
            label: 'Subscription Tier',
            description: 'Valid values: enterprise, professional, starter.',
            required: true,
          },
        ],
      },
      {
        actionId: { referenceId: 'add-licenses' },
        name: 'Add Licenses',
        description: 'Add user licenses to the current account.',
        userInteractionRequired: true,
        userFormParameters: [
          {
            id: 'count',
            label: 'License Count',
            description: 'The number of licenses to add.',
            required: true,
          },
        ],
      },
      {
        actionId: { referenceId: 'remove-licenses' },
        name: 'Remove Licenses',
        description: 'Remove user licenses from the current account.',
        userInteractionRequired: true,
        userFormParameters: [
          {
            id: 'count',
            label: 'License Count',
            description: 'The number of licenses to remove.',
            required: true,
          },
        ],
      },
      {
        actionId: { referenceId: 'get-cases' },
        name: 'Get Cases',
        description: 'Retrieve the list of cases.',
        userInteractionRequired: false,
        userFormParameters: [],
      },
      {
        actionId: { referenceId: 'add-case' },
        name: 'Add Case',
        description: 'Add a new case to the list.',
        userInteractionRequired: false,
        userFormParameters: [
          {
            id: 'name',
            label: 'Case Name',
            description: 'The name of the case.',
            required: true,
          },
          {
            id: 'amount',
            label: 'Case Amount',
            description: 'The amount associated with the case.',
            required: true,
          },
          {
            id: 'status',
            label: 'Case Status',
            description: 'The status of the case.',
            required: true,
          },
        ],
      },
      {
        actionId: { referenceId: 'delete-case' },
        name: 'Delete Case',
        description: 'Delete a case from the list.',
        userInteractionRequired: true,
        userFormParameters: [
          {
            id: 'number',
            label: 'Case Number',
            description: 'The unique identifier of the case to delete.',
            required: true,
          },
        ],
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
    const userId = user?.defaultUserData?.userId;

    switch (actionId) {
      case 'get-profile':
        return JSON.stringify({
          profile: await getProfile(organizationId, agentId, userId),
        });

      case 'get-subscription':
        const [subscription, licenses] = await Promise.all([
          store.get(organizationId, agentId, SUBSCRIPTION_KEY),
          store.getLicenses(organizationId, agentId),
        ]);
        return JSON.stringify({ subscription, ...licenses });

      case 'change-subscription': {
        const result = await store.setSubscription(
          organizationId,
          agentId,
          parameters.subscription_tier
        );
        const licenses = await store.getLicenses(organizationId, agentId);
        return JSON.stringify({
          ...result,
          ...licenses,
        });
      }

      case 'add-licenses': {
        const licenses = await store.getLicenses(organizationId, agentId);
        const result = await store.setLicenses(
          organizationId,
          agentId,
          licenses.user_licenses + Number(parameters.count)
        );
        return JSON.stringify(result);
      }

      case 'remove-licenses': {
        const licenses = await store.getLicenses(organizationId, agentId);
        const result = await store.setLicenses(
          organizationId,
          agentId,
          Math.max(0, licenses.user_licenses - Number(parameters.count))
        );
        return JSON.stringify(result);
      }

      case 'get-cases':
        return JSON.stringify({
          cases,
        });

      case 'add-case': {
        const newCase = {
          number: cases.length + 1, // Auto-incrementing case number
          name: parameters.name,
          amount: parameters.amount,
          status: parameters.status,
        };
        cases.push(newCase);
        return JSON.stringify({
          success: true,
          message: 'Case added successfully.',
          case: newCase,
        });
      }

      case 'delete-case': {
        const profile = await getProfile(organizationId, agentId, userId);
        if (profile.userType !== 'Admin') {
          return JSON.stringify({
            success: false,
            message: 'Permission denied: Only Admin users can delete cases.',
          });
        }

        const caseIndex = cases.findIndex((c) => c.number === parameters.number);
        if (caseIndex === -1) {
          return JSON.stringify({
            success: false,
            message: 'Case not found.',
          });
        }
        cases.splice(caseIndex, 1);
        return JSON.stringify({
          success: true,
          message: 'Case deleted successfully.',
        });
      }

      default:
        return JSON.stringify({ error: 'Unknown action' });
    }
  },
};
