import { SubscriptionEnum } from '../enums/subscription.enum';
import { StatusEnum } from '../enums/status.enum';

export interface ClientInterface {
  firstname: string;
  lastname: string;
  telegram_username: string;
  telegram_id: number;
  email?: string;
  phone?: string;
  subscription?: SubscriptionEnum;
  status?: StatusEnum;
  curator?: string;
}
