import { resetProfiles, setProfile, getProfile } from './data';
import { MavenAGIClient } from 'mavenagi';
import { redisStore } from '@/redis';
import { cases } from '@/cases';
import {users} from "@/users";

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
    const mavenAgi = new MavenAGIClient({ 
      organizationId: organizationId, 
      agentId:agentId,
     });

    // Setup actions, users, knowledge, etc

    await resetProfiles(organizationId, agentId);

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-profile' },
      name: 'Get User\'s Profile',
      description: 'Retrieve the user\'s profile, including name, user type, and email.',
      userInteractionRequired: false,
      userFormParameters: [],
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
      userInteractionRequired: false,
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
      userInteractionRequired: false,
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
    user: any;
  }) {
    console.log('user', user);
    console.log('parameters', parameters);
    const userId = user.defaultUserData.userId ?? users[0].id;

    switch (actionId) {
      case 'get-profile':
        return JSON.stringify({
          profile: await getProfile(organizationId, agentId, userId),
        });

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
