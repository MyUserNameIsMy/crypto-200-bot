import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { BotService } from '../modules/bot/bot.service';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { SubscriptionEnum } from '../common/enums/subscription.enum';

@Processor('news')
export class NewsProcessor {
  constructor(
    private readonly botService: BotService,
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly httpService: HttpService,
  ) {}

  @Process('post_news')
  async sendNews(job: Job<any>) {
    let page = 0;
    const limit = 20;
    let progress = 0;
    try {
      const success_sent = [];
      let students: any;
      do {
        const response = await firstValueFrom(
          this.httpService.get(
            process.env.DIRECTUS_BASE +
              `/items/users?fields=*.*&filter[subscription][_eq]=${SubscriptionEnum.ELITE}&page=${page}&limit=${limit}`,
          ),
        );
        students = response?.data;
        page++;

        for (const user of students.data) {
          try {
            await this.bot.telegram.copyMessage(
              user.telegram_id,
              // process.env.ADMIN,
              job.data['chat_id'],
              job.data['message_id'],
            );
            success_sent.push({ telegram_id: user.telegram_id, id: user.id });
            await job.progress(progress);
            progress += 1;
          } catch (err) {
            console.log(`Send news to ${user.telegram_id}: ` + err.message);
          }
        }
        await this.botService.forwardToAdmin(
          'Successfully sent: ' + JSON.stringify(success_sent),
        );
        success_sent.length = 0;
      } while (students?.data.length > 0);
    } catch (err) {
      await this.botService.forwardToAdmin('Search users: ' + err.message);
    }
  }

  @Process('post_direction')
  async sendDirection(job: Job<any>) {
    let page = 0;
    const limit = 20;
    let progress = 0;
    try {
      const filter = {
        _and: [
          {
            direction: {
              _in: job.data['directions'],
            },
          },
          {
            subscription: {
              _eq: SubscriptionEnum.ELITE,
            },
          },
        ],
      };
      const success_sent = [];
      let students: any;
      do {
        const url =
          process.env.DIRECTUS_BASE +
          `/items/users?fields=*.*&filter=${JSON.stringify(filter)}&offset=${page * limit}&limit=${limit}`;
        console.log(url);
        const response = await firstValueFrom(this.httpService.get(url));
        students = response?.data;
        page++;

        for (const user of students.data) {
          console.log('Sending');
          try {
            await this.bot.telegram.sendMessage(
              user.telegram_id,
              // process.env.ADMIN,
              job.data['message'],
            );
            success_sent.push({ telegram_id: user.telegram_id });
            await job.progress(progress);
            progress += 1;
          } catch (err) {
            console.log(`Send news to ${user.telegram_id}: ` + err.message);
          }
        }
        await this.botService.forwardToAdmin(
          'Successfully sent: ' + JSON.stringify(success_sent),
        );
        success_sent.length = 0;
      } while (students?.data.length > 0);
    } catch (err) {
      await this.botService.forwardToAdmin('Search users: ' + err.message);
    }
  }

  @Process('post_groups')
  async postGroups(job: Job<any>) {
    let page = 0;
    const limit = 20;
    let progress = 0;
    try {
      const filter = {
        _and: [
          {
            direction: {
              _gte: 0,
            },
          },
          {
            subscription: {
              _eq: SubscriptionEnum.ELITE,
            },
          },
          {
            group: {
              _nnull: true,
            },
          },
        ],
      };
      const success_sent = [];
      let students: any;
      do {
        const url =
          process.env.DIRECTUS_BASE +
          `/items/users?fields=*.*&filter=${JSON.stringify(filter)}&offset=${page * limit}&limit=${limit}`;
        console.log(url);
        const response = await firstValueFrom(this.httpService.get(url));
        students = response?.data;
        page++;

        for (const user of students.data) {
          console.log('Sending');
          try {
            await this.bot.telegram.sendMessage(
              user.telegram_id,
              // process.env.ADMIN,
              `Вступите в группу по вашему направлению ${user.group}`,
            );
            success_sent.push({ telegram_id: user.telegram_id });
            await job.progress(progress);
            progress += 1;
          } catch (err) {
            console.log(`Send news to ${user.telegram_id}: ` + err.message);
          }
        }
        await this.botService.forwardToAdmin(
          'Successfully sent: ' + JSON.stringify(success_sent),
        );
        success_sent.length = 0;
      } while (students?.data.length > 0);
    } catch (err) {
      await this.botService.forwardToAdmin('Search users: ' + err.message);
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
}
