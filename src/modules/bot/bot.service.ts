import { Injectable } from '@nestjs/common';
import { ReplyKeyboardMarkup } from 'telegraf/src/core/types/typegram';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { SceneContext } from 'telegraf/typings/scenes';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ClientInterface } from '../../common/interfaces/client.interface';
import { RoleEnum } from '../../common/enums/role.enum';
import { SubscriptionEnum } from '../../common/enums/subscription.enum';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @InjectQueue('news') private newsQueue: Queue,
    private readonly httpService: HttpService,
  ) {}

  async createClient(ctx: Context & SceneContext, client: ClientInterface) {
    try {
      const groups = {
        '-1002095716700': '@Akzhol_Bolatuly7',
        '-1002002787149': '@Nbm808',
        '-1002112213514': '@rezikhann',
        '-1002037751368': '@dan7yar',
        '-1002018072701': '@sherniaz16',
        '-1002142093638': '@Akzhol_Bolatuly7',
      };
      for (const id in groups) {
        const res = await this.bot.telegram.getChatMember(
          id,
          client.telegram_id,
        );
        if (
          res.status == RoleEnum.CREATOR ||
          res.status == RoleEnum.MEMBER ||
          res.status == RoleEnum.ADMIN
        ) {
          client.curator = groups[id];
          if (id == '-1002142093638') {
            client.subscription = SubscriptionEnum.BASE;
          } else {
            client.subscription = SubscriptionEnum.ELITE;
          }
          break;
        }
      }
      return await firstValueFrom(
        this.httpService.post(
          `${process.env.DIRECTUS_BASE}/items/users`,
          client,
        ),
      );
    } catch (err) {
      console.error(err.message);
      await this.forwardToAdmin(
        'Create' + JSON.stringify(client) + ' ' + err.message,
      );
    }
  }

  async getClient(telegram_id: number) {
    try {
      const url = `${process.env.DIRECTUS_BASE}/items/users?filter[telegram_id][_eq]=${telegram_id}&fields=*.*`;
      console.log(url);
      const { data: students } = await firstValueFrom(
        this.httpService.get(url),
      );
      console.log(students);
      return students.data[0];
    } catch (err) {
      console.error('Error get client' + err.message);
      await this.forwardToAdmin(
        'Get' + JSON.stringify(telegram_id) + ' ' + err.message,
      );
    }
  }

  async updateClient(client: ClientInterface, student_id: number) {
    try {
      return await firstValueFrom(
        this.httpService.patch(
          `${process.env.DIRECTUS_BASE}/items/users/${student_id}`,
          client,
        ),
      );
    } catch (err) {
      console.error(err.message);
      await this.forwardToAdmin(
        'Update' + JSON.stringify(client) + ' ' + err.message,
      );
    }
  }

  async forwardToAdmin(details: string) {
    try {
      await this.bot.telegram.sendMessage(process.env.ADMIN, details);
    } catch (err) {
      console.error(err.message);
    }
  }

  async showKeyboardMenuButtons(): Promise<ReplyKeyboardMarkup> {
    return {
      keyboard: [[{ text: '🏠 Главное меню' }]],
      resize_keyboard: true,
    };
  }

  async sendNews(ctx: SceneContext) {
    await this.newsQueue.add('post_news', {
      message_id: ctx.message.message_id,
      chat_id: ctx.message.from.id,
    });
  }

  async showHomework(ctx: SceneContext & Context) {
    const client = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from.id,
    };
    try {
      const { data: response } = await lastValueFrom(
        this.httpService.get(`${process.env.DIRECTUS_BASE}/items/homework`),
      );
      ctx.session['hm_id'] = response.data[0].id;
      await ctx.reply(response.data[0].description, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Сдать домашнее задание',
                callback_data: 'submit-homework',
              },
            ],
          ],
        },
        parse_mode: 'Markdown',
      });
    } catch (err) {
      await this.forwardToAdmin(
        'Show Homework' + JSON.stringify(client) + ' ' + err.message,
      );
      await ctx.reply(
        'Возникли проблемы при отправке домашнего задания. Свяжитесь с техническим специалистом @DoubledBo.',
      );
    }
  }
}
