import { Injectable } from '@nestjs/common';
import {
  Action,
  Ctx,
  Hears,
  InjectBot,
  Scene,
  SceneEnter,
} from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { BotService } from '../bot.service';
import { Context, Telegraf } from 'telegraf';

@Injectable()
@Scene('base')
export class BaseScene {
  constructor(
    private readonly botService: BotService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext & Context) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from?.id,
    };
    try {
      const student_system = await this.botService.getClient(
        client.telegram_id,
      );
      const { data: response } = await this.botService.updateClient(
        client,
        student_system.id,
      );
      const channels = {
        '@Akzhol_Bolatuly7': -4115948871,
        '@Nbm808': -4148173937,
        '@rezikhann': -4171230338,
        '@dan7yar': -4197036835,
        '@sherniaz16': -4167072562,
      };
      ctx.session['curator'] = response.data.curator;
      ctx.session['hm_channel'] = channels[response.data.curator];
      await ctx.reply(
        `*Личный кабинет:* **${client.telegram_username}**\n` +
          `*Набранные очки:* **${response.data.score}**\n`,
        {
          parse_mode: 'Markdown',
        },
      );
      await ctx.reply('Нажмите чтобы выбрать действие.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Домашнее задание', callback_data: 'homework' }],
            [{ text: 'Мой куратор', callback_data: 'my-curator' }],
            client.telegram_id.toString() == process.env.ADMIN
              ? [{ text: 'Новости', callback_data: 'news' }]
              : [],
          ],
        },
      });
    } catch (err) {
      await ctx.reply(
        'Неполадки на сервисе. Пожалуйста обратитесь со скринами действий к техническому специалисту https://t.me/DoubledBo. Спасибо!',
      );
      await this.botService.forwardToAdmin(
        'Base ' + JSON.stringify(client) + ' ' + err,
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

  @Hears('/remove')
  async remove(@Ctx() ctx: SceneContext) {
    ctx.session = null;
  }

  @Action(/begin/)
  async begin(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('begin');
  }

  @Action(/news/)
  async news(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('news');
  }

  @Action(/submit-homework/)
  async enterSubmit(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('homework');
  }

  @Action(/homework/)
  async showHomework(@Ctx() ctx: SceneContext & Context) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from?.id,
    };
    try {
      await ctx.deleteMessage();
      await ctx.reply(
        'Выберите домашнее задание которое хотите отправить.\n🔴 означает что время отправки прошло.\n🟢 означает можно еще сдавать.\nЕсли нет заданий, то вам еще не назначали задание.',
        {
          reply_markup: await this.botService.chooseHomework(),
        },
      );
    } catch (err) {
      await ctx.reply(
        'Неполадки на сервисе. Пожалуйста обратитесь со скринами действий к техническому специалисту https://t.me/DoubledBo. Спасибо!',
      );
      await this.botService.forwardToAdmin(
        'Homework ' + JSON.stringify(client) + ' ' + err,
      );
    }
  }

  @Action(/hm-/)
  async onChooseHomework(@Ctx() ctx: SceneContext & Context) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from?.id,
    };
    try {
      await ctx.deleteMessage();
      ctx.session['hm'] = ctx.update['callback_query']['data'];
      const hm = ctx.update['callback_query']['data'];
      const hm_id = hm.replace(/\D/g, '');
      const homework = await this.botService.getHomework(hm_id);
      const day = new Date();
      await ctx.reply(homework.description);
      if (homework.due_to < day) {
        await ctx.replyWithHTML(`*Время отправки домашнего задания прошло.*`, {
          parse_mode: 'Markdown',
        });
        await ctx.scene.enter('base');
      } else {
        await ctx.reply(
          '**Для того чтобы выйти или завершить отправку, нажмите на** *Меню* **и выберите** *Меню бота* **или** *Главное меню*. *Чтобы начать сдачу задания обязательно сначала нажмите приложить файлы и только затем отправляйте файлы.*',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Приложить файлы', callback_data: 'submit-homework' }],
              ],
            },
          },
        );
      }
    } catch (err) {
      await ctx.reply(
        'Неполадки на сервисе. Пожалуйста обратитесь со скринами действий к техническому специалисту https://t.me/DoubledBo. Спасибо!',
      );
      await this.botService.forwardToAdmin(
        'Homework ' + JSON.stringify(client) + ' ' + err,
      );
    }
  }

  @Action(/my-curator/)
  async myCurator(@Ctx() ctx: SceneContext & Context) {
    await ctx.reply(ctx.session['curator']);
  }
}
