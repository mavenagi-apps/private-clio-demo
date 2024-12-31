import { resetProfiles, setProfile, getProfile } from '@/data';
import { MavenAGIClient } from 'mavenagi';
import { redisStore } from '@/redis';
import { cases } from '@/cases';
import { AppSettings } from '@/types';

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

    // Action to get profile
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-profile' },
      name: "Get User's Profile",
      description: "Retrieve the user's profile, including name, user type, and more.",
      userInteractionRequired: false,
      userFormParameters: [],
    });

    // Action to get licenses
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-licenses' },
      name: 'Get Licenses',
      description: 'Retrieve the number of user licenses and associated pricing details.',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    // Action to add licenses
    await mavenAgi.actions.createOrUpdate({
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
    });

    // Action to remove licenses
    await mavenAgi.actions.createOrUpdate({
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
    });

    // Action to get cases
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-cases' },
      name: 'Get Cases',
      description: 'Retrieve the list of cases.',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    // Action to add a case
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'add-case' },
      name: 'Add Case',
      description: 'Add a new case to the list.',
      userInteractionRequired: true,
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
    });

    // Action to delete a case
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'delete-case' },
      name: 'Delete Case (Admin Only)',
      description: 'Delete a case from the list. This action is restricted to Admin users.',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'number',
          label: 'Case Number',
          description: 'The unique identifier of the case to delete.',
          required: true,
        },
      ],
    });
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
