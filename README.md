# 101508476_lab_test1_chat_app

Real-time chat application built using Express, Socket.io, and MongoDB
(Mongoose). Developed for COMP 3133 -- Lab Test 1.

------------------------------------------------------------------------

## Features

### Authentication

-   User signup with unique username validation
-   Password hashing using bcrypt
-   Login with credential verification
-   Session stored in localStorage
-   Logout functionality

### Room-Based Chat

-   Predefined rooms (devops, cloud computing, covid19, sports, nodeJS)
-   Real-time messaging using Socket.io
-   Room isolation (users only see messages in joined room)
-   Leave room functionality

### Message Persistence

-   Users stored in `users` collection
-   Group messages stored in `groupmessages`
-   Private messages stored in `privatemessages`
-   Chat history loads when rejoining a room

### Private Messaging

-   1-to-1 direct messaging
-   MongoDB persistence for private messages
-   Typing indicator for direct chat

------------------------------------------------------------------------

## Tech Stack

Backend: - Node.js - Express - Socket.io - Mongoose (MongoDB) - bcrypt

Frontend: - HTML5 - Bootstrap - jQuery - fetch API

------------------------------------------------------------------------

## Setup Instructions

1.  Clone the repository: git clone `<repo-link>`{=html} cd
    101508476_lab_test1_chat_app

2.  Install dependencies: npm install

3.  Create a .env file in the root directory: PORT=3000
    MONGO_URI=your_mongodb_connection_string

4.  Start the server: npm run dev

5.  Open in browser: http://localhost:3000/signup
