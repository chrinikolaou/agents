import {useEffect, useState} from "react";
import api from "../axios.ts";
import type {Order} from "../models/Order.ts";

export default function useOrders(username?: string) {

    const [orders, setOrders] = useState<Order[] | null>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {

        if(!username) return;

        async function fetch() {
            try {
                const response = await api.get(`/orders/user/${username}`);
                setOrders(response.data);
            } catch (err) {
                console.error("Failed to fetch user's orders.", err);
            } finally {
                setLoading(false);
            }
        }

        if (username) {
            fetch();
        }
    }, [username]);

    return { orders, loading };
}
