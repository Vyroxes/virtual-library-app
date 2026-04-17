import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, authAxios } from '../utils/Auth';

import Header from '../components/Header';
import Footer from '../components/Footer';

const ProtectedRoute = ({ children }) => {
    const [auth, setAuth] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        let mounted = true;
        const checkAuth = async () => {
            const result = await isAuthenticated();
            if (mounted) setAuth(result);
        };
        checkAuth();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!auth) return;

        let stopped = false;

        const sendHeartbeat = async () => {
            if (stopped) return;
            try {
                await isAuthenticated();
                await authAxios.post(`${apiUrl}/api/activity`, {});
            } catch (error) {
                console.error("Wystąpił błąd podczas pobierania aktywności użytkownika: ", error)
            }
        };

        sendHeartbeat();
        const intervalId = setInterval(sendHeartbeat, 30000);

        return () => {
            stopped = true;
            clearInterval(intervalId);
        };
    }, [auth, apiUrl]);

    if (auth === null) return null;
    
    return auth ? (
        <>
            <Header />
            {children}
            <Footer />
        </>
    ) : <Navigate to="/login" replace />;
};

export default ProtectedRoute;