import {
  TelegrafModuleAsyncOptions,
  TelegrafModuleOptions,
} from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as LocalSession from 'telegraf-session-local';

const sessions = new LocalSession({ database: 'session_db.json' });
export const getTelegrafAsyncConfig = (): TelegrafModuleAsyncOptions => ({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TelegrafModuleOptions => ({
    token: configService.get('TELEGRAM_BOT_TOKEN'),
    middlewares: [sessions.middleware()],
    options: {
      handlerTimeout: Infinity,
    },
  }),
});
