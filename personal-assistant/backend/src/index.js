// Requirements from other modules, libraries and packages
const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const WebSocket = require('ws');

// Parsing the credentials into 'CREDENTIALS' and using required fields from it
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

const PROJECTID = CREDENTIALS.project_id;

const CONFIGURATION = {
  credentials: {
    private_key: CREDENTIALS['private_key'],
    client_email: CREDENTIALS['client_email'],
  },
};

const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);

const detectIntent = async (languageCode, queryText, sessionId) => {
  let sessionPath = sessionClient.projectAgentSessionPath(PROJECTID, sessionId);

  let request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: queryText,
        languageCode: languageCode,
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;

  return {
    response: result.fulfillmentText,
    parameters: result.parameters.fields,
    queryText: result.queryText // Added to check user input
  };
};

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/reminders', { useNewUrlParser: true, useUnifiedTopology: true });

const reminderSchema = new mongoose.Schema({
  message: String,
  time: Date,
  remindedAt: Date, // To track when the reminder was last sent
  count: { type: Number, default: 0 } // Counter for reminder triggers

});

const Reminder = mongoose.model('Reminder', reminderSchema);

// Add these lines to index.js to define the Todo schema and model
const todoSchema = new mongoose.Schema({
  task: String,
  createdAt: { type: Date, default: Date.now }
});

const Todo = mongoose.model('Todo', todoSchema);

const webApp = express();

webApp.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());

const PORT = process.env.PORT || 5000;

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  console.log('WebSocket connection established');
});

webApp.get('/', (req, res) => {
  res.send('Hello World.!');
});

// In-memory stack to keep track of triggered reminders
let reminderStack = [];

// Function to notify frontend about reminders
const notifyReminders = async () => {
  const now = new Date();
  const adjustedNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // Add 5.5 hours
  const nowISOString = adjustedNow.toISOString(); // Convert to ISO string for MongoDB query

  console.log(`Checking for reminders at: ${nowISOString}`);
  console.log('Current stack:', reminderStack); // Log the stack before notification

  // Query for reminders that are due up to the adjusted current time
  const reminders = await Reminder.find({ time: { $lte: nowISOString } });

  reminders.forEach(async reminder => {
    // Only remind if the last reminder was sent more than 5 minutes ago
    const remindedAt = reminder.remindedAt ? new Date(reminder.remindedAt) : null;
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if ((!remindedAt || remindedAt < fiveMinutesAgo) && reminder.count < 2){
      console.log(`Sending reminder: ${reminder.message} at ${reminder.time}`);

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ message: reminder.message, time: reminder.time }));
        }
      });

      // Update the remindedAt time
      reminder.remindedAt = now;
      reminder.count += 1;
      await reminder.save();

      // Update the stack
      console.log('Stack before adding reminder:', reminderStack);
      if (reminderStack.length === 0 || reminderStack[reminderStack.length - 1] !== reminder.message) {
        reminderStack.push(reminder.message);
      }
      console.log('Stack after adding reminder:', reminderStack);
    }
  });
};

webApp.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).send('Error fetching todos');
  }
});

webApp.get('/reminders', async (req, res) => {
  try {
    const reminders = await Reminder.find(); // Fetch all reminders from the database
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).send('Server Error');
  }
});

webApp.delete('/todos/:id', async (req, res) => {
  try {
    const todoId = req.params.id;
    const result = await Todo.findByIdAndDelete(todoId);
    if (result) {
      res.status(200).send('Task deleted successfully');
    } else {
      res.status(404).send('Task not found');
    }
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).send('Error deleting todo');
  }
});


// Update the /dialogflow route
webApp.post('/dialogflow', async (req, res) => {
  console.log('Received request:', req.body); // Log the request

  let languageCode = req.body.languageCode;
  let queryText = req.body.queryText;
  let sessionId = req.body.sessionId;

  let responseData = await detectIntent(languageCode, queryText, sessionId);

  console.log('Dialogflow response:', JSON.stringify(responseData, null, 2)); // Log Dialogflow response

  //  To-Do Logic 
  if (responseData.response.toLowerCase().startsWith('added')) {
    // Extract the task from response parameters or response text
    // const todoTextMatch = responseData.response.match(/added '(.*)' to the list/i);
    // if (todoTextMatch && todoTextMatch[1]) {
      const responseText = responseData.response; // Ensure this contains the full response string
      const task = responseText.match(/'([^']+)'/)[1]; // Extract everything after '. '
      // const captask = task.charAt(0).toUpperCase() + task.slice(1);
      // console.log('DB: ', captask);
      const createdAt = new Date();

      const todo = new Todo({
        task,
        createdAt
      });

    try {
      await todo.save();
        console.log('Todo task saved:', todo);
    } catch (error) {
        console.error('Error saving todo task:', error);
      }

    /*
    // Fetch all tasks and send to frontend
    try {
      const todos = await Todo.find();
      const tasks = todos.map(todo => todo.task);
      responseData.response = Todo List:\n${tasks.join('\n')};
    } catch (error) {
      console.error('Error fetching todo tasks:', error);
    }
      */
  
  
}
  // Reminder logic
  if (responseData.parameters) {
    console.log('Parameters:', responseData.parameters); // Log the parameters

    // Extract date-time and message
    const dateTimeField = responseData.parameters['date-time']?.structValue?.fields?.date_time?.stringValue;
    const messageField = `Reminder to ${responseData.parameters['do']?.stringValue} ${responseData.parameters['Event']?.stringValue}`;

    if (dateTimeField) {
      const message = messageField;

      // Parse date-time and add 5 hours
      const originalTime = new Date(dateTimeField);
      const timeWithOffset = new Date(originalTime.getTime() + 5 * 60 * 60 * 1000);

      console.log('Parsed reminder:', { message, time: timeWithOffset }); // Log the parsed reminder

      // Validate time
      if (isNaN(timeWithOffset.getTime())) {
        console.error('Invalid time format:', dateTimeField);
      } else {
        const reminder = new Reminder({
          message,
          time: timeWithOffset, // Store with 5 hours added
          remindedAt: null // Initialize remindedAt as null
        });

        try {
          await reminder.save();
          console.log('Reminder saved:', reminder); // Log the saved reminder
        } catch (error) {
          console.error('Error saving reminder:', error);
        }
      }
    } else {
      console.error('Missing reminder data:', { messageField, dateTimeField });
    }
  }

  console.log('Checking queryText for "last reminder":', responseData.response.toLowerCase()); // Log queryText
  // Check for the specific phrase to remove the last reminder
  if (responseData.response.toLowerCase().includes("last reminder")) {
    console.log('Current stack before removal:', reminderStack); // Log stack before removal
    const lastReminderMessage = reminderStack.pop(); // Get and remove the last reminder from the stack

    if (lastReminderMessage) {
      console.log('Attempting to remove reminder from database:', lastReminderMessage);
      try {
        // Remove the reminder from the database
        const result = await Reminder.deleteOne({ message: lastReminderMessage });
        if (result.deletedCount === 1) {
          console.log('Reminder removed from database:', lastReminderMessage);
        } else {
          console.log('Reminder not found in database:', lastReminderMessage);
        }
        console.log('Current stack after removal:', reminderStack); // Log stack after removal
      } catch (error) {
        console.error('Error removing reminder from database:', error);
      }
    } else {
      console.log('No last reminder found in stack');
    }
  }

  
  if (responseData.response.toLowerCase().startsWith('deleted')) {
    if (responseData.response.toLowerCase().includes("deleted everything")) {
      try {
        await Todo.deleteMany({});
        // responseData.response = 'Deleted all tasks from the todo list.';
      } catch (error) {
        console.error('Error deleting all tasks: ', error);
        // responseData.response = 'An error occurred while deleting all tasks.';
      }
    }
    else {
      const responseText = responseData.response; // Ensure this contains the full response string
      const taskToDelete = responseText.match(/'([^']+)'/)[1]; // Extract the task to delete

      try {
        const result = await Todo.deleteOne({ task: taskToDelete });
        if (result.deletedCount === 1) {
          console.log('Todo task deleted:', taskToDelete);
          responseData.response = `Deleted '${taskToDelete}' from the to-do list.`;
        } else {
          console.log('Todo task not found:', taskToDelete);
          responseData.response = `Could not find '${taskToDelete}' in the to-do list.`;
        }
      } catch (error) {
        console.error('Error deleting todo task:', error);
      }
    }
  }


  
  res.json({ response: responseData.response });

});
   
  



// Schedule the notifyReminders function to run every minute
cron.schedule('* * * * *', notifyReminders);

webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
}); 