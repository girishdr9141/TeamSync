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
    
    // --- THIS IS THE FIX ---
    // We add a loading state. The app is "loading" until we've
    // checked localStorage and set up our interceptor.
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This function runs ONE TIME when the app first starts.
        const loadUserFromStorage = () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                
                // --- CRITICAL ---
                // Manually set the auth header for the *very first* requests.
                // This beats the race condition.
                api.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
            }
            
            // We are done loading.
            setIsLoading(false);
        };
        
        loadUserFromStorage();

        // --- Interceptor (Same as before, but with a small change) ---
        const interceptor = api.interceptors.request.use(
            (config) => {
                // Read from localStorage just in case state is slow
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
            await api.post('/auth/register/', { username, password, email });
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

    // --- NEW FUNCTION TO UPDATE USER IN CONTEXT ---
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

    // --- RENDER LOGIC ---
    // If we are still loading the user from storage,
    // render nothing. This prevents all child components (like SettingsPage)
    // from rendering and firing off API calls too early.
    if (isLoading) {
        return null;
    }

    // Now we are sure the token (or lack of one) is loaded.
    // We can safely render the rest of the app.
    return (
        <AuthContext.Provider value={{ token, user, login, register, logout, api, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};