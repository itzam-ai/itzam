import { ItzamError } from './errors';

interface DiscordNotificationConfig {
  webhookUrl?: string;
  enabled?: boolean;
  environment?: string;
}

interface DiscordErrorMessage {
  content: string;
  embeds?: {
    title: string;
    description: string;
    color: number;
    fields: {
      name: string;
      value: string;
      inline?: boolean;
    }[];
    timestamp: string;
  }[];
}

export class DiscordErrorNotifier {
  private config: DiscordNotificationConfig;

  constructor(config: DiscordNotificationConfig = {}) {
    this.config = {
      enabled: true,
      environment: process.env.NODE_ENV || 'development',
      ...config,
    };
  }

  async notifyError(error: ItzamError | Error, context?: Record<string, any>): Promise<void> {
    if (!this.config.enabled || !this.config.webhookUrl) {
      return;
    }

    try {
      const message = this.formatErrorMessage(error, context);
      
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error('Failed to send Discord notification:', response.statusText);
      }
    } catch (notificationError) {
      console.error('Error sending Discord notification:', notificationError);
    }
  }

  private formatErrorMessage(error: ItzamError | Error, context?: Record<string, any>): DiscordErrorMessage {
    const isItzamError = error instanceof ItzamError;
    const timestamp = new Date().toISOString();
    
    const fields = [
      {
        name: 'Error Type',
        value: isItzamError ? error.type : error.constructor.name,
        inline: true,
      },
      {
        name: 'Environment',
        value: this.config.environment || 'unknown',
        inline: true,
      },
    ];

    if (isItzamError) {
      fields.push({
        name: 'Error Code',
        value: error.code.toString(),
        inline: true,
      });
    }

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        fields.push({
          name: key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          inline: false,
        });
      });
    }

    const color = this.getErrorColor(isItzamError ? error.code : 500);
    const emoji = this.getErrorEmoji(isItzamError ? error.code : 500);

    return {
      content: `${emoji} **Error Alert** - ${this.config.environment}`,
      embeds: [
        {
          title: `${error.name}: ${error.message}`,
          description: error.stack ? `\`\`\`\n${error.stack.slice(0, 1000)}${error.stack.length > 1000 ? '...' : ''}\n\`\`\`` : 'No stack trace available',
          color,
          fields,
          timestamp,
        },
      ],
    };
  }

  private getErrorColor(code: number): number {
    switch (Math.floor(code / 100)) {
      case 4: return 0xffa500; // Orange for 4xx errors
      case 5: return 0xff0000; // Red for 5xx errors
      default: return 0xffff00; // Yellow for other errors
    }
  }

  private getErrorEmoji(code: number): string {
    switch (Math.floor(code / 100)) {
      case 4: return '⚠️';
      case 5: return '🚨';
      default: return '❌';
    }
  }
}

// Global notifier instance
let globalNotifier: DiscordErrorNotifier | null = null;

export function initializeDiscordNotifier(config: DiscordNotificationConfig): void {
  globalNotifier = new DiscordErrorNotifier(config);
}

export function notifyError(error: ItzamError | Error, context?: Record<string, any>): Promise<void> {
  if (!globalNotifier) {
    console.warn('Discord notifier not initialized. Call initializeDiscordNotifier() first.');
    return Promise.resolve();
  }
  
  return globalNotifier.notifyError(error, context);
}