import type {Message} from "./Message.ts";

export interface Chat {
    id: number;
    username: string;
    messages: Message[];
    created_at: Date;
}