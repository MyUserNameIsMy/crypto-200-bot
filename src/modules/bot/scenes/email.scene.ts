import { Injectable } from '@nestjs/common';
import {
  Action,
  Ctx,
  Hears,
  InjectBot,
  On,
  Scene,
  SceneEnter,
} from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { BotService } from '../bot.service';
import { SceneContext } from 'telegraf/typings/scenes';
import { ClientInterface } from '../../../common/interfaces/client.interface';

@Injectable()
@Scene('email')
export class EmailScene {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly botService: BotService,
  ) {}
  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext) {
    await ctx.reply('Отправьте свою почту. Например: mymail@gmail.com');
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
  async fio(@Ctx() ctx: SceneContext) {
    try {
      ctx.session['email'] = ctx.message['text'];
      await ctx.reply(ctx.session['email'], {
        reply_markup: {
          inline_keyboard: [[{ text: 'Подтвердить', callback_data: 'accept' }]],
        },
      });
    } catch (err) {
      console.log(err.message);
    }
  }

  @Action(/accept/)
  async accept(@Ctx() ctx: SceneContext) {
    const client: ClientInterface = {
      firstname: ctx.from.first_name,
      lastname: ctx.from.last_name,
      telegram_username: ctx.from.username,
      telegram_id: ctx.from.id,
    };
    try {
      const student_system = await this.botService.getClient(
        client.telegram_id,
      );
      client.email = ctx.session['email']?.trim();
      const { data: response } = await this.botService.updateClient(
        client,
        student_system.id,
      );
      await ctx.deleteMessage();
      await ctx.reply(`Почта принято. ${ctx.session['email']}`);
      ctx.session['email'] = 'none';
      await ctx.scene.enter('base');
    } catch (err) {
      await this.botService.forwardToAdmin(
        'changeEmail ' + JSON.stringify(client) + err.message,
      );
    }
  }
}
