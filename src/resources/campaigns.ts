import type { Page } from '../page';
import type { RequestOptions } from '../transport';
import type {
  Campaign,
  CampaignDispatch,
  CampaignWithStats,
  CreateCampaignParams,
  Deleted,
  ListCampaignDispatchesParams,
  ListCampaignsParams,
  UpdateCampaignParams,
} from '../types';
import { Resource, encode } from './resource';

export class Campaigns extends Resource {
  async list(params: ListCampaignsParams = {}, options?: RequestOptions): Promise<Page<Campaign>> {
    return this.page<Campaign>('/campaigns', params, options);
  }

  async create(params: CreateCampaignParams, options?: RequestOptions): Promise<Campaign> {
    return this.item<Campaign>('POST', '/campaigns', { body: params }, options);
  }

  async get(id: string, options?: RequestOptions): Promise<CampaignWithStats> {
    return this.item<CampaignWithStats>('GET', `/campaigns/${encode(id)}`, {}, options);
  }

  async update(
    id: string,
    params: UpdateCampaignParams,
    options?: RequestOptions
  ): Promise<Campaign> {
    return this.item<Campaign>('PATCH', `/campaigns/${encode(id)}`, { body: params }, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<Deleted> {
    return this.item<Deleted>('DELETE', `/campaigns/${encode(id)}`, {}, options);
  }

  async listDispatches(
    id: string,
    params: ListCampaignDispatchesParams = {},
    options?: RequestOptions
  ): Promise<Page<CampaignDispatch>> {
    return this.page<CampaignDispatch>(`/campaigns/${encode(id)}/dispatches`, params, options);
  }

  async start(id: string, options?: RequestOptions): Promise<Campaign> {
    return this.item<Campaign>('POST', `/campaigns/${encode(id)}/start`, {}, options);
  }

  async pause(id: string, options?: RequestOptions): Promise<Campaign> {
    return this.item<Campaign>('POST', `/campaigns/${encode(id)}/pause`, {}, options);
  }

  async resume(id: string, options?: RequestOptions): Promise<Campaign> {
    return this.item<Campaign>('POST', `/campaigns/${encode(id)}/resume`, {}, options);
  }

  async cancel(id: string, options?: RequestOptions): Promise<Campaign> {
    return this.item<Campaign>('POST', `/campaigns/${encode(id)}/cancel`, {}, options);
  }
}
