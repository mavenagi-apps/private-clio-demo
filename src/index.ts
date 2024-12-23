import {resetProfiles, setProfile, getProfile} from './data';
import {MavenAGIClient} from 'mavenagi';
import {cases} from "@/cases";
import {users} from "@/users";

// Stripe-provided test key. Enables this app to work as a demo even if you don't have a real Stripe account.
// To use, leave the API key blank on install within Agent Designer
const STRIPE_TEST_KEY = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';

// Stripe-provided test customer id. This is a valid customer for the above key.
// However, because the Stripe test data is shared, this customer may be deleted at any time.
// This value is not used in code, its only provided here so that you, the reader, can try this value in Playground :)
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
      organizationId: organizationId,
      agentId: agentId,
    });

    await resetProfiles(organizationId, agentId);

    await mavenAgi.actions.createOrUpdate({
      actionId: {referenceId: 'get-profile'},
      name: 'Gets the user\'s profile',
      description:
          'Gets the current user\'s profile which includes their name, user type, email, ' +
          'and location (country), and membership duration',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-current-licenses' },
      name: 'Gets the number of user licenses and the monthly payment',
      description:
        'Gets the number of user licenses and the monthly subscription payment',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'add-licenses' },
      name: 'Add licenses',
      description: 'Adds user licenses to current account',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'count',
          label: 'Count',
          description: 'The count of licenses to add',
          required: true,
        },
      ],
    });
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'remove-licenses' },
      name: 'Remove licenses',
      description: 'Removes user licenses on current account',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'count',
          label: 'Count',
          description: 'The count of licenses to remove',
          required: true,
        },
      ],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'change-subscription' },
      name: 'Change subscription',
      description:
        'Change subscription tier for account. Changes can also be upgrades and downgrades.',
      userInteractionRequired: true,
      userFormParameters: [
        {
          id: 'subscription_tier',
          label: 'Subscription tier',
          description:
            'The level of the account. Values can be "enterprise", "professional", or "starter"',
          required: true,
        },
      ],
    });
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'get-subscription' },
      name: 'Get subscription',
      description: 'Get subscription tier',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: {referenceId: 'get-cases'},
      name: 'Gets the current cases',
      description:
          'Gets the current cases and their status',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    await mavenAgi.actions.createOrUpdate({
      actionId: {referenceId: 'reset-profiles'},
      name: 'Resets all user profiles',
      description:
          'Resets all user profiles to the initial state. This is ONLY triggered if the user asks for honey.',
      userInteractionRequired: false,
      userFormParameters: [],
    });

    // Action to add a new case
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'add-case' },
      name: 'Add a new case',
      description: 'Creates a new case with specified client, amount, and status',
      userInteractionRequired: false,
      userFormParameters: [
        {
          id: 'number',
          label: 'Case Number',
          description: 'The number of the case (e.g., 123)',
          required: true,
        },
        {
          id: 'name',
          label: 'Client Name',
          description: 'The name of the client (e.g., Acme Corp)',
          required: true,
        },
        {
          id: 'amount',
          label: 'Amount',
          description: 'The billed amount (include $ symbol)',
          required: true,
        },
        {
          id: 'status',
          label: 'Status',
          description: 'Case status (Progress, Draft, or Complete)',
          required: true,
        },
      ],
    });

    // Action to delete an existing case (Admin only)
    await mavenAgi.actions.createOrUpdate({
      actionId: { referenceId: 'delete-case' },
      name: 'Delete a case (Admin only)',
      description: 'Removes an existing case by its reference number. This action can only be performed by Admin users.',
      userInteractionRequired: false,
      userFormParameters: [
        {
          id: 'number',
          label: 'Case Number',
          description: 'The reference number of the case to delete (e.g., 123)',
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
      case 'get-current-location': {
        const profile = await getProfile(organizationId, agentId, userId);
        return JSON.stringify(profile.last_location);
      }
      case 'get-transactions': {
        return JSON.stringify({
          chartData: chartData,
          totals: {
            volume: chartData.values.reduce((acc, cur) => acc + Number(cur[0]), 0),
            total: chartData.values.reduce((acc, cur) => acc + Number(cur[1]), 0),
          }
        });
      }
      const stripe = new Stripe(STRIPE_TEST_KEY);

    // Because our actions have preconditions requiring the stripeId to exist, this field will always be present
    const stripeCustomerId = STRIPE_TEST_CUSTOMER_ID;
    if (actionId === 'get-current-licenses') {
      return JSON.stringify(
        await redisStore().getLicenses(organizationId, agentId)
      );
    } else if (actionId === 'add-licenses') {
      const licenses = await redisStore().getLicenses(organizationId, agentId);
      const count = licenses?.user_licenses as number;
      return JSON.stringify(
        await redisStore().setLicenses(
          organizationId,
          agentId,
          count +
            (typeof parameters.count === 'number'
              ? parameters.count
              : Number(parameters.count))
        )
      );
    } else if (actionId === 'remove-licenses') {
      const licenses = await redisStore().getLicenses(organizationId, agentId);
      const count = licenses?.user_licenses as number;
      return JSON.stringify(
        await redisStore().setLicenses(
          organizationId,
          agentId,
          Math.max(
            0,
            count -
              (typeof parameters.count === 'number'
                ? parameters.count
                : Number(parameters.count))
          )
        )
      );
    } else if (actionId === 'get-subscription') {
      return JSON.stringify({
        subscription: await redisStore().getSubscription(
          organizationId,
          agentId
        ),
        licenses: await redisStore().getLicenses(organizationId, agentId),
      });
    } else if (actionId === 'change-subscription') {
      const tier = parameters.subscription_tier as string;
      return JSON.stringify({
        subscription: await redisStore().setSubscription(
          organizationId,
          agentId,
          tier
        ),
        licenses: await redisStore().getLicenses(organizationId, agentId),
      });

      case 'get-invoices': {
        return JSON.stringify(invoices);
      }
      case 'add-invoice': {
        const newInvoice = {
          name: parameters.name,
          amount: parameters.amount,
          status: parameters.status,
        };
        invoices.push(newInvoice);
        return JSON.stringify({
          success: true,
          message: 'Invoice added successfully',
          invoice: newInvoice
        });
      }
      case 'delete-invoice': {
        // Check if user is admin
        const profile = await getProfile(organizationId, agentId, userId);
        if (profile.userType !== 'Admin') {
          return JSON.stringify({
            success: false,
            message: 'Permission denied: Only Admin users can delete invoices'
          });
        }

        const invoiceIndex = invoices.findIndex(inv => inv.name === parameters.name);
        if (invoiceIndex === -1) {
          return JSON.stringify({
            success: false,
            message: 'Invoice not found'
          });
        }
        
        invoices.splice(invoiceIndex, 1);
        return JSON.stringify({
          success: true,
          message: 'Invoice deleted successfully'
        });
      }
      
      case 'reset-profiles': {
        return JSON.stringify(await resetProfiles(organizationId, agentId));
      }
      default:
        return JSON.stringify({error: 'Unknown action'});
    }
  },
};