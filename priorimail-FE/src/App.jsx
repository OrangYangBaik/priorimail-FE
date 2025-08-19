import { useEffect, useState } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './App.css';

import Chat from './pages/Chat';

function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const login = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/gmail.modify openid email profile',
    onSuccess: async (codeResponse) => {
      try {
        const response = await axios.get(
          `http://localhost:8080/auth/google/callback?code=${codeResponse.code}`,
          { withCredentials: true }
        );

        const { jwt_token, expires_at, user } = response.data.data;

        Cookies.set('jwtToken', jwt_token, {
          expires: (24*7) / 24,
          secure: true,
          sameSite: 'Lax',
        });

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('expires_at', expires_at);

        setIsAuthenticated(true);
        navigate('/chat');
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  });

  useEffect(() => {
    const token = Cookies.get('googleAccessToken');
    if (token) {
      setIsAuthenticated(true);
      navigate('/chat');
    }
  }, [navigate]);

  return (
    <div className="container">
      <div className="left-panel">
        <div className="login-box">
          <h1>Welcome</h1>
          <p>Sign in to access Priorimail</p>
          {!isAuthenticated ? (
            <button className="google-btn" onClick={() => login()}>
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
              />
              Sign in with Google
            </button>
          ) : (
            <button className="logout-btn" onClick={() => {
              googleLogout();
              Cookies.remove('googleAccessToken');
              setIsAuthenticated(false);
            }}>
              Logout
            </button>
          )}
        </div>
      </div>
      <div className="right-panel">
        <div className="overlay-graphic"></div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
