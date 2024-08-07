import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import { FaComment } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';

const AllReminders = ({ onBack, startListening }) => {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/reminders'); // Replace with your API endpoint
        setReminders(response.data);
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }
    };

    fetchReminders();
  }, []);

 

  return (
    <div className="reminder-container">
      <h2>All Reminders</h2>
      <div className="reminders-list">
        {reminders.length === 0 ? (
          <p>No reminders available.</p>
        ) : (
          reminders.map((reminder, index) => (
            <div key={index} className="reminder-item">
              {reminder.message} at {reminder.time} {/* Adjust based on your data structure */}
            </div>
          ))
        )}
      </div>
      <div className="mic-icon-in-others" onClick={startListening}>
          <FontAwesomeIcon icon={faMicrophone} />
      </div>
      <div className="chat-icon" onClick={onBack}>
        <FaComment size={22} />
      </div>
    </div>
  );
};

export default AllReminders;
