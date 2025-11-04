import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  
  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3975',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Temporairement désactivé pour debug
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.error('[ValidationPipe] Erreurs de validation:', JSON.stringify(errors, null, 2));
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CGCS API')
    .setDescription('API de Comptabilité de Gestion des Centres de Santé')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  
  // Gestion gracieuse de l'arrêt
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM reçu, arrêt gracieux du serveur...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT reçu, arrêt gracieux du serveur...');
    await app.close();
    process.exit(0);
  });

  // Gestion des erreurs non capturées (empêche le crash immédiat)
  process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non capturée:', error);
    console.error('💡 Le serveur continue de fonctionner. Utilisez un gestionnaire de processus (PM2/keep-alive) pour redémarrer automatiquement.');
    // Ne pas arrêter le processus - laisser PM2/nodemon/keep-alive le gérer
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    console.error('💡 Le serveur continue de fonctionner. Vérifiez les logs pour plus de détails.');
    // Ne pas arrêter le processus
  });

  await app.listen(port);
  
  console.log(`🚀 Backend CGCS running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`💚 Backend prêt et en ligne`);
}

bootstrap().catch((error) => {
  console.error('❌ Erreur fatale lors du démarrage:', error);
  process.exit(1);
});

