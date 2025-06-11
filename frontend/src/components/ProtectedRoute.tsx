import { Navigate, Outlet } from "react-router-dom";
import useUser from "../hooks/useUser.ts";

export default function ProtectedRoute() {
    const { user, loading} = useUser();

    if (loading) return <div className={"loader-overlay"}><div className={"loader"}/></div>;
    return user
        ? <Outlet />
        : <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;

}
