/** Whether the worker has handed a message to the SMS provider yet. */
export type MessageStatus = "queued" | "sent";

/** A text message the api keeps until the worker sends it. */
export type Message = {
  id: string;
  to: string;
  body: string;
  status: MessageStatus;
  sent_at?: string;
};

/** What a client posts to queue a message. */
export type NewMessage = Pick<Message, "to" | "body">;

/** The whole data file. `schema` is the version `migrate` brought it to. */
export type StoreData = {
  schema: number;
  next_id: number;
  messages: Message[];
};
