import { Injectable } from '@nestjs/common';
import { Ctx, Hears, InjectBot, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotService } from '../bot.service';
import { Context, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';

@Injectable()
@Scene('homework')
export class HomeworkScene {
  constructor(
    private readonly botService: BotService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext) {
    await ctx.replyWithHTML(
      `**Отправка домашнего задания. Отправьте домашнее задание в виде файлов или фото/скриншотов по одному.\n**` +
        `*🚫 Текст не принимается.* **Убедитесь что получили сообщение файл принят для каждого отправленного файла.\n**` +
        `**Для того чтобы выйти или завершить отправку, нажмите на** *Главное меню*.\n` +
        `**Кнопка** *Главное меню* **находится на клавиатуре.**`,
      {
        parse_mode: 'Markdown',
      },
    );
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
  async submitToChannel(@Ctx() ctx: Context & SceneContext) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from.id,
    };
    try {
      console.log(client);
      console.log(ctx.session['hm_channel']);
      console.log(ctx.session['hm_id']);
      await ctx.telegram.sendMessage(
        ctx.session['hm_channel'],
        `Student ID: ${client.telegram_id}\n` +
          `Student username: @${client.telegram_username}\n` +
          `Homework ID: ${ctx.session['hm_id']}`,
      );
      await ctx.copyMessage(ctx.session['hm_channel']);
      await ctx.reply('Файл принят');
    } catch (err) {
      console.log(err);
      console.log(err.message);
      await this.botService.forwardToAdmin(
        err.message + `${ctx.message.from.id} ${ctx.message.from.username}`,
      );
      await ctx.reply(
        'Возникли проблемы при отправке домашнего задания. Свяжитесь с техническим специалистом @DoubledBo.',
      );
    }
  }
}
