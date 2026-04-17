import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const USERNAME_KEY = 'username';
const apiUrl = import.meta.env.VITE_API_URL;

let accessToken = null;

export const getCsrfToken = () => {
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? match[1] : null;
};

export const setAuthData = (username, token) => {
    accessToken = token;
    sessionStorage.setItem(USERNAME_KEY, username);
};

export const getUsername = () => {
    return sessionStorage.getItem(USERNAME_KEY);
};

export const getAccessToken = () => accessToken;

export const clearAuth = () => {
    accessToken = null;
    sessionStorage.removeItem(USERNAME_KEY);
};

export const isAuthenticated = async (allowRefresh = true) => {
    if (accessToken) {
        return true;
    }

    if (!allowRefresh) {
        return false;
    }

    try {
        await refreshAccessToken();
        return true;
    } catch {
        clearAuth();
        return false;
    }
};

export const refreshAccessToken = async () => {
    const response = await axios.post(
        `${apiUrl}/api/refresh`,
        {},
        { 
            withCredentials: true,
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        }
    );

    accessToken = response.data.access_token;
    sessionStorage.setItem(USERNAME_KEY, response.data.username);

    return accessToken;
};

export const getTokenExpireDate = (token) => {
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return new Date(decoded.exp * 1000);
    } catch {
        return null;
    }
};

export const isAccessTokenExpiringSoon = () => {
    const expireDate = getTokenExpireDate(accessToken);
    if (!expireDate) return false;

    return expireDate.getTime() - Date.now() < 10 * 1000;
};

export const logout = async () => {
    await axios.post(
        `${apiUrl}/api/logout`,
        {},
        { 
            withCredentials: true,
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`,
                'X-CSRFToken': getCsrfToken()
            }
        }
    );

    clearAuth();
};

export const authAxios = axios.create({
    withCredentials: true
});

let refreshPromise = null;

const ensureFreshToken = async () => {
    const token = getAccessToken();

    if (!token || isAccessTokenExpiringSoon()) {
        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
            });
        }
        return refreshPromise;
    }

    return token;
};

authAxios.interceptors.request.use(async (config) => {
    const url = config.url || "";

    const isAuthEndpoint =
        url.includes('/api/login') ||
        url.includes('/api/register') ||
        url.includes('/api/refresh');

    if (!isAuthEndpoint) {
        try {
            await ensureFreshToken();
        } catch (error) {
            console.error("Wystąpił błąd podczas sprawdzania access tokenu: ", error)
        }
    }

    const token = getAccessToken();
    const csrfToken = getCsrfToken();

    return {
        ...config,
        headers: {
            ...config.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {})
        }
    };
});

let isRefreshing = false;
let queue = [];

authAxios.interceptors.response.use(
    res => res,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    queue.push((token) => {
                        if (!token) {
                            reject(error);
                            return;
                        }

                        resolve(authAxios({
                            ...original,
                            headers: {
                                ...original.headers,
                                Authorization: `Bearer ${token}`
                            }
                        }));
                    });
                });
            }

            isRefreshing = true;

            try {
                const newToken = await refreshAccessToken();

                queue.forEach(cb => cb(newToken));
                queue = [];

                return authAxios({
                    ...original,
                    headers: {
                        ...original.headers,
                        Authorization: `Bearer ${newToken}`
                    }
                });
            } catch (err) {
                queue.forEach(cb => cb(null));
                queue = [];

                clearAuth();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);