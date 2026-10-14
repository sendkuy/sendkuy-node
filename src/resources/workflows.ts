import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  ListWorkflowExecutionsParams,
  ListWorkflowsParams,
  Workflow,
  WorkflowExecution,
  WorkflowTrigger,
} from '../types';
import { Resource, encode } from './resource';

export class Workflows extends Resource {
  async list(params: ListWorkflowsParams = {}, options?: RequestOptions): Promise<Page<Workflow>> {
    return this.page<Workflow>('/workflows', params, options);
  }

  async get(id: string, options?: RequestOptions): Promise<Workflow> {
    return this.item<Workflow>('GET', `/workflows/${encode(id)}`, {}, options);
  }

  async listExecutions(
    id: string,
    params: ListWorkflowExecutionsParams = {},
    options?: RequestOptions
  ): Promise<Page<WorkflowExecution>> {
    return this.page<WorkflowExecution>(`/workflows/${encode(id)}/executions`, params, options);
  }

  async trigger(id: string, options?: RequestOptions): Promise<WorkflowTrigger> {
    return this.item<WorkflowTrigger>('POST', `/workflows/${encode(id)}/trigger`, {}, options);
  }
}
