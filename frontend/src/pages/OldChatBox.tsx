import React, {type FormEvent, useEffect, useRef, useState} from "react";
import Navbar from "../components/Navbar.tsx";
import {AnimatePresence, motion} from "framer-motion";
import ReactMarkdown from "react-markdown";
import api from "../axios.ts";
import useUser from "../hooks/useUser.ts";
import {useLocation, useNavigate} from "react-router-dom";

const ChatBox: React.FC = () => {
    const {user, loading: userLoading} = useUser();
    const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const location = useLocation();
    const chatIdStr = location.pathname.split("/chats/")[1];
    const chatId = chatIdStr === "new" ? undefined : Number(chatIdStr);
    const [currentChatId] = useState<number | null>(chatId ?? null);
    const navigate = useNavigate();


    useEffect(() => {
        if(userLoading) return;
        if (!user) {
            navigate("/login");
            return;
        }

        async function fetchChat() {
            try {
                const response = await api.get(`/chat/${chatId}`);
                const { username } = response.data;
                console.log(username);
                console.log("u: " + user?.username);
                if (username !== user?.username) {
                    navigate("/");
                }
            } catch (error) {
                console.log(error);
            }
        }
        if (chatId) {

            fetchChat();
            api.get(`/messages/${chatId}`)
                .then((res) => {
                    const messages = res.data.map((msg) => ({
                        text: msg.text,
                        sender: msg.sender
                    }));
                    setMessages(messages);
                })
                .catch((err) => {
                    console.error("Error fetching messages:", err);
                });
        }
    }, [chatId, user, userLoading]);


    const sendMessage = async () => {
        if (!input.trim() || !currentChatId) return;

        const userMessage = { text: input, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            // save message to DB
            await api.post("/messages", {
                chat_id: currentChatId,
                text: input,
                sender: "user"
            });

            // get agent reply
            const response = await api.post("/chat/reply", {
                message: input,
                chat_id: currentChatId,
                username: user?.username
            });

            console.log(response);
            const botMessage = { text: response.data.reply, sender: "agent" };
            setMessages((prev) => [...prev, botMessage]);

            // optionally save agent message too
            await api.post("/messages", {
                chat_id: currentChatId,
                text: response.data.reply,
                sender: "agent",
                bot: true
            });

        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setLoading(false);
        }

        setInput("");
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
            </div>
            }

        </>
    );
};

export default ChatBox;