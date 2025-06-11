import useUser from "../hooks/useUser.ts";
import useOrders from "../hooks/useOrders.ts";
import Navbar from "../components/Navbar.tsx";
import {motion} from "framer-motion";
import style from "./style/OrdersPage.module.css";

export function formatDate(dateInput: Date | string): string {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    const pad = (n: number) => n.toString().padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // months are 0-based
    const day = pad(date.getDate());

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


export default function OrdersPage() {

    const {user} = useUser();
    const {orders, loading} = useOrders(user?.username);

    const text = "Οι παραγγελίες σου";
    const sentence = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.06,
            },
        },
    };

    const letter = {
        hidden: { opacity: 0, x: -10 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { ease: "easeOut", duration: 0.5 },
        },
    };

    if(loading) return;

    return (
        <>
            <Navbar/>
            <div className={style.container}>
                <motion.h2
                    variants={sentence}
                    initial="hidden"
                    animate="visible"
                    style={{ display: "flex", flexWrap: "wrap", whiteSpace: "pre-wrap" }} // 👈 εδώ!
                >
                    {text.split("").map((char, index) => (
                        <motion.span key={index} variants={letter}>
                            {char}
                        </motion.span>
                    ))}
                </motion.h2>
                <div className={style.orders}>
                    {orders!=null && orders.map((o,i)=> (
                        <div className={style.order}>
                        <h4>{o.id}</h4>
                        <div className={style.orderInfo}>
                            <p><b>Προιόν:</b> {o.product}</p>
                            <p><b>Ποσότητα:</b> {o.quantity}</p>
                        </div>
                            <span>{formatDate(o.order_date)}</span>

                    </div>))}


                </div>
            </div>

        </>
    );
}