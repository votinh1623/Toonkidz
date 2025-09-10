import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Import the configured API instance

const Dashboard = () => {
     const [imagePrompt, setImagePrompt] = useState('');
    const [ttsText, setTtsText] = useState('');
    const [generatedImages, setGeneratedImages] = useState([]); // Changed to array
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ttsLoading, setTtsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate();
    const [ttsStatus, setTtsStatus] = useState('checking');
    const [imageStatus, setImageStatus] = useState('checking');

    // Check if user is logged in
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Use the api instance - no need for manual token handling
                const response = await api.get('/auth/profile');
                setUser(response.data);
                setAuthLoading(false);
            } catch (error) {
                console.error('Error fetching profile:', error);
                setAuthLoading(false);
                navigate('/login');
            }
        };
        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        const checkServices = async () => {
            try {
                // Check TTS server
                const ttsResponse = await api.get('/tts-status');
                setTtsStatus(ttsResponse.data.status);
            } catch (error) {
                setTtsStatus('stopped');
            }
            // Image generation doesn't need a separate status check
            setImageStatus('ready');
        };
        checkServices();
    }, []);

    
    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) return;
        setLoading(true);
        try {
            const response = await api.post('/generate-image', { 
                prompt: imagePrompt,
                numImages: 4 // Generate 4 images
            });
            console.log('Generated image URLs:', response.data.imageUrls);
            setGeneratedImages(response.data.imageUrls);
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTTS = async () => {
        if (!ttsText.trim()) return;
        setTtsLoading(true);
        try {
            // Use the api instance - no need for manual token handling
            const response = await api.post('/generate-tts', { text: ttsText }, {
                responseType: 'blob'
            });
            // Create blob URL for audio
            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
        } catch (error) {
            console.error('Error generating TTS:', error);
            alert('Failed to generate speech');
        } finally {
            setTtsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Use the api instance - no need for manual token handling
            await api.post('/auth/logout');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
                    <p className="text-gray-700 mb-6">Please login to access the dashboard.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-purple-600">Toonkidz</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user.name}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Image Generation Section */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-2xl font-bold mb-4 text-purple-600">Generate Image</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Enter your image prompt
                                    </label>
                                    <textarea
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        rows="3"
                                        placeholder="A cute cat wearing a wizard hat..."
                                    />
                                </div>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={loading || !imagePrompt.trim()}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Image'}
                                </button>
                                
                                {/* Updated to display multiple images */}
                                {generatedImages.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-lg font-medium mb-2">Generated Images:</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {generatedImages.map((url, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={url}
                                                        alt={`Generated ${index}`}
                                                        className="w-full rounded-lg shadow-md"
                                                        onError={(e) => {
                                                            console.error(`Image ${index} failed to load:`, url);
                                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Failed+to+Load';
                                                        }}
                                                    />
                                                    <a 
                                                        href={url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded hover:bg-opacity-70"
                                                    >
                                                        View Full Size
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TTS Section */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-2xl font-bold mb-4 text-purple-600">Text-to-Speech</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Enter text to convert to speech
                                    </label>
                                    <textarea
                                        value={ttsText}
                                        onChange={(e) => setTtsText(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        rows="3"
                                        placeholder="Hello! Welcome to Toonkidz..."
                                    />
                                </div>
                                <button
                                    onClick={handleGenerateTTS}
                                    disabled={ttsLoading || !ttsText.trim()}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
                                >
                                    {ttsLoading ? 'Generating...' : 'Generate Speech'}
                                </button>
                                {audioUrl && (
                                    <div className="mt-4">
                                        <h3 className="text-lg font-medium mb-2">Generated Speech:</h3>
                                        <audio controls className="w-full">
                                            <source src={audioUrl} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;