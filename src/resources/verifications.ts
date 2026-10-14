import type { RequestOptions } from '../transport';
import type { CheckVerificationParams, CreateVerificationParams, Verification } from '../types';
import { Resource, encode } from './resource';

export class Verifications extends Resource {
  async create(params: CreateVerificationParams, options?: RequestOptions): Promise<Verification> {
    return this.item<Verification>('POST', '/verifications', { body: params }, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Verification> {
    return this.item<Verification>('GET', `/verifications/${encode(id)}`, {}, options);
  }

  async check(
    id: string,
    params: CheckVerificationParams,
    options?: RequestOptions
  ): Promise<Verification> {
    return this.item<Verification>(
      'POST',
      `/verifications/${encode(id)}/check`,
      { body: params },
      options
    );
  }
}
