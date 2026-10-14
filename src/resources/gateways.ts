import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type { Gateway, ListGatewaysParams } from '../types';
import { Resource, encode } from './resource';

export class Gateways extends Resource {
  async list(params: ListGatewaysParams = {}, options?: RequestOptions): Promise<Page<Gateway>> {
    return this.page<Gateway>('/gateways', params, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Gateway> {
    return this.item<Gateway>('GET', `/gateways/${encode(id)}`, {}, options);
  }
}
