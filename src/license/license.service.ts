import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_LICENSE_CACHE_TTL_MS,
  DEFAULT_LICENSE_ENDPOINT,
} from './license.constants';
import { LicenseStatus } from './license-status.interface';

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);
  private cachedStatus: LicenseStatus | null = null;
  private lastCheckedAt: number | null = null;
  private readonly cacheTtlMs: number;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint =
      this.configService.get<string>('LICENSE_CHECK_URL') ??
      DEFAULT_LICENSE_ENDPOINT;
    this.cacheTtlMs = Number(
      this.configService.get<string>('LICENSE_CACHE_TTL_MS') ??
        DEFAULT_LICENSE_CACHE_TTL_MS,
    );
  }

  /**
   * Ensure the license is valid. Throws if invalid or missing.
   * @param force skip cache and force a remote validation
   */
  async ensureValid(force = false): Promise<LicenseStatus> {
    const licenseKey = this.configService.get<string>('LICENSE_KEY');

    if (!licenseKey) {
      throw new ServiceUnavailableException(
        'Thiếu biến môi trường LICENSE_KEY. Vui lòng cấu hình lại hệ thống.',
      );
    }

    if (!force && this.isCacheUsable()) {
      return this.cachedStatus as LicenseStatus;
    }

    try {
      const status = await this.fetchStatus(licenseKey);
      this.setCache(status);
      this.assertStatusValid(status);
      return status;
    } catch (error) {
      this.logger.error(
        `Xác thực license thất bại: ${(error as Error).message}`,
      );

      if (this.cachedStatus && !this.cachedStatus.isExpired) {
        this.logger.warn(
          'Đang tạm dùng kết quả license đã cache do không thể kết nối máy chủ kiểm tra.',
        );
        return this.cachedStatus;
      }

      throw new ServiceUnavailableException(
        'Không thể xác thực license. Vui lòng kiểm tra lại key hoặc liên hệ CS hỗ trợ.',
        {
          cause: error instanceof Error ? error : undefined,
        },
      );
    }
  }

  private isCacheUsable(): boolean {
    if (!this.cachedStatus || this.cachedStatus.isExpired) {
      return false;
    }

    if (!this.lastCheckedAt) {
      return false;
    }

    const isFresh = Date.now() - this.lastCheckedAt < this.cacheTtlMs;

    if (!isFresh) {
      return false;
    }

    const expiry = new Date(this.cachedStatus.expiryDate).getTime();
    return expiry > Date.now();
  }

  private async fetchStatus(licenseKey: string): Promise<LicenseStatus> {
    const url = `${this.endpoint}?key=${encodeURIComponent(licenseKey)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Máy chủ license phản hồi mã lỗi ${response.status}`,
      );
    }

    const payload = (await response.json()) as LicenseStatus;
    return payload;
  }

  private setCache(status: LicenseStatus) {
    this.cachedStatus = status;
    this.lastCheckedAt = Date.now();
  }

  private assertStatusValid(status: LicenseStatus) {
    if (!status) {
      throw new ServiceUnavailableException(
        'Phản hồi license không hợp lệ.',
      );
    }

    if (status.isExpired || status.status !== 'active') {
      throw new ServiceUnavailableException(
        'License đã hết hạn hoặc không hoạt động. Vui lòng gia hạn để tiếp tục sử dụng.',
      );
    }
  }
}

