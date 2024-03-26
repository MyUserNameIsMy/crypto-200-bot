import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { BaseScene } from './scenes/base.scene';
import { BotController } from './bot.controller';
import { HttpModule } from '@nestjs/axios';
import { NewsScene } from './scenes/news.scene';
import { BullModule } from '@nestjs/bull';
import { HomeworkScene } from './scenes/homework.scene';
import { NewsProcessor } from '../../queues/news.processor';
import { EmailScene } from './scenes/email.scene';

@Module({
  imports: [HttpModule, BullModule.registerQueueAsync({ name: 'news' })],
  providers: [
    BotUpdate,
    BotService,
    BaseScene,
    NewsScene,
    HomeworkScene,
    NewsProcessor,
    EmailScene,
  ],
  controllers: [BotController],
})
export class BotModule {}
