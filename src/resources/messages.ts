import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  BatchRow,
  ListMessagesParams,
  Message,
  SendMessageBatchParams,
  SendMessageParams,
} from '../types';
import { Resource, encode } from './resource';

export class Messages extends Resource {
  async list(params: ListMessagesParams = {}, options?: RequestOptions): Promise<Page<Message>> {
    return this.page<Message>('/messages', params, options);
  }

  async send(params: SendMessageParams, options?: RequestOptions): Promise<Message[]> {
    return this.items<Message>('POST', '/messages', { body: params }, options);
  }

  async sendBatch(params: SendMessageBatchParams, options?: RequestOptions): Promise<BatchRow[]> {
    return this.items<BatchRow>('POST', '/messages/batch', { body: params }, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Message> {
    return this.item<Message>('GET', `/messages/${encode(id)}`, {}, options);
  }

  async cancel(id: string, options?: RequestOptions): Promise<Message> {
    return this.item<Message>('POST', `/messages/${encode(id)}/cancel`, {}, options);
  }

  async resend(id: string, options?: RequestOptions): Promise<Message> {
    return this.item<Message>('POST', `/messages/${encode(id)}/resend`, {}, options);
  }
}
