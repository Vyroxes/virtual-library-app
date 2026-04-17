import { useEffect, useState } from 'react';
import { CiLogout } from "react-icons/ci";
import { useNavigate, useLocation } from "react-router-dom";
import { authAxios, logout, getUsername } from '../utils/Auth';

import './Header.css';

const Header = () => {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [username, setUsername] = useState(getUsername());

    const navigate = useNavigate();
    const location = useLocation();

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const currentUsername = getUsername();
        if (currentUsername !== username) {
            setUsername(currentUsername);
        }
    }, [username]);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (username) {
                try {
                    const response = await authAxios.get(
                        `${apiUrl}/api/user/${username}`
                    );

                    if (response.status === 200) {
                        setAvatarUrl(response.data.avatar_url);
                    }
                } catch (error) {
                    console.error("Błąd podczas pobierania avatara: ", error);
                }
            }
        };

        fetchAvatar();
    }, [apiUrl, username]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            console.log("Wylogowano pomyślnie");
        } catch (error) {
            console.error("Błąd podczas wylogowania: ", error);
            navigate('/login');
        }
    };

    return (
        <header className="header">
            <nav className="nav">
                <ul>
                    <li className={location.pathname === "/home" ? "active" : ""}>
                        <p onClick={() => navigate("/home")}>
                            STRONA GŁÓWNA
                        </p>
                    </li>

                    <li className={location.pathname.startsWith("/book-collection") ? "active" : ""}>
                        <p onClick={() => navigate("/book-collection")}>
                            KOLEKCJA KSIĄŻEK
                        </p>
                    </li>

                    <li className={location.pathname.startsWith("/wish-list") ? "active" : ""}>
                        <p onClick={() => navigate("/wish-list")}>
                            LISTA ŻYCZEŃ
                        </p>
                    </li>

                    <li className={location.pathname.startsWith("/premium") ? "active" : ""}>
                        <p onClick={() => navigate("/premium")}>
                            PREMIUM
                        </p>
                    </li>

                    <li className={location.pathname.startsWith("/contact") ? "active" : ""}>
                        <p onClick={() => navigate("/contact")}>
                            KONTAKT
                        </p>
                    </li>

                    <li className={location.pathname === "/users" ? "active" : ""}>
                        <p onClick={() => navigate("/users")}>
                            UŻYTKOWNICY
                        </p>
                    </li>

                    <li className={location.pathname.startsWith(`/users/${username}`) ? "active" : ""}>
                        <p onClick={() => navigate(`/users/${username}`)}>
                            <img
                                src={avatarUrl || "/unknown_avatar.jpg"}
                                alt={username}
                                className="avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/unknown_avatar.jpg";
                                }}
                                loading="lazy"
                            />
                            {username}
                        </p>
                    </li>

                    <li className="logout-nav" onClick={handleLogout}>
                        <p>
                            <CiLogout className="logout-icon"/>
                        </p>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;