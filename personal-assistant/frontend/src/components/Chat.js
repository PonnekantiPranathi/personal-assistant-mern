import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import AllToDoLists from './AllToDoLists';
import AllReminders from './AllReminders';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // Add state for current view

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      ws.onmessage = (event) => {
        console.log('Received message from WebSocket:', event.data);
        const reminder = JSON.parse(event.data);
         // Ensure reminder is only spoken once
        if (!messages.some(msg => msg.text === `Reminder: ${reminder.message}`)) {
          setMessages(prevMessages => [...prevMessages, { text: `Reminder: ${reminder.message}`, sender: 'system' }]);
          speakText(`Reminder: ${reminder.message}`);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
    };

    connectWebSocket();
  }, [messages]);

  const handleSend = async (text, voiceInput = false) => {
    if (text.trim()) {
      const userMessage = { text, sender: 'user' };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      try {
        const response = await axios.post('http://localhost:5000/dialogflow', {
          languageCode: 'en',
          queryText: text,
          sessionId: 'abcd1234',
        });

        const botMessage = { text: response.data.response, sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);

        if (voiceInput) {
          speakText(response.data.response);
        }
        if (response.data.response.toLowerCase().includes('sure. displaying all tasks')) {
          setCurrentView('todo');
        }
        else if (response.data.response.toLowerCase().includes('sure. displaying all reminders')){
          setCurrentView('reminders');
        }
        else if (response.data.response.toLowerCase().includes('sure. redirecting to the chat page')) {
          setCurrentView('chat');
        }
        
      } catch (error) {
        console.error('Error communicating with backend:', error.response ? error.response.data : error.message);
      }

      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend(input);
      setIsVoiceInput(false);
    }
  };

  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      if (speechToText.toLowerCase() === "hey buddy") {
        activateAssistant();
      } else {
        handleSend(speechToText, true);
      }
    };

    recognition.start();
    setIsVoiceInput(true);
  };

  const activateAssistant = async () => {
    try {
      const { latitude, longitude } = await getLocation();
      // const latitude = '25.9644';
      // const longitude ='85.2722';
      console.log('Coordinates:', latitude, longitude); // Debugging line to check coordinates
  
      const locationName = await getLocationName(latitude, longitude);
      console.log('Location Name:', locationName); // Debugging line to check location name
  
      const weather = await getWeather(latitude, longitude);
  
      const now = new Date();
      const hours = now.getHours();
      const greetings = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : hours < 22 ? 'Good evening' : 'Good night';
  
      const text = `Hey Praisy, ${greetings}. Now the time is ${now.toLocaleTimeString()}. Your location is ${locationName}. The weather is ${weather}.`;
      speakText(text);
      setMessages(prevMessages => [...prevMessages, { text, sender: 'system' }]);
    } catch (error) {
      console.error('Error in activateAssistant:', error);
    }
  };
  
  
  
  
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ latitude, longitude });
          },
          (error) => {
            console.error('Error getting location:', error);
            reject('Unable to retrieve location');
          },
          { timeout: 10000 }
        );
      } else {
        reject('Geolocation not supported');
      }
    });
  };
  

  const getLocationName = async (latitude, longitude) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
  
    try {
      const response = await axios.get(url);
      const address = response.data.address;
      if (address) {
        const city = address.city || address.town || address.village || 'Unknown city';
        const country = address.country || 'Unknown country';
        return `${city}, ${country}`;
      } else {
        return 'Location not found';
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unable to fetch location';
    }
  };
  
  
  


  const getWeather = async (latitude, longitude) => {
    const apiKey = '84bb32512ed7b71312d35f414701d390'; // Replace with your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
  
    try {
      const response = await axios.get(url);
      const weatherData = response.data;
      if (weatherData) {
        return `${weatherData.weather[0].description} with a temperature of ${weatherData.main.temp}°C`;
      } else {
        return 'Unable to fetch weather data';
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return 'Unable to fetch weather data';
    }
  };
  
  
  

  const speakText = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  const handleBack = () => {
    setCurrentView('chat');
  };

  return (
    <div className="chat-container">
    {currentView === 'chat' ? (
      <>
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={() => handleSend(input)} className="send-button">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          <button onClick={startListening} className="mic-button">
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
        </div>
      </>
    ) : currentView === 'todo' ? (
      <AllToDoLists onBack={handleBack} startListening={startListening}/> // Display the AllToDoLists component when currentView is 'todo'
    ) : (
      <AllReminders onBack={handleBack} startListening={startListening}/> // Display the AllReminders component when currentView is 'reminders'
    )}
  </div>
);
};

export default Chat;