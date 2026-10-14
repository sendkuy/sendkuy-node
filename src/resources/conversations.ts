import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  Conversation,
  ConversationMessage,
  ListConversationMessagesParams,
  ListConversationsParams,
  ReplyToConversationParams,
} from '../types';
import { Resource, encode } from './resource';

export class Conversations extends Resource {
  async list(
    params: ListConversationsParams = {},
    options?: RequestOptions
  ): Promise<Page<Conversation>> {
    return this.page<Conversation>('/conversations', params, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Conversation> {
    return this.item<Conversation>('GET', `/conversations/${encode(id)}`, {}, options);
  }

  async listMessages(
    id: string,
    params: ListConversationMessagesParams = {},
    options?: RequestOptions
  ): Promise<Page<ConversationMessage>> {
    return this.page<ConversationMessage>(`/conversations/${encode(id)}/messages`, params, options);
  }

  async markRead(id: string, options?: RequestOptions): Promise<Conversation> {
    return this.item<Conversation>('POST', `/conversations/${encode(id)}/read`, {}, options);
  }

  async reply(
    id: string,
    params: ReplyToConversationParams,
    options?: RequestOptions
  ): Promise<ConversationMessage> {
    return this.item<ConversationMessage>(
      'POST',
      `/conversations/${encode(id)}/reply`,
      { body: params },
      options
    );
  }
}
