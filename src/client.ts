import { SendKuyError } from './errors';
import { Account } from './resources/account';
import { Campaigns } from './resources/campaigns';
import { Contacts } from './resources/contacts';
import { Conversations } from './resources/conversations';
import { Executions } from './resources/executions';
import { Gateways } from './resources/gateways';
import { Groups } from './resources/groups';
import { Jobs } from './resources/jobs';
import { Messages } from './resources/messages';
import { Numbers } from './resources/numbers';
import { Templates } from './resources/templates';
import { Verifications } from './resources/verifications';
import { Webhooks } from './resources/webhooks';
import { Workflows } from './resources/workflows';
import {
  type ClientOptions,
  type Query,
  type RequestOptions,
  Transport,
  envApiKey,
  isBrowser,
} from './transport';

export class SendKuy {
  readonly account: Account;
  readonly messages: Messages;
  readonly numbers: Numbers;
  readonly verifications: Verifications;
  readonly jobs: Jobs;
  readonly contacts: Contacts;
  readonly groups: Groups;
  readonly templates: Templates;
  readonly gateways: Gateways;
  readonly webhooks: Webhooks;
  readonly campaigns: Campaigns;
  readonly conversations: Conversations;
  readonly workflows: Workflows;
  readonly executions: Executions;
  readonly #transport: Transport;

  constructor(apiKey?: string, options: ClientOptions = {}) {
    if (isBrowser() && options.dangerouslyAllowBrowser !== true) {
      throw new SendKuyError(
        'SendKuy refuses to run in a browser, because anyone who opens the page could read your API key. Call SendKuy from your server, or pass dangerouslyAllowBrowser: true if you accept that risk.'
      );
    }

    const key = apiKey ?? envApiKey();

    if (key === undefined || key.trim() === '') {
      throw new SendKuyError(
        'Pass your SendKuy API key to new SendKuy(), or set the SENDKUY_API_KEY environment variable.'
      );
    }

    this.#transport = new Transport(key, options);
    this.account = new Account(this.#transport);
    this.messages = new Messages(this.#transport);
    this.numbers = new Numbers(this.#transport);
    this.verifications = new Verifications(this.#transport);
    this.jobs = new Jobs(this.#transport);
    this.contacts = new Contacts(this.#transport);
    this.groups = new Groups(this.#transport);
    this.templates = new Templates(this.#transport);
    this.gateways = new Gateways(this.#transport);
    this.webhooks = new Webhooks(this.#transport);
    this.campaigns = new Campaigns(this.#transport);
    this.conversations = new Conversations(this.#transport);
    this.workflows = new Workflows(this.#transport);
    this.executions = new Executions(this.#transport);
  }

  request(
    params: { method: string; path: string; query?: Query; body?: unknown },
    options?: RequestOptions
  ): Promise<unknown> {
    return this.#transport.send(
      params.method,
      params.path,
      { query: params.query, body: params.body },
      options
    );
  }
}
