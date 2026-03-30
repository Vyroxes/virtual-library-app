import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authAxios, clearTokens, getCookie, getTokenExpireDate } from '../utils/Auth';

import './User.css';

const User = () => {
    const [accessTokenExpiration, setAccessTokenExpiration] = useState(null);
    const [timeToAccessTokenExpire, setTimeToAccessTokenExpire] = useState(null);
    const [refreshTokenExpiration, setRefreshTokenExpiration] = useState(null);
    const [timeToRefreshTokenExpire, setTimeToRefreshTokenExpire] = useState(null);
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

    const { username } = useParams();

    const navigate = useNavigate();
    const currentUsername = getCookie('username');

    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const interval = setInterval(() => {
            const expireDate = getTokenExpireDate("access_token");
            if (expireDate) {
                const currentTime = new Date().getTime();
                const timeLeft = expireDate.getTime() - currentTime;
    
                if (timeLeft > 0) {
                    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                    setTimeToAccessTokenExpire(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                } else {
                    setTimeToAccessTokenExpire("Access token wygasł.");
                    clearInterval(interval);
                }
            } else {
                setTimeToAccessTokenExpire("Brak danych.");
                clearInterval(interval);
            }
        }, 1000);
    
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const expireDate = getTokenExpireDate("refresh_token");
            if (expireDate) {
                const currentTime = new Date().getTime();
                const timeLeft = expireDate.getTime() - currentTime;
    
                if (timeLeft > 0) {
                    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                    setTimeToRefreshTokenExpire(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                } else {
                    setTimeToRefreshTokenExpire("Refresh token wygasł.");
                    clearInterval(interval);
                }
            } else {
                setTimeToRefreshTokenExpire("Brak danych.");
                clearInterval(interval);
            }
        }, 1000);
    
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const accessToken = getCookie("access_token");
            if (accessToken) {
                fetchUserData();
                setAccessTokenExpiration(
                    getTokenExpireDate("access_token") 
                        ? getTokenExpireDate("access_token").toLocaleString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) 
                        : "Brak danych"
                );
                setRefreshTokenExpiration(
                    getTokenExpireDate("refresh_token") 
                        ? getTokenExpireDate("refresh_token").toLocaleString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })  
                        : "Brak danych"
                );
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [username]);

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
                    wishListCount: response.data.wish_list.length,
                    totalPages: response.data.book_collection.reduce((total, book) => total + (book.pages || 0), 0)
                });
                setLoading(false);
            } else if (response.status === 404) {
                console.error("Użytkownik nie znaleziony.");
                navigate('/home');
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.error("Użytkownik nie znaleziony.");
                navigate('/home');
            } else {
                console.error("Błąd podczas pobierania danych użytkownika: ", error);
            }
        }
    };

    const deleteAccount = async () => {
        const confirmDelete = window.confirm("Czy na pewno chcesz usunąć konto?");
        
        if (!confirmDelete) {
            return;
        }
        try {
            const response = await authAxios.delete(`${apiUrl}/api/delete-account/${username}`);
            if (response.status === 200) {
                if (currentUsername === username) {
                    console.log("Usunięto konto pomyślnie.");
                    clearTokens();
                    navigate('/login');
                } else {
                    console.log("Usunięto konto pomyślnie.");
                    navigate('/users');
                }
            }
        } catch (error) {
            console.error("Błąd podczas usuwania konta: ", error);
        }
    };

    const deletePremium = async () => {
        const confirmCancel = window.confirm("Czy na pewno chcesz usunąć subskrypcję?");
        
        if (!confirmCancel) {
            return;
        }
        
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
                console.log("Subskrypcja anulowana pomyślnie.");
                fetchUserData();
            }
        } catch (error) {
            console.error("Wystąpił błąd podczas anulowania subskrypcji: ", error);
        }
    };

    const enablePremium = async (plan) => {
        const confirmUpgrade = window.confirm("Czy na pewno chcesz aktywować subskrypcję?");
        
        if (!confirmUpgrade) {
            return;
        }
        
        try {           
            const response = await authAxios.post(`${apiUrl}/api/payments/set/${username}`, {
                status: 'ACTIVE',
                plan: plan
            }, {
                withCredentials: true,
            });
            
            if (response.status === 200) {
                console.log("Subskrypcja aktywowana pomyślnie.");
                fetchUserData();
            }
        } catch (error) {
            console.error("Wystąpił błąd podczas aktywacji subskrypcji: ", error);
        }
    };

    if(loading) {
        return;
    }

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
                    loading="lazy"
                    />
                <h1>{username}</h1>
                <p>{email}</p>
            </div>
            <div className="user-stats">
                {(username === currentUsername || currentUsername === adminUsername) && (
                    <>
                        <h2>Informacje użytkownika</h2>
                        <li>Pakiet:
                            <p>{premium ? `${premium} do ${premiumExpiration.toLocaleString('pl-PL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}` : "brak"}
                            </p>
                        </li>
                        <li>Połączony z Github:
                            <p>{githubId ? `tak (id: ${githubId})` : "nie"}</p>
                        </li>
                        <li>Połączony z Discord:
                            <p>{discordId ? `tak (id: ${discordId})` : "nie"}</p>
                        </li>
                        <li>Data utworzenia konta:
                            <p>{accountCreated.toLocaleString('pl-PL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </li>
                    </>
                )}

                <h2>Statystyki</h2>
                <li>Książki w kolekcji:
                    <p>{bookStats.collectionCount ? bookStats.collectionCount : "brak"}</p>
                </li>
                <li>Książki na liście życzeń:
                    <p>{bookStats.wishlistCount ? bookStats.wishlistCount : "brak"}</p>
                </li>
                <li>Łączna liczba stron:
                    <p>{bookStats.totalPages ? bookStats.totalPages : 0}</p>
                </li>

                {(username === currentUsername && currentUsername === adminUsername) && (
                    <>
                        <h2>Informacje administratora</h2>
                        <li>Access token:</li>
                        <textarea readOnly value={getCookie("access_token") || "brak"}></textarea>
                        <li>Wygaśnięcie access tokenu:
                            <p>{accessTokenExpiration || "brak"}</p>
                        </li>
                        <li>Czas do wygaśnięcia access tokenu:
                            <p>{timeToAccessTokenExpire || "brak"}</p>
                        </li>
                        <li>Refresh token:</li>
                        <textarea readOnly value={getCookie("refresh_token") || "brak"}></textarea>
                        <li>Wygaśnięcie refresh tokenu:
                            <p>{refreshTokenExpiration || "brak"}</p>
                        </li>
                        <li>Czas do wygaśnięcia refresh tokenu:
                            <p>{timeToRefreshTokenExpire || "brak"}</p>
                        </li>
                    </>
                )}
            </div>
            <div className="user-actions">
                {username !== currentUsername && (<button onClick={() => navigate('/users')}>Powrót</button>)}
                {(username === currentUsername || currentUsername === adminUsername) && (<button className='delete-account-button' onClick={() => deleteAccount()}>Usuń konto</button>)}
                {(premium) && (currentUsername === adminUsername) && (<button className='delete-account-button' onClick={() => deletePremium()}>Usuń pakiet</button>)}
                {(!premium) && (currentUsername === adminUsername) && (<button onClick={() => enablePremium("PREMIUM")}>Ustaw pakiet PREMIUM</button>)}
                {(!premium) && (currentUsername === adminUsername) && (<button onClick={() => enablePremium("PREMIUM+")}>Ustaw pakiet PREMIUM+</button>)}
            </div>
        </div>
    );
};

export default User;