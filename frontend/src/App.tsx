import React, {useEffect, useState} from "react";
import ChatBox from "./pages/ChatBox.tsx";
import './App.css';
import {Route, BrowserRouter as Router, Routes} from "react-router-dom";
import {ThemeProvider} from "./context/ThemeContext.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import OrdersPage from "./pages/OrdersPage.tsx";
import OldChatBox from "./pages/OldChatBox.tsx";

const App: React.FC = () => {
    const [theme, setTheme] = useState<string>("");

    useEffect(() => {
        setTheme(localStorage.getItem("theme") || "light");
    }, []);

    return (
        <>
            <ThemeProvider>

                <Router>

                    <Routes>
                        <Route element={<ProtectedRoute/>}>
                        <Route path={"/"} element={<ChatBox/>}/>
                        <Route path={"/orders"} element={<OrdersPage/>}/>
                        <Route path={"/chats/*"} element={<OldChatBox/>}/>
                        </Route>
                        <Route path={"/login"} element={<LoginPage/>}/>
                        <Route path={"/register"} element={<RegisterPage/>}/>
                    </Routes>
                </Router>
            </ThemeProvider>
        </>
    );
};

export default App;