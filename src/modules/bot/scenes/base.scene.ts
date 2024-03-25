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
import { ClientInterface } from '../../../common/interfaces/client.interface';
import { SubscriptionEnum } from '../../../common/enums/subscription.enum';

@Injectable()
@Scene('base')
export class BaseScene {
  constructor(
    private readonly botService: BotService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext & Context) {
    const client: ClientInterface = {
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

      ctx.session['curator'] = student_system.curator;
      ctx.session['hm_channel'] = channels[student_system.curator];
      let direction = 'нет направления';
      switch (student_system?.direction) {
        case 1:
          direction = 'Крипто Хантинг';
          break;
        case 2:
          direction = 'Крипто Арбитраж';
          break;
        case 3:
          direction = 'Крипто Хантинг + Крипто Арбитраж';
          break;
        case 4:
          direction = 'Трейдинг';
          break;
        case 5:
          direction = 'Крипто Хантинг + Трейдинг';
          break;
        case 6:
          direction = 'Крипто Арбитраж + Трейдинг';
          break;
        case 7:
          direction = 'Крипто Хантинг + Крипто Арбитраж + Трейдинг';
          break;
      }
      await ctx.reply(
        `Личный кабинет: ${student_system.telegram_username}\n` +
          `Набранные очки: ${student_system.score}\n` +
          student_system?.subscription ==
          SubscriptionEnum.ELITE
          ? `Направление: ${direction}`
          : '',
      );

      await ctx.reply('Нажмите чтобы выбрать действие.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Домашнее задание', callback_data: 'homework' }],
            [{ text: 'Мой куратор', callback_data: 'my-curator' }],
            client?.telegram_id?.toString() == process.env.ADMIN
              ? [{ text: 'Новости', callback_data: 'news' }]
              : [],
            new Date('2024-01-26T03:00:00') < new Date() &&
            student_system?.subscription == SubscriptionEnum.ELITE
              ? [{ text: 'Выбрать направление', callback_data: 'direction' }]
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

  @Action('confirm')
  async confirmOption(@Ctx() ctx: SceneContext) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from?.id,
    };
    try {
      await ctx.reply(
        'Вы выбрали: \n' +
          (ctx.session['option1'] ? ' Крипто Хантинг\n' : '') +
          (ctx.session['option2'] ? ' Крипто Арбитраж\n' : '') +
          (ctx.session['option3'] ? ' Трейдинг\n' : ''),
      );
      let direction = 0;
      if (ctx.session['option1']) {
        direction += 1;
      }
      if (ctx.session['option2']) {
        direction += 2;
      }
      if (ctx.session['option3']) {
        direction += 4;
      }

      if (direction == 0) {
        await ctx.reply(
          'Вы не сделали выбор направления. Прошу вас сделать выбор зайдя в Меню и Выбрать направление',
        );
        await ctx.scene.enter('base');
        return;
      }
      await this.botService.updateDirection(client.telegram_id, direction);
      await ctx.scene.enter('base');
    } catch (err) {
      await ctx.reply(
        'Ошибка при выборе направления. Пожалуйста обратитесь со скринами действий к техническому специалисту https://t.me/DoubledBo. Спасибо!',
      );
      await this.botService.forwardToAdmin(
        'Направление ' +
          JSON.stringify(client) +
          ' ' +
          err +
          (ctx.session['option1'] ? ' Крипто Хантинг\n' : '') +
          (ctx.session['option2'] ? ' Крипто Арбитраж\n' : '') +
          (ctx.session['option3'] ? ' Трейдинг\n' : ''),
      );
    }
  }

  @Action(/direction/)
  async chooseDirection(@Ctx() ctx: SceneContext) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from?.id,
    };
    try {
      const option = ctx.update['callback_query']['data'].replace(/\D/g, '');
      if (option == 1) {
        ctx.session['option1'] = !ctx.session['option1'];
      } else if (option == 2) {
        ctx.session['option2'] = !ctx.session['option2'];
      } else if (option == 3) {
        ctx.session['option3'] = !ctx.session['option3'];
      } else {
        ctx.session['option1'] = false;
        ctx.session['option2'] = false;
        ctx.session['option3'] = false;
      }
      await ctx.deleteMessage();
      await ctx.reply(
        'Ваш выбор:\n' +
          (ctx.session['option1'] ? ' Крипто Хантинг\n' : '') +
          (ctx.session['option2'] ? ' Крипто Арбитраж\n' : '') +
          (ctx.session['option3'] ? ' Трейдинг\n' : '') +
          'Чтобы подтвердить свой выбор нажмите Подтвердить.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text:
                    'Крипто Хантинг' + (ctx.session['option1'] ? ' 🟢' : ' 🔴'),
                  callback_data: 'direction-1',
                },
              ],
              [
                {
                  text:
                    'Крипто Арбитраж' +
                    (ctx.session['option2'] ? ' 🟢' : ' 🔴'),
                  callback_data: 'direction-2',
                },
              ],
              [
                {
                  text: 'Трейдинг' + (ctx.session['option3'] ? ' 🟢' : ' 🔴'),
                  callback_data: 'direction-3',
                },
              ],
              [{ text: 'Подтвердить', callback_data: 'confirm' }],
            ],
          },
        },
      );
    } catch (err) {
      await ctx.reply(
        'Ошибка при выборе направления. Пожалуйста обратитесь со скринами действий к техническому специалисту https://t.me/DoubledBo. Спасибо!',
      );
      await this.botService.forwardToAdmin(
        'Направление ' +
          JSON.stringify(client) +
          ' ' +
          err +
          (ctx.session['option1'] ? ' Крипто Хантинг\n' : '') +
          (ctx.session['option2'] ? ' Крипто Арбитраж\n' : '') +
          (ctx.session['option3'] ? ' Трейдинг\n' : ''),
      );
    }
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
      ctx.session['hm_id'] = hm_id;
      const homework = await this.botService.getHomework(hm_id);
      const day = new Date();
      await ctx.reply(homework.description, { parse_mode: 'Markdown' });
      if (new Date(homework.due_to) < day) {
        await ctx.replyWithHTML(`*Время отправки домашнего задания прошло.*`, {
          parse_mode: 'Markdown',
        });
        await ctx.scene.enter('base');
      } else {
        await ctx.reply(
          '**Для того чтобы выйти выберите** *Главное меню*. *Чтобы начать сдачу задания обязательно сначала нажмите приложить файлы и только затем отправляйте файлы.*',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Приложить файлы', callback_data: 'submit-homework' }],
                [{ text: 'Главное меню', callback_data: 'menu' }],
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

  @Action(/menu/)
  async menu(@Ctx() ctx: SceneContext & Context) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from?.id,
    };
    try {
      await ctx.deleteMessage();
      await ctx.scene.enter('base');
    } catch (err) {
      await ctx.reply(
        'Неполадки на сервисе. Пожалуйста обратитесь со скринами действий к техническому специалисту https://t.me/DoubledBo. Спасибо!',
      );
      await this.botService.forwardToAdmin(
        'Menu ' + JSON.stringify(client) + ' ' + err,
      );
    }
  }

  @Action(/my-curator/)
  async myCurator(@Ctx() ctx: SceneContext & Context) {
    await ctx.reply(ctx.session['curator']);
  }
}
