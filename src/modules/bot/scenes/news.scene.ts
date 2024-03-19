import { Injectable } from '@nestjs/common';
import { Ctx, Hears, InjectBot, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { BotService } from '../bot.service';
import { SceneContext } from 'telegraf/typings/scenes';

@Injectable()
@Scene('news')
export class NewsScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly botService: BotService,
  ) {}
  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext) {
    await ctx.reply('Отправляй контент.', {
      reply_markup: await this.botService.showKeyboardMenuButtons(),
    });
  }

  @Hears('/menu')
  async returnBase(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('base');
  }

  @Hears('🏠 Главное меню')
  async returnBase2(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('base');
  }

  @On('message')
  async onMessage(@Ctx() ctx: SceneContext) {
    await this.botService.sendNews(ctx);
  }
}
