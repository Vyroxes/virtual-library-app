import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdClose } from "react-icons/io";
import { FaCircle } from "react-icons/fa";
import { authAxios, getCookie } from '../utils/Auth';

import './Users.css';

const Users = () => {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    
    const currentUsername = getCookie("username");
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const navigate = useNavigate();

    const isDisabled = search.trim() === "";

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await authAxios.get(`${apiUrl}/api/users`);
            if (response.status === 200) {
                const filteredUsers = response.data.filter(user => user.username !== currentUsername);
                setUsers(filteredUsers);
                setLoading(false);
            }
        }
        catch (error) {
            console.error("Błąd podczas pobierania danych użytkowników: ", error);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    if(loading) {
        return;
    }

    return (
        <div className="users-container">
            <div className="users-search-bar">
                <input
                    type="text"
                    id="search"
                    name="search"
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
                    <a className='no-users-found '>Brak użytkowników</a>
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
                                <span className="user-item-name">{user.username}</span>
                                <span className={`status-dot-${user.is_active ? 'active' : 'inactive'}`}><FaCircle /></span>
                            </div>
                            <span className="user-item-email">{user.email}</span>
                        </div>
                        {user.username === adminUsername && (
                            <span className="user-item-role user-item-admin">Admin</span>
                        )}
                        {user.username !== adminUsername && (
                            <span className="user-item-role">Użytkownik</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Users;