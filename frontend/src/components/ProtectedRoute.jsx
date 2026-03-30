import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/Auth';

import Header from '../components/Header';
import Footer from '../components/Footer';

const ProtectedRoute = ({ children }) => {
    const [auth, setAuth] = useState(null);


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