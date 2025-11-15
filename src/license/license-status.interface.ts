export interface LicenseStatus {
  key: string;
  customerName: string;
  status: string;
  expiryDate: string;
  isExpired: boolean;
  daysUntilExpiry?: number;
  maxActivations?: number;
}

