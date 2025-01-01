import { resetProfiles, setProfile, getProfile } from '@/data';
import { MavenAGIClient } from 'mavenagi';
import { redisStore } from '@/redis';
import { cases } from '@/cases';

export default {
  async preInstall({ organizationId, agentId, settings }: {
    organizationId: string;
    agentId: string;
    settings: AppSettings;
  }) {
    // Pre-install logic if needed
  },

  async postInstall({ organizationId, agentId, settings }: {
    organizationId: string;
    agentId: string;
    settings: AppSettings;
  }) {
    const mavenAgi = new MavenAGIClient({ organizationId, agentId });

    await resetProfiles(organizationId, agentId);

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-profile' },
      name: "Get User's Profile",
      description: "Retrieve the user's profile, including name, user type, and email.",
      userInteractionRequired: false,
      userFormParameters: [],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-licenses' },
      name: 'Get Licenses',
      description: 'Retrieve the current number of user licenses.',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'add-licenses' },
      name: 'Add Licenses',
      description: 'Add user licenses to the current account.',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'count',
          label: 'License Count',
          description: 'Number of licenses to add.',
          required: true,
        },
      ],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'remove-licenses' },
      name: 'Remove Licenses',
      description: 'Remove user licenses from the account.',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'count',
          label: 'License Count',
          description: 'Number of licenses to remove.',
          required: true,
        },
      ],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-cases' },
      name: 'Get Cases',
      description: 'Retrieve the list of cases.',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'add-case' },
      name: 'Add Case',
      description: 'Add a new case to the case list.',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'name',
          label: 'Case Name',
          description: 'Name of the case.',
          required: true,
        },
        {
          id: 'amount',
          label: 'Case Amount',
          description: 'Amount associated with the case.',
          required: true,
        },
        {
          id: 'status',
          label: 'Case Status',
          description: 'Current status of the case.',
          required: true,
        },
      ],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'delete-case' },
      name: 'Delete Case (Admin Only)',
      description: 'Delete a case. Admin users only.',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'number',
          label: 'Case Number',
          description: 'Unique identifier of the case to delete.',
          required: true,
        },
      ],
    });
  },

  async executeAction({ organizationId, agentId, actionId, parameters, user }: {
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

      case 'get-licenses':
        return JSON.stringify(await redisStore().getLicenses(organizationId, agentId));

      case 'add-licenses': {
        const licenses = await redisStore().getLicenses(organizationId, agentId);
        const result = await redisStore().setLicenses(
          organizationId,
          agentId,
          licenses.user_licenses + Number(parameters.count)
        );
        return JSON.stringify(result);
      }

      case 'remove-licenses': {
        const licenses = await redisStore().getLicenses(organizationId, agentId);
        const result = await redisStore().setLicenses(
          organizationId,
          agentId,
          Math.max(0, licenses.user_licenses - Number(parameters.count))
        );
        return JSON.stringify(result);
      }

      case 'get-cases':
        return JSON.stringify({ cases });

      case 'add-case': {
        const newCase = {
          number: cases.length + 1,
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
