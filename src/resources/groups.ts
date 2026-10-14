import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  AddContactsToGroupParams,
  CreateGroupParams,
  Deleted,
  Group,
  GroupMembershipAdded,
  GroupMembershipRemoved,
  ListGroupsParams,
  RemoveContactsFromGroupParams,
  UpdateGroupParams,
} from '../types';
import { Resource, encode } from './resource';

export class Groups extends Resource {
  async list(params: ListGroupsParams = {}, options?: RequestOptions): Promise<Page<Group>> {
    return this.page<Group>('/groups', params, options);
  }

  async create(params: CreateGroupParams, options?: RequestOptions): Promise<Group> {
    return this.item<Group>('POST', '/groups', { body: params }, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Group> {
    return this.item<Group>('GET', `/groups/${encode(id)}`, {}, options);
  }

  async update(id: string, params: UpdateGroupParams, options?: RequestOptions): Promise<Group> {
    return this.item<Group>('PATCH', `/groups/${encode(id)}`, { body: params }, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<Deleted> {
    return this.item<Deleted>('DELETE', `/groups/${encode(id)}`, {}, options);
  }

  async addContacts(
    id: string,
    params: AddContactsToGroupParams,
    options?: RequestOptions
  ): Promise<GroupMembershipAdded> {
    return this.item<GroupMembershipAdded>(
      'POST',
      `/groups/${encode(id)}/contacts`,
      { body: params },
      options
    );
  }

  async removeContacts(
    id: string,
    params: RemoveContactsFromGroupParams,
    options?: RequestOptions
  ): Promise<GroupMembershipRemoved> {
    return this.item<GroupMembershipRemoved>(
      'DELETE',
      `/groups/${encode(id)}/contacts`,
      { body: params },
      options
    );
  }
}
