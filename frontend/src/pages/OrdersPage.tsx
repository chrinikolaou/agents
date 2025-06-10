import useUser from "../hooks/useUser.ts";
import useOrders from "../hooks/useOrders.ts";
import Navbar from "../components/Navbar.tsx";
import {motion} from "framer-motion";
import style from "./style/OrdersPage.module.css";

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
                    {orders!=null && orders.map((o,i)=> (<div className={style.order}></div>))}

                    <div className={style.order}>
                        <h4>Μπλουζάκι</h4>
                        <div className={style.orderInfo}>
                            <p>Πράκτορας: <span style={{fontWeight: 450}}>#1</span></p>
                            <p>Δυναμικό τεχτ generated από τον πράκτορα.</p>
                        </div>

                    </div>
                </div>
            </div>

        </>
    );
}