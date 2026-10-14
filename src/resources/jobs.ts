import type { RequestOptions } from '../transport';
import type { Job } from '../types';
import { Resource, encode } from './resource';

export class Jobs extends Resource {
  async get(id: string, options?: RequestOptions): Promise<Job> {
    return this.item<Job>('GET', `/jobs/${encode(id)}`, {}, options);
  }
}
