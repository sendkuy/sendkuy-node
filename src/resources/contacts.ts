import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  BulkImportContactsParams,
  Contact,
  ContactAttribute,
  ContactDeleted,
  CreateContactParams,
  Job,
  ListContactsParams,
  LookupContactParams,
  UpdateContactParams,
} from '../types';
import { Resource, encode } from './resource';

export class Contacts extends Resource {
  async list(params: ListContactsParams = {}, options?: RequestOptions): Promise<Page<Contact>> {
    return this.page<Contact>('/contacts', params, options);
  }

  async create(params: CreateContactParams, options?: RequestOptions): Promise<Contact> {
    return this.item<Contact>('POST', '/contacts', { body: params }, options);
  }

  async bulkImport(params: BulkImportContactsParams, options?: RequestOptions): Promise<Job> {
    return this.item<Job>('POST', '/contacts/bulk', { body: params }, options);
  }

  async lookup(params: LookupContactParams, options?: RequestOptions): Promise<Contact> {
    return this.item<Contact>('GET', '/contacts/lookup', { query: params }, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Contact> {
    return this.item<Contact>('GET', `/contacts/${encode(id)}`, {}, options);
  }

  async update(
    id: string,
    params: UpdateContactParams,
    options?: RequestOptions
  ): Promise<Contact> {
    return this.item<Contact>('PATCH', `/contacts/${encode(id)}`, { body: params }, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<ContactDeleted> {
    return this.item<ContactDeleted>('DELETE', `/contacts/${encode(id)}`, {}, options);
  }

  async listAttributes(options?: RequestOptions): Promise<ContactAttribute[]> {
    return this.items<ContactAttribute>('GET', '/contact-attributes', {}, options);
  }
}
