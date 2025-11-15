import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import * as morgan from 'morgan';
import * as path from 'path';
import { AppModule } from './app.module';
import { showMessageNoti } from '@app/utils/notifier';
import { LicenseService } from './license/license.service';
import { INestApplication } from '@nestjs/common/interfaces';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

async function bootstrap() {
  await startApp();
}

async function startApp() {
  const app = await NestFactory.create(AppModule);
  await validateLicenseOnBootstrap(app);

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

  const config = new DocumentBuilder()
    .setTitle('Nail api')
    .setDescription('The nail API description')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory);

  // await app.listen(PORT, process.env.IP_ADDRESS);
  await app.listen(PORT);

  showMessageNoti(
    `Application has started successfully with port ${PORT}, IP: ${process.env.IP_ADDRESS}`,
  );
}

async function validateLicenseOnBootstrap(app: INestApplication) {
  const licenseService = app.get(LicenseService);

  try {
    await licenseService.ensureValid(true);
    console.log('Xác thực license thành công.');
  } catch (error) {
    console.error('Xác thực license thất bại khi khởi động.');
    console.error(error);
    process.exit(1);
  }
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
