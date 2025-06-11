import {useEffect, useState} from "react";
import api from "../axios.ts";
import type {User} from "../models/User.ts";
import {useNavigate} from "react-router-dom";


export default function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/auth/me")
            .then((res)=> {
                setUser(res.data.user);
            })
            .catch(()=> {
                setUser(null);
            })
            .finally(()=> {
                setLoading(false);
            });
    }, []);

    const logout = async () => {
        try {
            await api.post("/auth/logout");
            alert("You have logged out.");
            navigate("/login");
        } catch (error: any) {
            alert(error.response?.data || "Failed to logout.");
            console.error("Failed to logout.", error);
        } finally {
            setUser(null);
        }
    };

    return {user, isLoggedIn: !!user, loading, logout}

}