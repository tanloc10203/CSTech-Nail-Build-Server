import * as path from 'path';
import * as notifier from 'node-notifier';

export function showMessageNoti(message: string) {
  const pathIcon = path.join(__dirname, '../../src/assets/icon.ico');

  notifier.notify({
    title: 'App server | Nail service',
    message: message,
    icon: pathIcon,
    sound: true,
  });
}
