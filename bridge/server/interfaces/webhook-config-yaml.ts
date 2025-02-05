import Yaml from 'yaml';
import { WebhookConfigMethod } from '../../shared/interfaces/webhook-config';
import { WebhookConfig, WebhookSecret } from '../../shared/models/webhook-config';
import { Webhook, WebhookConfigYamlResult } from './webhook-config-yaml-result';

const order: { [key: string]: number } = {
  apiVersion: 0,
  kind: 1,
  metadata: 2,
  spec: 3,
};

export class WebhookConfigYaml implements WebhookConfigYamlResult {
  apiVersion: 'webhookconfig.keptn.sh/v1alpha1';
  kind: 'WebhookConfig';
  metadata: {
    name: 'webhook-configuration';
  };
  spec: {
    webhooks: Webhook[];
  };

  constructor() {
    this.spec = {
      webhooks: [],
    };
    this.metadata = {
      name: 'webhook-configuration',
    };
    this.apiVersion = 'webhookconfig.keptn.sh/v1alpha1';
    this.kind = 'WebhookConfig';
  }

  public static fromJSON(data: WebhookConfigYamlResult): WebhookConfigYaml {
    return Object.assign(new this(), data);
  }

  /**
   * @params subscriptionId
   * @returns true if the webhooks have been changed
   */
  public removeWebhook(subscriptionId: string): boolean {
    const index = this.getWebhookIndex(subscriptionId);
    const changed = index !== -1;
    if (changed) {
      this.spec.webhooks[index].requests.splice(0, 1);
      if (this.spec.webhooks[index].requests.length === 0) {
        this.spec.webhooks.splice(index, 1);
      }
    }
    return changed;
  }

  public hasWebhooks(): boolean {
    return this.spec.webhooks.length !== 0;
  }

  /**
   * Either adds a webhook or updates it if there is already one for the given subscriptionId
   * @params eventType
   * @params curl
   */
  public addWebhook(
    eventType: string,
    curl: string,
    subscriptionId: string,
    secrets: WebhookSecret[],
    sendFinished: boolean
  ): void {
    const webhook = this.getWebhook(subscriptionId);
    if (!webhook) {
      this.spec.webhooks.push({
        type: eventType,
        requests: [curl],
        ...(secrets.length && { envFrom: secrets }),
        subscriptionID: subscriptionId,
        sendFinished: sendFinished,
      });
    } else {
      // overwrite
      webhook.type = eventType;
      webhook.requests[0] = curl;
      webhook.sendFinished = sendFinished;
      if (secrets.length) {
        webhook.envFrom = secrets;
      } else {
        delete webhook.envFrom;
      }
    }
  }

  private getWebhook(subscriptionId: string): Webhook | undefined {
    return this.spec.webhooks.find(this.findWebhook(subscriptionId));
  }

  private getWebhookIndex(subscriptionId: string): number {
    return this.spec.webhooks.findIndex(this.findWebhook(subscriptionId));
  }

  private findWebhook(subscriptionId: string): (webhook: Webhook) => boolean {
    return (webhook: Webhook): boolean => webhook.subscriptionID === subscriptionId;
  }

  public parsedRequest(subscriptionId: string): WebhookConfig | undefined {
    const webhook = this.getWebhook(subscriptionId);
    const curl = webhook?.requests[0];
    const secrets = webhook?.envFrom;

    const parsedConfig = curl ? this.parseConfig(curl) : undefined;
    if (parsedConfig) {
      parsedConfig.secrets = secrets;
      parsedConfig.sendFinished = webhook?.sendFinished ?? false;
    }
    return parsedConfig;
  }

  private parseConfig(curl: string): WebhookConfig {
    const config = new WebhookConfig();
    const result = this.parseCurl(curl);
    config.url = result._?.[0] ?? '';
    config.payload = this.formatJSON(result.data?.[0] ?? '');
    config.proxy = result.proxy?.[0] ?? '';
    config.method = (result.request?.[0] ?? '') as WebhookConfigMethod;
    const headers: { name: string; value: string }[] = [];
    if (result.header) {
      for (const header of result.header) {
        const headerInfo = header.split(':');

        headers.push({
          name: headerInfo[0]?.trim(),
          value: headerInfo[1]?.trim(),
        });
      }
    }

    config.header = headers;
    return config;
  }

  private parseCurl(curl: string): { [key: string]: string[] } {
    const startCommand = 'curl ';
    const result: { [key: string]: string[] } = {};
    if (curl.startsWith(startCommand)) {
      let i = startCommand.length;
      while (i < curl.length) {
        i = this.skipSpace(curl, i);
        let command = '_';
        if (curl[i] === '-') {
          const commandInfo = this.getNextCommand(curl, i);
          i = commandInfo.index + 1;
          command = commandInfo.data;
        }
        i = this.skipSpace(curl, i);
        if (i < curl.length) {
          const commandData = this.getNextCommandData(curl, i);
          i = commandData.index;
          const data = result[command];
          if (data) {
            data.push(commandData.data);
          } else {
            result[command] = [commandData.data];
          }
          ++i;
        }
      }
    }
    return result;
  }

  private skipSpace(curl: string, index: number): number {
    while (curl[index] === ' ') {
      ++index;
    }
    return index;
  }

  private getNextCommandData(curl: string, i: number): { data: string; index: number } {
    const startsWith = curl[i];
    let data = '';
    const startIndex = i;
    if (startsWith === "'" || startsWith === '"') {
      ++i;
      while (i < curl.length && (curl[i] !== startsWith || (curl[i] === startsWith && curl[i - 1] === '\\'))) {
        ++i;
      }
      data = curl.substring(startIndex + 1, i);
    } else {
      i = curl.indexOf(' ', startIndex);
      if (i === -1) {
        i = curl.length;
      }
      data = curl.substring(startIndex, i);
    }
    return {
      data,
      index: i,
    };
  }

  private getNextCommand(curl: string, i: number): { data: string; index: number } {
    let startCommandIndex = i + 1;
    if (curl[i + 1] === '-') {
      ++startCommandIndex;
    }
    i = curl.indexOf(' ', startCommandIndex);
    return {
      data: curl.substring(startCommandIndex, i),
      index: i === -1 ? curl.length : i,
    };
  }

  private formatJSON(data: string): string {
    try {
      data = JSON.stringify(JSON.parse(data), null, 2);
    } catch {}
    return data;
  }

  public toYAML(): string {
    return Yaml.stringify(this, {
      sortMapEntries: (a, b) => order[a.key] - order[b.key],
    });
  }
}
