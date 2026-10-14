import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  CreateWebhookParams,
  Deleted,
  ListWebhookDeliveriesParams,
  ListWebhooksParams,
  UpdateWebhookParams,
  Webhook,
  WebhookDelivery,
  WebhookWithSecret,
} from '../types';
import { Resource, encode } from './resource';

export class Webhooks extends Resource {
  async list(params: ListWebhooksParams = {}, options?: RequestOptions): Promise<Page<Webhook>> {
    return this.page<Webhook>('/webhooks', params, options);
  }

  async create(params: CreateWebhookParams, options?: RequestOptions): Promise<WebhookWithSecret> {
    return this.item<WebhookWithSecret>('POST', '/webhooks', { body: params }, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Webhook> {
    return this.item<Webhook>('GET', `/webhooks/${encode(id)}`, {}, options);
  }

  async update(
    id: string,
    params: UpdateWebhookParams,
    options?: RequestOptions
  ): Promise<Webhook> {
    return this.item<Webhook>('PATCH', `/webhooks/${encode(id)}`, { body: params }, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<Deleted> {
    return this.item<Deleted>('DELETE', `/webhooks/${encode(id)}`, {}, options);
  }

  async listDeliveries(
    id: string,
    params: ListWebhookDeliveriesParams = {},
    options?: RequestOptions
  ): Promise<Page<WebhookDelivery>> {
    return this.page<WebhookDelivery>(`/webhooks/${encode(id)}/deliveries`, params, options);
  }
}
