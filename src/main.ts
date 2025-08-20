import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import helmet from 'helmet';
import * as notifier from 'node-notifier';
import * as path from 'path';
import * as morgan from 'morgan';
import { AppModule } from './app.module';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

function getLicenseKeyFromFile(): string | null {
  const licenseFilePath = path.resolve(__dirname, 'license.key');

  if (fs.existsSync(licenseFilePath)) {
    const licenseKey = fs.readFileSync(licenseFilePath, 'utf8').trim();
    return licenseKey;
  }

  return null;
}

async function bootstrap() {
  const licenseKeyFromEnv = process.env.LICENSE_KEY;

  const validKey = getLicenseKeyFromFile();

  if (!validKey) {
    console.log('Missing License key from file. Exiting the application...');
    process.exit(1); // Thoát chương trình với mã lỗi
  }

  if (!licenseKeyFromEnv) {
    console.log('Missing license key from env. Exiting the application...');
    process.exit(1);
  }

  if (licenseKeyFromEnv !== validKey) {
    console.log('Invalid license key. Exiting the application...');
    process.exit(1); // Thoát chương trình với má lỗi
  }

  console.log(`License key found in env file. Starting the application...`);

  await startApp();
}

function showMessageNoti(message: string) {
  notifier.notify({
    title: 'App server',
    message: message,
    icon: path.join(__dirname, 'assets/icon.ico'),
  });
}

async function startApp() {
  const app = await NestFactory.create(AppModule);

  const PORT = process.env.PORT ?? 3000;

  app.use(morgan('dev'));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) => {
        throw new BadRequestException({
          message: 'Validate error',
          details: errors.reduce(
            (previousValue, currentValue) => ({
              ...previousValue,
              [currentValue.property]: Object.values(
                currentValue.constraints ?? {},
              ),
            }),
            {},
          ),
        });
      },
    }),
  );

  await app.listen(PORT, process.env.IP_ADDRESS);
  // await app.listen(PORT);

  showMessageNoti('Application has started successfully!');
}

bootstrap();

process.on('SIGINT', () => {
  showMessageNoti('Application server is shutting down.');

  process.exit();
});

process.on('SIGTERM', () => {
  showMessageNoti('Application server is shutting down.');

  process.exit();
});
