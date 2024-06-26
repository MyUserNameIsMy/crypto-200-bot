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

  isEveryThirdDayFromDate(startDate) {
    const startDateObj = new Date(startDate);
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() - 5);
    const timeDiff = currentDate.getTime() - startDateObj.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    return daysDiff % 3 === 0;
  }
  async createClient(ctx: Context & SceneContext, client: ClientInterface) {
    try {
      console.log('Hello');
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
      const { data: students } = await firstValueFrom(
        this.httpService.get(url),
      );
      return students.data[0];
    } catch (err) {
      await this.forwardToAdmin(
        'Get' + JSON.stringify(telegram_id) + ' ' + err.message,
      );
    }
  }

  async sendMeetings(ctx: SceneContext) {
    const groups = {
      1: [0, 1],
      2: [0, 2],
      3: [0, 1, 2],
      4: [0, 4],
      5: [0, 1, 4],
      6: [0, 2, 4],
      7: [0, 1, 2, 4],
      0: [0],
    };
    try {
      const url = `${process.env.DIRECTUS_BASE}/items/meetings?filter[is_active][_eq]=true`;
      const { data: meeetings } = await lastValueFrom(
        this.httpService.get(url),
      );
      let flag = true;
      for (const meet of meeetings.data) {
        if (groups[+ctx.session['direction']].includes(+meet.direction)) {
          flag = false;
          await ctx.reply(meet.text);
        }
      }
      if (flag) {
        await ctx.reply('Нет ближайших встреч');
        return;
      }
    } catch (err) {
      await this.forwardToAdmin(
        'Get' + JSON.stringify(ctx.from.id) + ' ' + err.message,
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
      await this.forwardToAdmin(
        'Update' + JSON.stringify(client) + ' ' + err.message,
      );
    }
  }
  async updateDirection(telegram_id: number, direction: number) {
    try {
      const student = await this.getClient(telegram_id);
      return await firstValueFrom(
        this.httpService.patch(
          `${process.env.DIRECTUS_BASE}/items/users/${student.id}`,
          {
            direction: direction,
          },
        ),
      );
    } catch (err) {
      await this.forwardToAdmin(
        'Update Direction' + JSON.stringify(telegram_id) + ' ' + err.message,
      );
    }
  }

  async updateActivities(telegram_id: number, activities: []) {
    try {
      const student = await this.getClient(telegram_id);
      const options = [];
      activities.forEach((item, idx) => {
        if (item) {
          options.push(`option${idx + 1}`);
        }
      });
      return await firstValueFrom(
        this.httpService.post(`${process.env.DIRECTUS_BASE}/items/activities`, {
          user_id: student.id,
          work_done: options,
        }),
      );
    } catch (err) {
      console.log(err);
      await this.forwardToAdmin(
        'Update Activities' + JSON.stringify(telegram_id) + ' ' + err.message,
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

  async sendDirection(message: string, directions: number[]) {
    await this.newsQueue.add('post_direction', {
      message: message,
      directions: directions,
    });
  }

  async chooseHomework(direction: number) {
    console.log(direction);
    const groups = {
      1: [0, 1],
      2: [0, 2],
      3: [0, 1, 2],
      4: [0, 4],
      5: [0, 1, 4],
      6: [0, 2, 4],
      7: [0, 1, 2, 4],
      0: [0],
    };
    const inline_keyboard = [];
    const day = new Date();
    const { data: homeworks } = await firstValueFrom(
      this.httpService.get(process.env.DIRECTUS_BASE + `/items/homework`),
    );
    let i = 1;
    for (const homework of homeworks.data) {
      if (groups[direction].includes(+homework.direction)) {
        inline_keyboard.push([
          {
            text:
              `ДЗ ${i++}` + (day > new Date(homework.due_to) ? ' 🔴' : ' 🟢'),
            callback_data: `hm-${homework.id}`,
          },
        ]);
      }
    }
    return {
      inline_keyboard,
    };
  }

  async getHomework(hm_id: number) {
    try {
      const { data: homework } = await firstValueFrom(
        this.httpService.get(
          process.env.DIRECTUS_BASE + `/items/homework/${hm_id}`,
        ),
      );
      return homework.data;
    } catch (err) {
      await this.forwardToAdmin('getHomework' + ' ' + err.message);
    }
  }

  getListActivities(subscription: SubscriptionEnum) {
    return subscription.toUpperCase() === SubscriptionEnum.ELITE
      ? [
          'Делал Домашние Задание',
          'Заходил в сделку потрейдингу по сигналу',
          'Заходил в крипто-проекты выданные на канале',
          'Крутил классические связки',
          'Крутил международные связки',
          'Был на офлайн встречах(Алматы/Астана)',
          'Был на онлайн встречах(ZOOM)',
          'Смотрел запись ZOOM-встреч',
          'Смотрел Уроки на GetCourse',
          'Был активным в своей Команде(Telegram Чат)',
        ]
      : [
          '',
          '',
          '',
          'Крутил классические связки',
          'Крутил международные связки',
          '',
          '',
          '',
          'Смотрел Уроки на GetCourse',
          'Был активным в своей Команде(Telegram Чат)',
        ];
  }

  async getActivitiesButtons(
    chosen_activities: [],
    subscription: SubscriptionEnum,
  ) {
    const inline_keyboard = [];
    const activities = this.getListActivities(subscription);
    for (let i = 0; i < activities.length; i++) {
      if (activities[i] == '') continue;
      inline_keyboard.push([
        {
          text: activities[i] + (chosen_activities[i] ? ' 🟢' : ' 🔴'),
          callback_data: `activities${i + 1}`,
        },
      ]);
    }
    inline_keyboard.push([{ text: 'Подтвердить', callback_data: 'confirm' }]);
    return {
      inline_keyboard,
    };
  }

  async postGroups() {
    await this.newsQueue.add('post_groups', { key: 'value' });
    return 'Success';
  }
}
