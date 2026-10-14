import type { components, operations } from './generated/openapi';

type Schemas = components['schemas'];

type DateKey = `${string}_at` | `${string}_after` | `${string}_before`;

type AcceptsDates<T> = { [K in keyof T]: K extends DateKey ? T[K] | Date : T[K] };

type Query<K extends keyof operations> = AcceptsDates<
  NonNullable<operations[K]['parameters']['query']>
>;

type Body<K extends keyof operations> =
  NonNullable<operations[K]['requestBody']> extends { content: { 'application/json': infer B } }
    ? AcceptsDates<B>
    : never;

export type Account = Schemas['Account'];
export type AccountUsage = Schemas['Usage'];
export type Message = Schemas['Message'];
export type BatchRow = Schemas['BatchRow'];
export type WhatsappNumberCheck = Schemas['WhatsappNumberCheck'];
export type Verification = Schemas['Verification'];
export type Job = Schemas['Job'];
export type Contact = Schemas['Contact'];
export type ContactDeleted = Schemas['ContactDeleted'];
export type ContactAttribute = Schemas['ContactAttribute'];
export type Group = Schemas['Group'];
export type GroupMembershipAdded = Schemas['GroupMembershipAdded'];
export type GroupMembershipRemoved = Schemas['GroupMembershipRemoved'];
export type Deleted = Schemas['Deleted'];
export type Template = Schemas['Template'];
export type Gateway = Schemas['Gateway'];
export type Webhook = Schemas['Webhook'];
export type WebhookWithSecret = Schemas['WebhookWithSecret'];
export type WebhookDelivery = Schemas['WebhookDelivery'];
export type Campaign = Schemas['Campaign'];
export type CampaignWithStats = Schemas['CampaignWithStats'];
export type CampaignDispatch = Schemas['CampaignDispatch'];
export type Conversation = Schemas['Conversation'];
export type ConversationMessage = Schemas['ConversationMessage'];
export type Workflow = Schemas['Workflow'];
export type WorkflowExecution = Schemas['WorkflowExecution'];
export type WorkflowTrigger = Schemas['WorkflowTrigger'];
export type ErrorCode = Schemas['ErrorCode'];

export type ListMessagesParams = Query<'listMessages'>;
export type ListContactsParams = Query<'listContacts'>;
export type LookupContactParams = Query<'lookupContact'>;
export type ListGroupsParams = Query<'listGroups'>;
export type ListTemplatesParams = Query<'listTemplates'>;
export type ListGatewaysParams = Query<'listGateways'>;
export type ListWebhooksParams = Query<'listWebhooks'>;
export type ListWebhookDeliveriesParams = Query<'listWebhookDeliveries'>;
export type ListCampaignsParams = Query<'listCampaigns'>;
export type ListCampaignDispatchesParams = Query<'listCampaignDispatches'>;
export type ListConversationsParams = Query<'listConversations'>;
export type ListConversationMessagesParams = Query<'listConversationMessages'>;
export type ListWorkflowsParams = Query<'listWorkflows'>;
export type ListWorkflowExecutionsParams = Query<'listWorkflowExecutions'>;

export type SendMessageParams = Body<'sendMessage'>;
export type SendMessageBatchParams = Body<'sendMessageBatch'>;
export type CheckWhatsappNumbersParams = Body<'checkWhatsappNumbers'>;
export type CreateVerificationParams = Body<'createVerification'>;
export type CheckVerificationParams = Body<'checkVerification'>;
export type CreateContactParams = Body<'createContact'>;
export type BulkImportContactsParams = Body<'bulkImportContacts'>;
export type UpdateContactParams = Body<'updateContact'>;
export type CreateGroupParams = Body<'createGroup'>;
export type UpdateGroupParams = Body<'updateGroup'>;
export type AddContactsToGroupParams = Body<'addContactsToGroup'>;
export type RemoveContactsFromGroupParams = Body<'removeContactsFromGroup'>;
export type CreateTemplateParams = Body<'createTemplate'>;
export type UpdateTemplateParams = Body<'updateTemplate'>;
export type CreateWebhookParams = Body<'createWebhook'>;
export type UpdateWebhookParams = Body<'updateWebhook'>;
export type CreateCampaignParams = Body<'createCampaign'>;
export type UpdateCampaignParams = Body<'updateCampaign'>;
export type ReplyToConversationParams = Body<'replyToConversation'>;
