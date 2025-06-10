export interface Order {
    id: number;
    agent_id: number;
    username: string;
    product: string;
    quantity: number;
    status: string;
    order_date: Date;
}