import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAxios, clearAuth, getUsername, getTokenExpireDate, getAccessToken } from '../utils/Auth';

import './User.css';

const User = () => {
    const [loading, setLoading] = useState(true);

    const [email, setEmail] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [githubId, setGithubId] = useState(null);
    const [discordId, setDiscordId] = useState(null);

    const [premium, setPremium] = useState(false);
    const [premiumExpiration, setPremiumExpiration] = useState(null);

    const [accountCreated, setAccountCreated] = useState(null);

    const [bookStats, setBookStats] = useState({
        collectionCount: 0,
        wishlistCount: 0,
        totalPages: 0,
    });

    const [accessTokenExpiration, setAccessTokenExpiration] = useState(null);

    const [timeToAccessTokenExpire, setTimeToAccessTokenExpire] = useState(null);

    const { username } = useParams();
    const navigate = useNavigate();

    const currentUsername = getUsername();
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchUserData = async () => {
        try {
            const response = await authAxios.get(`${apiUrl}/api/user/${username}`, {
                withCredentials: true,
            });

            if (response.status === 200) {
                if (response.data.username && response.data.username !== username) {
                    navigate(`/users/${response.data.username}`, { replace: true });
                    return;
                }

                setEmail(response.data.email);
                setAvatarUrl(response.data.avatar_url);
                setGithubId(response.data.github_id);
                setDiscordId(response.data.discord_id);
                setPremium(response.data.premium);
                setPremiumExpiration(new Date(response.data.premium_expiration));
                setAccountCreated(new Date(response.data.account_created));

                setBookStats({
                    collectionCount: response.data.book_collection.length,
                    wishlistCount: response.data.wish_list.length,
                    totalPages: response.data.book_collection.reduce(
                        (total, book) => total + (book.pages || 0),
                        0
                    )
                });

                setLoading(false);
            }
        } catch (error) {
            console.error("Błąd podczas pobierania danych użytkownika:", error);

            if (error.response?.status === 404) {
                navigate('/home');
            }
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [username]);

    useEffect(() => {
        const interval = setInterval(() => {
            const accessToken = getAccessToken();
            const accessExp = getTokenExpireDate(accessToken);

            if (accessExp) {
                setAccessTokenExpiration(accessExp.toLocaleString('pl-PL'));
                const timeLeft = accessExp.getTime() - Date.now();

                setTimeToAccessTokenExpire(formatTime(timeLeft));
            } else {
                setAccessTokenExpiration("brak");
                setTimeToAccessTokenExpire("brak");
            }

        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (ms) => {
        if (ms <= 0) return "wygasł";

        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds}`;
    };

    const deleteAccount = async () => {
        if (!window.confirm("Czy na pewno chcesz usunąć konto?")) return;

        try {
            const response = await authAxios.delete(`${apiUrl}/api/delete-account/${username}`);

            if (response.status === 200) {
                if (currentUsername === username) {
                    clearAuth();
                    navigate('/login');
                } else {
                    navigate('/users');
                }
            }
        } catch (error) {
            console.error("Błąd podczas usuwania konta:", error);
        }
    };

    const deletePremium = async () => {
        if (!window.confirm("Czy na pewno chcesz usunąć subskrypcję?")) return;

        try {
            const statusResponse = await authAxios.get(`${apiUrl}/api/payments/status/${username}`);
            const currentSub = statusResponse.data.subscription;

            const response = await authAxios.post(`${apiUrl}/api/payments/set/${username}`, {
                status: 'CANCELLED',
                plan: currentSub?.plan
            }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                fetchUserData();
            }
        } catch (error) {
            console.error("Błąd podczas anulowania subskrypcji:", error);
        }
    };

    const enablePremium = async (plan) => {
        if (!window.confirm("Czy na pewno chcesz aktywować subskrypcję?")) return;

        try {
            const response = await authAxios.post(`${apiUrl}/api/payments/set/${username}`, {
                status: 'ACTIVE',
                plan
            }, {
                withCredentials: true,
            });

            if (response.status === 200) {
                fetchUserData();
            }
        } catch (error) {
            console.error("Błąd podczas aktywacji subskrypcji:", error);
        }
    };

    if (loading) return <p>Ładowanie...</p>;

    return (
        <div className="user-container">
            <h1>Profil użytkownika</h1>

            <div className="user-header">
                <img
                    src={avatarUrl || "/unknown_avatar.jpg"}
                    alt={username}
                    className="user-avatar"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/unknown_avatar.jpg";
                    }}
                />
                <h1>{username}</h1>
                <p>{email}</p>
            </div>

            <div className="user-stats">
                <h2>Statystyki</h2>

                <p>Książki w kolekcji: {bookStats.collectionCount}</p>
                <p>Książki na liście życzeń: {bookStats.wishlistCount}</p>
                <p>Łączna liczba stron: {bookStats.totalPages}</p>

                {(username === currentUsername || currentUsername === adminUsername) && (
                    <>
                        <h2>Informacje</h2>
                        <p>Premium: {premium ? `aktywne do ${premiumExpiration?.toLocaleString('pl-PL')}` : "brak"}</p>
                        <p>Github: {githubId || "brak"}</p>
                        <p>Discord: {discordId || "brak"}</p>
                        <p>Konto utworzone: {accountCreated?.toLocaleString('pl-PL')}</p>
                    </>
                )}

                {(currentUsername === adminUsername && username === currentUsername) && (
                    <>
                        <h2>Admin</h2>
                        <p>Access token:</p>
                        <textarea readOnly value={getAccessToken() || "brak"} />

                        <p>Data wygaśnięcia: {accessTokenExpiration}</p>
                        <p>Czas do wygaśnięcia: {timeToAccessTokenExpire}</p>
                    </>
                )}
            </div>

            <div className="user-actions">
                {username !== currentUsername && (
                    <button onClick={() => navigate('/users')}>Powrót</button>
                )}

                {(username === currentUsername || currentUsername === adminUsername) && (
                    <button onClick={deleteAccount}>Usuń konto</button>
                )}

                {currentUsername === adminUsername && (
                    <>
                        {premium && <button onClick={deletePremium}>Usuń pakiet</button>}
                        {!premium && <button onClick={() => enablePremium("PREMIUM")}>Ustaw pakiet PREMIUM</button>}
                        {!premium && <button onClick={() => enablePremium("PREMIUM+")}>Ustaw pakiet PREMIUM+</button>}
                    </>
                )}
            </div>
        </div>
    );
};

export default User;