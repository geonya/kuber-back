import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/auth.guard';

@Module({
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
