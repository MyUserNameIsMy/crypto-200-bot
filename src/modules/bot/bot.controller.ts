import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { PostDirectionDto } from './dto/post-direction.dto';

@Controller('bot')
export class BotController {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly botService: BotService,
  ) {}

  @Post('post_direction')
  async directionSpecific(@Body() body: PostDirectionDto) {
    console.log('Post_Direction');
    await this.botService.sendDirection(body.message, body.directions);
  }

  @Get('post_groups')
  async postGroups() {
    return await this.botService.postGroups();
  }
}
