import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import { FaComment } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';


const AllToDoLists = ({ onBack, startListening }) => {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/todos'); // Replace with your API endpoint
        setTodos(response.data);
      } catch (error) {
        console.error('Error fetching to-do lists:', error);
      }
    };

    fetchTodos();
  }, []);

  

  return (
    <div className="todo-container">
      <h2>All To-Do Lists</h2>
      <div className="todos-list">
        {todos.length === 0 ? (
          <p>No to-do lists available.</p>
        ) : (
          todos.map((todo, index) => (
            <div key={index} className="todo-item">
              {todo.task} {/* Adjust based on your data structure */}
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

export default AllToDoLists;
