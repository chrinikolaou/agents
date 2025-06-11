import { createContext, useContext, useState, useEffect, type ReactNode } from "react";


const ThemeContext = createContext<{
    theme: string;
    setTheme: (theme: string) => void;
}>({
    theme: "light",
    setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<string>("");

    useEffect(() => {

        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
        setTheme(savedTheme);
    }, []);

    const updateTheme = (newTheme: string) => {
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Create a custom hook to use the ThemeContext
export const useTheme = () => useContext(ThemeContext);
