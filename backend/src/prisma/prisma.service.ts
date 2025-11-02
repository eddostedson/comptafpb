import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super();
    
    // Log la DATABASE_URL utilisée (masquée)
    const dbUrl = process.env.DATABASE_URL || this.configService.get<string>('DATABASE_URL');
    if (dbUrl) {
      const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
      console.log('🔗 PrismaService - DATABASE_URL:', maskedUrl);
      
      if (dbUrl.includes('supabase.co')) {
        console.log('   ✅ Connexion à Supabase');
      } else if (dbUrl.includes('localhost')) {
        console.log('   ⚠️ Connexion à PostgreSQL local');
      }
    } else {
      console.warn('   ⚠️ DATABASE_URL non trouvée');
    }
  }

  async onModuleInit() {
    try {
      // Connexion avec timeout
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000)
        )
      ]);
      console.log('✅ Prisma connected to PostgreSQL');
      
      // Vérifier combien de centres sont dans la base (ne pas bloquer le démarrage si cela échoue)
      try {
        const count = await this.centre.count();
        console.log(`📊 Nombre de centres dans la base connectée: ${count}`);
      } catch (error) {
        console.warn('⚠️ Impossible de compter les centres:', error.message);
      }
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error.message);
      console.error('💡 Vérifiez votre DATABASE_URL dans backend/.env');
      throw error; // Propager l'erreur pour que NestJS la gère
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected from PostgreSQL');
  }
}

