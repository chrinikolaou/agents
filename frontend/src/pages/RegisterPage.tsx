import Navbar from "../components/Navbar.tsx";
import React, {type FormEvent, useState} from "react";
import style from "./style/RegisterPage.module.css";
import {Link, useNavigate} from "react-router-dom";
import api from "../axios.ts";
import useUser from "../hooks/useUser.ts";

export default function RegisterPage() {

    const {user, loading: userLoading} = useUser();
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const navigate = useNavigate();

    if(user) {
        navigate("/");
        return;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        try {
            await api.post('/auth/register', {
                username: username,
                password: password,
            });
            alert("You have registered successfully.");
            const params = new URLSearchParams(location.search);
            const redirectTo = params.get("redirectTo") || "/";

            navigate(redirectTo, { replace: true });
        } catch(error: any) {
            console.error(error);
            alert(error.response.data);
        }

    }

    if(userLoading) return <div className={"global-loader-overlay"}><div className={"global-loader"}/></div>;

    return (
        <>
            <Navbar/>
            <div className={style.container}>
                <form onSubmit={handleSubmit} className={style.form}>
                    <h2>Order.ai</h2>
                    <label htmlFor={"username"}>Όνομα Χρήστη
                        <input type={"text"} id={"username"} name={"username"} placeholder={"Όνομα Χρήστη"} value={username} onChange={(e)=>setUsername(e.target.value)}/>
                    </label>

                    <label htmlFor={"password"}>Κωδικός Πρόσβασης
                        <input type={"password"} id={"password"} name={"password"} placeholder={"Κωδικός Πρόσβασης"} value={password} onChange={(e)=>setPassword(e.target.value)}/>
                    </label>

                    <button type={"submit"} className={"btn btn-primary"}>Εγγραφή</button>

                    <Link to={"/login"} className={"hoverable"}>Έχεις ήδη λογαριασμό; Κάνε σύνδεση τώρα.</Link>
                </form>
            </div>
        </>
    );
}