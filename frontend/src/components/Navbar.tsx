import {Link} from "react-router-dom";
import ThemeButton from "./ThemeButton.tsx";
import {useEffect, useState} from "react";
import useUser from "../hooks/useUser.ts";
import useChats from "../hooks/useChats.ts";

export default function Navbar() {

    const {user, logout} = useUser();
    const {chats, loading, fetchChats} = useChats(user?.username);
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (open && user?.username) {
            fetchChats();
        }
    }, [open, user, fetchChats]);


    return (
        <>
            <header>
                <div className={"ctos"}>
                    {user && <button className={"cto-button"} onClick={()=>setOpen(!open)}><span className="material-symbols-outlined">forum</span></button>}
                    {user && <Link to={"/orders"} className={"cto-button"}><span className="material-symbols-outlined">receipt_long</span></Link>}
                </div>

                <Link to={"/"}>
                    <h2>Order.ai</h2>
                </Link>
                <div className={"ctos"}>
                    <ThemeButton/>
                    {!user && <Link to={"/login"} className={"btn-normalize btn-primary"}>Σύνδεση</Link>}
                    {user && <Link to={"/"} className={"btn-normalize btn-error"} onClick={logout}>Αποσύνδεση</Link> }
                </div>

            </header>

            <div className={`side-drawer ${open ? "open" : ""}`}>
                <h3>Ιστορικό Συνομιλιών</h3>
                <div className={"conversations"}>
                    {chats!=null && chats.map((c)=> (<Link to={`/chats/${c.id}`} className={"conversation"}>Συνομιλία #{c.id}</Link> ))}
                </div>
            </div>

            {/* Overlay */}
            {open && <div className="backdrop" onClick={() => setOpen(false)}></div>}

        </>
    )
}