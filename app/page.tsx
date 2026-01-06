'use client';

import { useState, useEffect } from 'react';
import { signUp, signIn, signOut, getCurrentUserProfile, isSessionValid, User } from '@/lib/supabase';
import { useInactivityTimeout } from '@/lib/useInactivityTimeout';

export default function Home() {
  const [isPressed, setIsPressed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const isValid = await isSessionValid();
        if (!isValid) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setShowDifficulty(false);
          return;
        }
        
        const profile = await getCurrentUserProfile();
        if (profile) {
          setCurrentUser(profile);
          setIsAuthenticated(true);
        }
      } catch {
        // User not logged in
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };
    checkUser();
    
    // Check session validity every 2 minutes
    const interval = setInterval(checkUser, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-logout after 5 minutes of inactivity
  useInactivityTimeout(() => {
    if (isAuthenticated) {
      handleSignOut();
    }
  }, 5); // 5 minutes timeout

  const handlePlay = () => {
    if (isAuthenticated) {
      // If already logged in, go straight to difficulty
      setShowDifficulty(true);
    } else {
      // Otherwise show login modal
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await signIn(email, password);
        const profile = await getCurrentUserProfile();
        setCurrentUser(profile);
        setIsAuthenticated(true);
        setShowModal(false);
        setShowDifficulty(true);
        // Clear form
        setEmail('');
        setPassword('');
      } else {
        // Sign up
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await signUp({ email, password, username });
        const profile = await getCurrentUserProfile();
        setCurrentUser(profile);
        setIsAuthenticated(true);
        setShowModal(false);
        setShowDifficulty(true);
        // Clear form
        setEmail('');
        setPassword('');
        setUsername('');
        setConfirmPassword('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setShowDifficulty(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleGuestSignIn = () => {
    setIsAuthenticated(true);
    setShowModal(false);
    setShowDifficulty(true);
    setCurrentUser(null); // Guest has no profile
  };

  const handleBackHome = () => {
    setShowDifficulty(false);
  };

  // Show difficulty selection screen
  if (showDifficulty) {
    return <DifficultySelection username={currentUser?.username} onBackHome={handleBackHome} onSignOut={handleSignOut} />;
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center overflow-x-hidden">
      <div className="flex flex-col items-center justify-center space-y-16 w-full px-4">
        {/* Title */}
        <div className="flex flex-col items-center justify-center space-y-2 w-full">
          <h1 
            className="text-6xl sm:text-7xl md:text-8xl font-black font-mono text-[#e94560] tracking-wider text-center"
            style={{
              textShadow: '0 0 40px rgba(233, 69, 96, 0.6), 0 0 20px rgba(233, 69, 96, 0.4)',
            }}
          >
            PIXEL
          </h1>
          <h1 
            className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-wider bg-gradient-to-r from-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent text-center"
          >
            ART
          </h1>
        </div>

        {/* Decorative Pixel Grid */}
        <div className="flex flex-col items-center justify-center gap-1 w-full">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-1 justify-center">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
                const colors = ['#e94560', '#ff6b6b', '#0f3460', '#533483'];
                const color = colors[(row + col) % colors.length];
                const pattern = (row + col) % 3;
                const opacity = pattern === 0 ? 1 : pattern === 1 ? 0.7 : 0.4;
                
                return (
                  <div
                    key={col}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      opacity: opacity,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Play Button */}
        <div className="flex justify-center w-full">
          <button
            onClick={handlePlay}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            className="px-12 sm:px-16 py-4 sm:py-5 bg-gradient-to-b from-[#e94560] to-[#c73659] rounded-2xl shadow-2xl transition-transform duration-200 active:scale-95 cursor-pointer"
            style={{
              transform: isPressed ? 'scale(0.95)' : 'scale(1)',
              boxShadow: '0 8px 30px rgba(233, 69, 96, 0.5)',
            }}
          >
            <div className="flex items-center justify-center gap-3 text-white">
              <svg 
                className="w-5 h-5 sm:w-6 sm:h-6 fill-current" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-wider">
                PLAY
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Login/Signup Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#e94560] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="p-8">
              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                    isLogin 
                      ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white' 
                      : 'bg-[#0f3460] text-gray-400 hover:text-white'
                  }`}
                >
                  LOGIN
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white' 
                      : 'bg-[#0f3460] text-gray-400 hover:text-white'
                  }`}
                >
                  SIGN UP
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f3460] border border-[#533483] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] transition-colors"
                      placeholder="Choose a username"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0f3460] border border-[#533483] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0f3460] border border-[#533483] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f3460] border border-[#533483] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm font-mono">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-lg font-bold font-mono text-white hover:shadow-lg hover:shadow-[#e94560]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'LOADING...' : (isLogin ? 'LOGIN' : 'CREATE ACCOUNT')}
                </button>
              </form>

              {/* Guest Sign In */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-gray-400 font-mono">
                    OR
                  </span>
                </div>
              </div>

              <button
                onClick={handleGuestSignIn}
                className="w-full py-3 bg-[#0f3460] border border-[#533483] rounded-lg font-bold font-mono text-white hover:border-[#e94560] hover:shadow-lg transition-all cursor-pointer"
              >
                CONTINUE AS GUEST
              </button>

              {/* Footer Text */}
              <p className="text-center text-sm text-gray-400 mt-4 font-mono">
                {isLogin ? "New to Pixel Art?" : "Already have an account?"}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#e94560] hover:text-[#ff6b6b] font-bold cursor-pointer"
                >
                  {isLogin ? 'Sign up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Difficulty Selection Component
function DifficultySelection({ username, onBackHome, onSignOut }: { username?: string | null, onBackHome: () => void, onSignOut: () => void }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const difficulties = [
    { 
      name: 'EASY', 
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:shadow-green-500/50',
      description: 'Perfect for beginners'
    },
    { 
      name: 'MEDIUM', 
      color: 'from-yellow-500 to-orange-500',
      hoverColor: 'hover:shadow-yellow-500/50',
      description: 'A fun challenge'
    },
    { 
      name: 'HARD', 
      color: 'from-red-500 to-red-700',
      hoverColor: 'hover:shadow-red-500/50',
      description: 'For experts only'
    },
  ];

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    console.log(`Selected difficulty: ${difficulty}`);
    // Game will start here
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center overflow-x-hidden p-4 relative">
      {/* User Profile Indicator */}
      {username && (
        <div className="absolute top-6 right-6 flex items-center gap-3 bg-[#0f3460] border-2 border-[#e94560] rounded-xl px-5 py-3 shadow-lg">
          <span className="text-white font-mono font-bold text-sm">
            Hi, {username}
          </span>
          <button
            onClick={onSignOut}
            className="bg-[#e94560] hover:bg-[#ff6b6b] text-white font-mono text-xs px-3 py-2 rounded-lg transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-2xl">
        {/* Title */}
        <div className="flex flex-col items-center justify-center space-y-2 w-full">
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl font-black font-mono text-[#e94560] tracking-wider text-center"
            style={{
              textShadow: '0 0 40px rgba(233, 69, 96, 0.6), 0 0 20px rgba(233, 69, 96, 0.4)',
            }}
          >
            PIXEL ART
          </h1>
          <p className="text-gray-400 font-mono text-lg text-center mt-4">
            Choose Your Difficulty
          </p>
        </div>

        {/* Difficulty Buttons */}
        <div className="flex flex-col gap-6 w-full max-w-md">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.name}
              onClick={() => handleDifficultySelect(difficulty.name)}
              className={`group relative py-6 px-8 bg-gradient-to-r ${difficulty.color} rounded-2xl shadow-2xl transition-all duration-200 cursor-pointer hover:scale-105 ${difficulty.hoverColor}`}
              style={{
                boxShadow: selectedDifficulty === difficulty.name 
                  ? '0 12px 40px rgba(233, 69, 96, 0.6)' 
                  : '0 8px 30px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="flex flex-col items-center text-white">
                <span className="text-3xl font-black font-mono tracking-wider">
                  {difficulty.name}
                </span>
                <span className="text-sm font-mono opacity-90 mt-1">
                  {difficulty.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Back to Home */}
        <button
          onClick={onBackHome}
          className="text-gray-400 hover:text-white font-mono text-sm cursor-pointer transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
