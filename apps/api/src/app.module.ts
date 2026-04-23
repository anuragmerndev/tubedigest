import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OrgsModule } from './orgs/orgs.module';
import { MembersModule } from './members/members.module';
import { SummariesModule } from './summaries/summaries.module';
import { UsageModule } from './usage/usage.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as object,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }], // 100 req/min global default
    }),
    AuthModule,
    OnboardingModule,
    OrgsModule,
    MembersModule,
    SummariesModule,
    UsageModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
