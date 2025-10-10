import { showMessageNoti } from '@app/utils/notifier';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as bonjour from 'bonjour-service';

@Injectable()
export class BonjourService implements OnModuleInit, OnModuleDestroy {
  private b = new bonjour.Bonjour();
  private svc: any;
  private readonly SERVICE_NAME = 'server-nail-app';

  async onModuleInit() {
    try {
      // Cleanup any existing services first
      await this.cleanupExistingServices();
      
      // Wait a bit for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Publish new service
      this.publish();
    } catch (error) {
      console.error('Error initializing Bonjour service:', error);
      // Fallback: try to publish anyway
      this.publish();
    }
  }

  private publish() {
    try {
      // Generate unique service name to avoid conflicts
      const uniqueServiceName = this.generateUniqueServiceName();
      
      this.svc = this.b.publish({
        name: uniqueServiceName,
        type: 'http',
        host: process.env.IP_ADDRESS,
        port: Number(process.env.PORT) || 3000,
        txt: { 
          role: 'app',
          originalName: this.SERVICE_NAME,
          timestamp: Date.now()
        },
      });

      this.svc.on('up', () => {
        showMessageNoti(`Service "${uniqueServiceName}" registered`);
        console.log(`✅ Bonjour service tồn published: ${uniqueServiceName}`);
      });

      this.svc.on('error', (error) => {
        console.error('❌ Bonjour service error:', error);
        // Try with different name if conflict
        if (error.message.includes('name already exists')) {
          this.publishWithRetry();
        }
      });
    } catch (error) {
      console.error('Error publishing Bonjour service:', error);
    }
  }

  onModuleDestroy() {
    this.b.unpublishAll(() => {
      this.b.destroy();
      console.log('Service đã được cleanup');
    });
  }

  /**
   * Find service by original name (for client discovery)
   */
  async findServiceByOriginalName(originalName: string): Promise<bonjour.Service | null> {
    return new Promise((resolve, reject) => {
      const browser = this.b.find({ type: 'http' }, (service) => {
        try {
          if (service.txt && service.txt.originalName === originalName) {
            browser.stop();
            resolve(service);
          }
        } catch (error) {
          console.error('Error in service discovery:', error);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        browser.stop();
        resolve(null);
      }, 10000);
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

  /**
   * Generate unique service name to avoid conflicts
   */
  private generateUniqueServiceName(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${this.SERVICE_NAME}-${timestamp}-${randomSuffix}`;
  }

  /**
   * Cleanup existing services before publishing new one
   */
  private async cleanupExistingServices(): Promise<void> {
    return new Promise((resolve) => {
      this.b.unpublishAll(() => {
        console.log('🧹 Cleaned up existing Bonjour services');
        resolve();
      });
    });
  }

  /**
   * Retry publishing with different name if conflict occurs
   */
  private publishWithRetry(retryCount = 0, maxRetries = 3): void {
    if (retryCount >= maxRetries) {
      console.error('❌ Max retries reached for Bonjour service publishing');
      return;
    }

    console.log(`🔄 Retrying Bonjour service publish (attempt ${retryCount + 1}/${maxRetries})`);
    
    setTimeout(() => {
      try {
        const uniqueServiceName = this.generateUniqueServiceName();
        
        this.svc = this.b.publish({
          name: uniqueServiceName,
          type: 'http',
          host: process.env.IP_ADDRESS,
          port: Number(process.env.PORT) || 3000,
          txt: { 
            role: 'app',
            originalName: this.SERVICE_NAME,
            timestamp: Date.now(),
            retryCount: retryCount + 1
          },
        });

        this.svc.on('up', () => {
          showMessageNoti(`Service "${uniqueServiceName}" registered (retry ${retryCount + 1})`);
          console.log(`✅ Bonjour service published after retry: ${uniqueServiceName}`);
        });

        this.svc.on('error', (error) => {
          console.error(`❌ Bonjour service retry ${retryCount + 1} error:`, error);
          if (error.message.includes('name already exists')) {
            this.publishWithRetry(retryCount + 1, maxRetries);
          }
        });
      } catch (error) {
        console.error(`Error in retry ${retryCount + 1}:`, error);
        this.publishWithRetry(retryCount + 1, maxRetries);
      }
    }, 1000 * (retryCount + 1)); // Exponential backoff
  }
}
