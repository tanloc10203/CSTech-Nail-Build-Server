import { BinaryLike, createHmac, KeyObject, randomBytes } from 'crypto';

class CryptoCore {
  static generateKey(size = 64) {
    return randomBytes(size).toString('hex');
  }

  static hmac(key: BinaryLike | KeyObject, data: BinaryLike) {
    return createHmac('sha256', key).update(data).digest('hex');
  }
}

export default CryptoCore;
