import type { RequestOptions } from '../transport';
import type { WorkflowExecution } from '../types';
import { Resource, encode } from './resource';

export class Executions extends Resource {
  async get(id: string, options?: RequestOptions): Promise<WorkflowExecution> {
    return this.item<WorkflowExecution>('GET', `/executions/${encode(id)}`, {}, options);
  }
}
