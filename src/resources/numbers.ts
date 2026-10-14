import type { RequestOptions } from '../transport';
import type { CheckWhatsappNumbersParams, WhatsappNumberCheck } from '../types';
import { Resource } from './resource';

export class Numbers extends Resource {
  async check(
    params: CheckWhatsappNumbersParams,
    options?: RequestOptions
  ): Promise<WhatsappNumberCheck[]> {
    return this.items<WhatsappNumberCheck>(
      'POST',
      '/whatsapp/numbers/check',
      { body: params },
      options
    );
  }
}
