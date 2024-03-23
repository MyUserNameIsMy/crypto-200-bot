import { Injectable } from '@nestjs/common';
import { Ctx, Hears, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { SceneContext } from 'telegraf/typings/scenes';

@Injectable()
@Update()
export class BotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly botService: BotService,
  ) {}

  @Start()
  async start(@Ctx() ctx: SceneContext & Context) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from.id,
    };
    console.log(client);
    try {
      await ctx.reply(
        `‼Дорогие ученики Chinoesh Team‼\n\n` +
          `☑Это официальный бот курса «Криптология 5.0», который создан, что бы увеличить продуктивность наших учеников и будет выполнять следующие функции:\n\n` +
          `✅Анонс новостей и событии на курсе\n` +
          `✅Домашние задание - отправка и выполнение домашних заданий нужно делать через бота (чуть позднее сегодня дадим полную инструкцию по функционалу)\n` +
          `✅Полезные ссылки на сервисы для работы\n` +
          `💪Надеемся, что бот станет удобным и функциональным решением для наших учеников\n\n` +
          `🔥С уважением, Chinoesh Team`,
        {
          reply_markup: await this.botService.showKeyboardMenuButtons(),
        },
      );
      const isClient = await this.botService.getClient(client.telegram_id);
      console.log(isClient);
      if (!isClient) await this.botService.createClient(ctx, client);
      await ctx.scene.enter('base');
    } catch (err) {
      await this.botService.forwardToAdmin(
        'Update start' + JSON.stringify(client) + ' ' + err.message,
      );
    }
  }

  @Hears('/menu')
  async returnBase(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('base');
  }

  @Hears('🏠 Главное меню')
  async returnBase2(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('base');
  }
}
