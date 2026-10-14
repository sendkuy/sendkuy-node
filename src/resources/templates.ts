import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  CreateTemplateParams,
  Deleted,
  ListTemplatesParams,
  Template,
  UpdateTemplateParams,
} from '../types';
import { Resource, encode } from './resource';

export class Templates extends Resource {
  async list(params: ListTemplatesParams = {}, options?: RequestOptions): Promise<Page<Template>> {
    return this.page<Template>('/templates', params, options);
  }

  async create(params: CreateTemplateParams, options?: RequestOptions): Promise<Template> {
    return this.item<Template>('POST', '/templates', { body: params }, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Template> {
    return this.item<Template>('GET', `/templates/${encode(id)}`, {}, options);
  }

  async update(
    id: string,
    params: UpdateTemplateParams,
    options?: RequestOptions
  ): Promise<Template> {
    return this.item<Template>('PATCH', `/templates/${encode(id)}`, { body: params }, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<Deleted> {
    return this.item<Deleted>('DELETE', `/templates/${encode(id)}`, {}, options);
  }
}
