# Bluff Card Game
This project was created for learning the usage of socket.io library for real-time bi-directional communication integrated within a full-stack web application.

## Initialization

### After cloning the repository follow the given steps:

1. run `npm install` in the root directory, at /frontend and at /backend.
2. create a *.env* file in /backend and copy the format given below.
3. create a database in mongoDB Atlas with a desired name and create user collection.

## Running The Application
1. make sure you are in the root directory and all initialization steps are completed.
2. run the command `npm run dev`. This will start the application.
3. Alternately, open two terminals and change to /frontend and /backend directories. Then run `npm start` in both the terminals.

## environment variable template

TOKEN_SECRET=<YOUR_TOKEN_SECRET>   
HASH_SECRET=<YOUR_HASH_SECRET>   
MONGODB_URI=<YOUR_MONGODB_CONNECTION_STRING>    
LOCALHOST_ORIGIN=http://localhost:3000   
NGROK_ORIGIN=<NGROK_GENERATED_DOMAIN>   

Remove the NGROK_ORIGIN variable from allowedOrigins in server.js if ngrok is not used