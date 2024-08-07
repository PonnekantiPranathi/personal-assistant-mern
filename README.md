# Personal Assistant

This project is a Personal Assistant application built using the MERN (MongoDB, Express.js, React, Node.js) stack, enhanced with Dialogflow integration for natural language understanding and voice command capabilities. 
It provides functionalities for setting reminders, managing to-do tasks, and obtaining weather updates through both text and voice responses but mainly designed to make tasks simple through voice commands.
It uses various technologies and APIs to deliver a seamless and interactive user experience. It also used text-to-speech libraries.


## Features
### Voice Interaction:

Voice responses using free text-to-speech libraries.
Continuous listening for the trigger phrase 'hey buddy' with real-time updates and greetings based on the time of day.

### Text Interaction:

Dialogflow integration for handling user queries and commands.
Text-based responses for reminders, to-do tasks, and weather updates.

### Dynamic Data:

Real-time location and weather updates using free APIs.
Display of reminders and to-do tasks in the chat interface with interactive icons.

### Reminder Management:

Ability to set, modify, and remove reminders through both text and voice commands.
Display and manage reminders directly from the chat interface.

### To-Do Management:

View and manage to-do lists from the chat interface with separate sections for reminders and tasks.
Interactive icons for quick access to all tasks and reminders.

## Technologies Used
### Frontend:

React: For building the user interface with components handling chat interactions and voice commands.
React Hooks: For managing state and lifecycle within functional components.
CSS: For styling components and creating a responsive design.

### Backend:

Node.js: Server-side runtime environment for handling API requests and business logic.
Express.js: Web framework for building RESTful APIs and managing server routes.

### Database:

MongoDB: NoSQL database for storing user data, reminders, and to-do tasks.

### Voice and Text Processing:

Dialogflow: For natural language understanding and processing user inputs.
Text-to-Speech Library: Free library for converting text responses into voice.

### APIs:

Location API: For fetching user’s current location.
Weather API: For retrieving weather information based on the user’s location
Google Cloud Service Credentials: For integrating dialogflow into my application.
