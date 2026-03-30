import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdClose } from "react-icons/io";
import { FaCircle } from "react-icons/fa";
import { authAxios, getUsername } from '../utils/Auth';

import './Users.css';

const Users = () => {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);

    const currentUsername = getUsername();
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const apiUrl = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();

    const isDisabled = search.trim() === "";

    useEffect(() => {
        let isMounted = true;

        const fetchUsers = async () => {
            try {
                const response = await authAxios.get(`${apiUrl}/api/users`);

                if (response.status === 200 && isMounted) {
                    const filteredUsers = response.data.filter(
                        user => user.username !== currentUsername
                    );

                    setUsers(filteredUsers);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Błąd podczas pobierania danych użytkowników:", error);
                if (isMounted) setLoading(false);
            }
        };

        fetchUsers();

        return () => {
            isMounted = false;
        };
    }, [apiUrl, currentUsername]);

    const filteredUsers = users.filter((user) => {
        const username = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const searchLower = search.toLowerCase();

        return username.includes(searchLower) || email.includes(searchLower);
    });

    if (loading) return <p>Ładowanie...</p>;

    return (
        <div className="users-container">

            <div className="users-search-bar">
                <input
                    type="text"
                    placeholder="Nazwa użytkownika lub email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button
                    className="users-clear-search"
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSearch("")}
                >
                    <IoMdClose />
                </button>
            </div>

            <ul className="users-list">
                {filteredUsers.length === 0 && (
                    <li className="no-users-found">Brak użytkowników</li>
                )}

                {filteredUsers.map((user, index) => (
                    <li
                        key={user.username}
                        className="user-item"
                        style={{ '--index': index }}
                        onClick={() => navigate(`/users/${user.username}`)}
                    >
                        <img
                            src={user.avatar_url || "/unknown_avatar.jpg"}
                            alt={user.username}
                            className="users-avatar"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/unknown_avatar.jpg";
                            }}
                            loading="lazy"
                        />

                        <div className="user-item-info">
                            <div className="user-item-info-header">
                                <span className="user-item-name">
                                    {user.username}
                                </span>

                                <span className={`status-dot-${user.is_active ? 'active' : 'inactive'}`}>
                                    <FaCircle />
                                </span>
                            </div>

                            <span className="user-item-email">
                                {user.email}
                            </span>
                        </div>

                        {user.username === adminUsername ? (
                            <span className="user-item-role user-item-admin">
                                Admin
                            </span>
                        ) : (
                            <span className="user-item-role">
                                Użytkownik
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Users;