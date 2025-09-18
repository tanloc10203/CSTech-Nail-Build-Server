import { showMessageNoti } from '@app/utils/notifier';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as bonjour from 'bonjour-service';

@Injectable()
export class BonjourService implements OnModuleInit, OnModuleDestroy {
  private b = new bonjour.Bonjour();
  private svc: any;
  private readonly SERVICE_NAME = 'server-nail-app';

  async onModuleInit() {
    const service = await this.getNetworkExist(this.SERVICE_NAME);
    if (service) {
      this.b.unpublishAll(() => {
        this.publish();
      });
    } else {
      this.publish();
    }
  }

  private publish() {
    this.svc = this.b.publish({
      name: this.SERVICE_NAME,
      type: 'http',
      host: process.env.IP_ADDRESS,
      port: Number(process.env.PORT) || 3000,
      txt: { role: 'app' },
    });

    this.svc.on('up', () => {
      showMessageNoti(`Service "${this.SERVICE_NAME}" registered`);
    });
  }

  onModuleDestroy() {
    this.b.unpublishAll(() => {
      this.b.destroy();
      console.log('Service đã được cleanup');
    });
  }

  private getNetworkExist(
    serviceName: string,
  ): Promise<bonjour.Service | null> {
    return new Promise((resolve, reject) => {
      this.b.find({ type: 'http' }, (service) => {
        try {
          console.log(`service scan:::`, service);

          if (service.name === serviceName) {
            resolve(service);
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
