// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create the api instance outside the component
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This function runs ONE TIME when the app first starts.
        const loadUserFromStorage = () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                
                // Manually set the auth header for the *very first* requests.
                api.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
            }
            
            // We are done loading.
            setIsLoading(false);
        };
        
        loadUserFromStorage();

        // This interceptor automatically adds the token to all future requests.
        const interceptor = api.interceptors.request.use(
            (config) => {
                const currentToken = localStorage.getItem('token');
                if (currentToken && !config.headers.Authorization) {
                    config.headers.Authorization = `Token ${currentToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(interceptor);
        };
    }, []); // Empty array ensures this runs only ONCE on mount.
    
    
    const login = async (username, password) => {
        try {
            // --- THIS IS THE FIX ---
            // The URL must be '/auth/login/' (with no '/1')
            const response = await api.post('/auth/login/', { username, password });
            const { token, user } = response.data;
            
            setToken(token);
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Set the token for all future requests
            api.defaults.headers.common['Authorization'] = `Token ${token}`;
            
            return true;
        } catch (error) {
            console.error("Login failed:", error.response?.data);
            return false;
        }
    };

    const register = async (username, password, email) => {
        try {
            // --- THIS IS THE FIX ---
            // The URL must be '/auth/register/' (with no '/1')
            await api.post('/auth/register/', { username, password, email });
            
            // If registration is successful, automatically log them in
            return await login(username, password);
        } catch (error) {
            console.error("Registration failed:", error.response?.data);
            return false;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Remove the auth header from future requests
        delete api.defaults.headers.common['Authorization'];
    };

    // This function updates the user info in our context
    const refreshUser = async () => {
        try {
            const response = await api.get('/auth/user/');
            setUser(response.data); // Update React state
            localStorage.setItem('user', JSON.stringify(response.data)); // Update localStorage
            return response.data;
        } catch (error) {
            console.error("Failed to refresh user", error);
            logout(); // If we can't refresh, log them out
        }
    };

    // Don't render the app until we've checked for a token.
    if (isLoading) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ token, user, login, register, logout, api, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};