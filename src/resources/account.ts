import type { RequestOptions } from '../transport';
import type { Account as AccountObject, AccountUsage } from '../types';
import { Resource } from './resource';

export class Account extends Resource {
  async get(options?: RequestOptions): Promise<AccountObject> {
    return this.item<AccountObject>('GET', '/account', {}, options);
  }

  async usage(options?: RequestOptions): Promise<AccountUsage> {
    return this.item<AccountUsage>('GET', '/account/usage', {}, options);
  }
}
