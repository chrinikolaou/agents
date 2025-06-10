import React, {type FormEvent, useEffect, useRef, useState} from "react";
import Navbar from "../components/Navbar.tsx";
import {AnimatePresence, motion} from "framer-motion";
import ReactMarkdown from "react-markdown";
import api from "../axios.ts";
import useUser from "../hooks/useUser.ts";

const ChatBox: React.FC = () => {
    const {user, loading: userLoading} = useUser();
    const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        setLoading(true);

        try {
            const res = await api.post("/chat", { username: user?.username, agent_id: 1 });
            const chatId = res.data.id;

            // Προσθήκη μηνύματος χρήστη στη μνήμη
            const userMessage = { text: input, sender: "user" };
            setMessages((prev) => [...prev, userMessage]);

            // Save user message to DB
            await api.post("/messages", {
                chat_id: chatId,
                text: input,
                sender: "user"
            });

            // Απόκριση bot
            const response = await api.post("/chat/reply", {
                message: input,
                chat_id: chatId,
                username: user?.username
            });

            const botMessage = { text: response.data.reply, sender: "agent" };
            setMessages((prev) => [...prev, botMessage]);

            // Save agent reply to DB
            await api.post("/messages", {
                chat_id: chatId,
                text: response.data.reply,
                sender: "agent"
            });
        } catch (error) {
            console.error("Error during chat:", error);
        } finally {
            setLoading(false);
            setInput("");
        }
    };



    const handleSubmit = (e:FormEvent) => {
        e.preventDefault();
        sendMessage();
    }

    useEffect(()=> {
       const h2 = document.querySelector(".container h2") as HTMLHeadingElement;
       if(messages.length == 0) return;
       if(h2) h2.style.display="none";
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const text = "Πώς μπορώ να σε βοηθήσω;";
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

    if(userLoading) return <div className={"global-loader-overlay"}><div className={"global-loader"}/></div>;


    return (
        <>
        <Navbar/>
            {userLoading && <div className={"global-loader-overlay"}><div className={"global-loader"}/></div> }

            {user && !userLoading && <div className={"container"}>
                <motion.h2
                    variants={sentence}
                    initial="hidden"
                    animate="visible"
                    style={{ display: "flex", flexWrap: "wrap", whiteSpace: "pre-wrap" }}
                >
                    {text.split("").map((char, index) => (
                        <motion.span key={index} variants={letter}>
                            {char}
                        </motion.span>
                    ))}
                </motion.h2>
                <form onSubmit={(e)=>handleSubmit(e)}>
                    <div className={"textarea"}>

                        {messages.map((msg, index) => (
                            <div className={`${msg.sender}-overlay`}>
                                {msg.sender==="agent" && <img src={"/bot.png"} alt={"Bot"}/>}
                            <div key={index} className={`${msg.sender}`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                            </div>
                            ))}

                        {loading && (
                            <div className={"agent-overlay"}>
                                <div className={"agent"}>
                                    <div className="loader"/>
                                </div>

                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <AnimatePresence mode={"wait"}>
                    <motion.div className={"buttons"} key={messages.length === 0 ? "top" : "bottom"}
                                initial={{
                                    top: messages.length === 0 ? "430px" : "auto",
                                    bottom: messages.length === 0 ? "auto" : "0px",
                                    opacity: 0
                                }}
                                animate={{
                                    top: messages.length === 0 ? "430px" : "auto",
                                    bottom: messages.length === 0 ? "auto" : "0px",
                                    opacity: 1
                                }}
                                exit={{
                                    top: messages.length === 0 ? "430px" : "auto",
                                    bottom: messages.length === 0 ? "auto" : "0px",
                                    opacity: 0
                                }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}>
                        <textarea className={"input"} value={input} onChange={(e)=>setInput(e.target.value)} placeholder={"Ρώτα οτιδήποτε"}/>
                        <input type={"submit"} value={"Αποστολή"} className={"btn btn-primary"}/>
                    </motion.div>
                    </AnimatePresence>

                </form>
            </div>}

        </>
    );
};

export default ChatBox;