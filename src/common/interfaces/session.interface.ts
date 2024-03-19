export interface ISession {
  session: {
    student_id?: number;
    question_id?: number;
    chat_id?: number;
    from?: string;
    username?: string;
    hm?: string;
    group_name?: string;
    fio?: string;
  };
}
