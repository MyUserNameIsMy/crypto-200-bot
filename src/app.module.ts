import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJWTConfig } from './config/jwt.config';
import { TelegrafModule } from 'nestjs-telegraf';
import { getTelegrafAsyncConfig } from './config/telegraf-async.config';
import { BullModule } from '@nestjs/bull';
import { getBullAsyncConfig } from './config/bull-async.config';
import { BotModule } from './modules/bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync(getJWTConfig()),
    TelegrafModule.forRootAsync(getTelegrafAsyncConfig()),
    BullModule.forRootAsync(getBullAsyncConfig()),
    BotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
