import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Import the configured API instance

const Home = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // No need to manually set Authorization header - cookies are sent automatically
                const response = await api.get('/auth/profile');
                setUser(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching profile:', error);
                
                if (error.response?.status === 401) {
                    setError('Your session has expired. Please login again.');
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError('Failed to fetch user profile. Please try again.');
                }
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const goToDashboard = () => {
        navigate('/dashboard');
    };

    const handleLogout = async () => {
        try {
            // No need to manually set Authorization header
            await api.post('/api/auth/logout');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Session Error</h2>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <p className="text-gray-600">Redirecting to login page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Logo/Title */}
                <div className="mb-8">
                    <h1 className="text-5xl font-bold text-purple-600 mb-2">Toonkidz</h1>
                    <p className="text-gray-600">Smart Comic Drawing App for Kids</p>
                </div>
                
                {/* Welcome Message */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex justify-center mb-6">
                        <img
                            src={user?.pfp || "https://res.cloudinary.com/dxk9czcoa/image/upload/v1741937844/pfp/wpvq1k5tohnnmkqjyln4.jpg"}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Welcome back, {user?.name}!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Ready to create amazing stories and drawings?
                    </p>
                    
                    {/* Dashboard Button */}
                    <button
                        onClick={goToDashboard}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-full text-lg shadow-lg transform transition hover:scale-105 duration-300"
                    >
                        Go to Dashboard
                    </button>
                </div>
                
                {/* Quick Stats */}
                {user && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Stats</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-purple-600">
                                    {user.storiesCreated || 0}
                                </div>
                                <div className="text-sm text-gray-600">Stories Created</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-600">
                                    {user.favoriteGenres?.length || 0}
                                </div>
                                <div className="text-sm text-gray-600">Favorite Genres</div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="mt-6 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Home;