import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { googleLogout } from '@react-oauth/google';
import './Chat.css';

const Chat = () => {
  const token = Cookies.get('jwtToken');
  const [preferences, setPreferences] = useState({
    serviceEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    filterCriteria: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [navigate, token]);

  const handleLogout = () => {
    googleLogout();
    Cookies.remove('jwtToken');
    navigate('/');
  };

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8081/api/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();

        setPreferences({
          serviceEnabled: data.data.service_enabled,
          telegramBotToken: data.data.telegram_bot_token,
          telegramChatId: data.data.telegram_chat_id,
          filterCriteria: data.data.filter_criteria
        });
      } else if (response.status === 404) {
        setPreferences({
          serviceEnabled: false,
          telegramBotToken: '',
          telegramChatId: '',
          filterCriteria: ''
        });
      }
    } catch (error) {
      showPopup(`Error: ${error.message}`, 'error');
      //showPopup('Failed to load preferences', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleService = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8081/api/preferences/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          service_enabled: !preferences.serviceEnabled 
        })
      });

      if (response.ok) {
        setPreferences(prev => ({
          ...prev,
          serviceEnabled: !prev.serviceEnabled
        }));
        showPopup(
          `Service ${!preferences.serviceEnabled ? 'enabled' : 'disabled'} successfully!`,
          'success'
        );
      } else {
        throw new Error('Failed to toggle service');
      }
    } catch (error) {
      showPopup('Failed to toggle service', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8081/api/preferences/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service_enabled: preferences.serviceEnabled,
          telegram_bot_token: preferences.telegramBotToken,
          telegram_chat_id: preferences.telegramChatId,
          filter_criteria: preferences.filterCriteria
        })
      });

      if (response.ok) {
        showPopup('Preferences saved successfully!', 'success');
        setIsEditing(false);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      showPopup('Failed to save preferences', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showPopup = (message, type) => {
    setPopup({ show: true, message, type });
    setTimeout(() => {
      setPopup({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleTestConnection = async () => {
    if (!preferences.telegramBotToken || !preferences.telegramChatId) {
      showPopup('Please fill in both Telegram Bot Token and Chat ID', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8081/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          telegram_bot_token: preferences.telegramBotToken,
          telegram_chat_id: preferences.telegramChatId
        })
      });

      if (response.ok) {
        showPopup('Telegram connection test successful!', 'success');
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      showPopup('Telegram connection test failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Popup */}
      {popup.show && (
        <div className={`popup ${popup.type}`}>
          <div className="popup-content">
            <span className="popup-message">{popup.message}</span>
            <button 
              className="popup-close"
              onClick={() => setPopup({ show: false, message: '', type: '' })}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="chat-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Email Intelligence Settings</h1>
            <p>Configure your AI-powered email filtering preferences</p>
          </div>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            disabled={isLoading}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="chat-content">
        {/* Service Toggle */}
        <div className="preference-section">
          <div className="section-header">
            <h2>Service Status</h2>
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.serviceEnabled}
                  onChange={handleToggleService}
                  disabled={isLoading}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className={`status-text ${preferences.serviceEnabled ? 'active' : 'inactive'}`}>
                {preferences.serviceEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <p className="section-description">
            Enable or disable the AI email filtering service. When active, emails are processed every 30 minutes.
          </p>
        </div>

        {/* Telegram Configuration */}
        <div className="preference-section">
          <div className="section-header">
            <h2>Telegram Configuration</h2>
            <button 
              className="test-btn"
              onClick={handleTestConnection}
              disabled={isLoading || !preferences.telegramBotToken || !preferences.telegramChatId}
            >
              Test Connection
            </button>
          </div>
          
          <div className="form-group">
            <label>Bot Token</label>
            <input
              type="password"
              placeholder="Enter your Telegram bot token"
              value={preferences.telegramBotToken}
              onChange={(e) => handleInputChange('telegramBotToken', e.target.value)}
              disabled={!isEditing && !isLoading}
            />
            <small>Get this from @BotFather on Telegram</small>
          </div>

          <div className="form-group">
            <label>Chat ID</label>
            <input
              type="text"
              placeholder="Enter your chat ID"
              value={preferences.telegramChatId}
              onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
              disabled={!isEditing && !isLoading}
            />
            <small>Send a message to @userinfobot to get your chat ID</small>
          </div>
        </div>

        {/* AI Filter Criteria */}
        <div className="preference-section">
          <div className="section-header">
            <h2>AI Filter Criteria</h2>
          </div>
          
          <div className="form-group">
            <label>Custom Filter Instructions</label>
            <textarea
              placeholder="Describe in natural language what emails are important to you. 
              
Examples:
- 'Send me emails from my manager or about urgent project deadlines'
- 'Only forward emails containing words like invoice, payment, or billing'
- 'Prioritize emails from clients and ignore newsletters or promotional content'"
              value={preferences.filterCriteria}
              onChange={(e) => handleInputChange('filterCriteria', e.target.value)}
              rows={6}
              disabled={!isEditing && !isLoading}
            />
            <small>The AI will use these instructions to determine email importance</small>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {!isEditing ? (
            <button 
              className="btn-primary"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              Edit Preferences
            </button>
          ) : (
            <>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  fetchUserPreferences();
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSavePreferences}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;