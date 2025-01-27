/**
  You need to create a HTTP server in Node.js which will handle the logic of an authentication server.
  - Don't need to use any database to store the data.

  - Save the users and their signup/login data in an array in a variable
  - You can store the passwords in plain text (as is) in the variable for now

  The expected API endpoints are defined below,
  1. POST /signup - User Signup
    Description: Allows users to create an account. This should be stored in an array on the server, and a unique id should be generated for every new user that is added.
    Request Body: JSON object with username, password, firstName and lastName fields.
    Response: 201 Created if successful, or 400 Bad Request if the username already exists.
    Example: POST http://localhost:3000/signup

  2. POST /login - User Login
    Description: Gets user back their details like firstname, lastname and id
    Request Body: JSON object with username and password fields.
    Response: 200 OK with an authentication token in JSON format if successful, or 401 Unauthorized if the credentials are invalid.
    Example: POST http://localhost:3000/login

  3. GET /data - Fetch all user's names and ids from the server (Protected route)
    Description: Gets details of all users like firstname, lastname and id in an array format. Returned object should have a key called users which contains the list of all users with their email/firstname/lastname.
    The users username and password should be fetched from the headers and checked before the array is returned
    Response: 200 OK with the protected data in JSON format if the username and password in headers are valid, or 401 Unauthorized if the username and password are missing or invalid.
    Example: GET http://localhost:3000/data

  - For any other route not defined in the server return 404

  Testing the server - run `npm run test-authenticationServer` command in terminal
 */

const express = require("express")
const bodyParser = require('body-parser');
const PORT = 3000;
const app = express();
app.use(bodyParser.json());



// write your logic here, DONT WRITE app.listen(3000) when you're running tests, the tests will automatically start the server

let users = []
class User {
  constructor(email, password, firstname, lastName, id) {
    this.email = email;
    this.password  = password;
    this.firstName  = firstname;
    this.lastName = lastName;
    this.id = id;
  }
}
const signup = (request , response) => {
  console.log(request.body);
  const {email, password, firstName, lastName} = request.body ;
  const isUserExists = (userArray, targetemail) => {
    for (let index = 0; index < userArray.length; index++) {
      let user = userArray[index];
      if (user.email == targetemail) return true;
    }
    return false;
  }
  let userExists = isUserExists(users, email);
  console.log("a",userExists);
  console.log("users",users);
  
  if(userExists) {
    response.status(400).send('User already exists')
  }
  else {
    function generateRandomToken(length) {
      const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
      }
      return token;
    }
    let newUser = new User;
    newUser.email = email;
    newUser.password = password;
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.id = generateRandomToken(7);
    users.push(newUser);
    response.status(201).send('Signup successful');
    console.log(users);
  }
}

const login  = (request, response) => {
  const {email, password} = request.body;
  let user = users.find(user => user.email == email);
  if( user !== undefined && user.password == password) {
    function generateRandomToken(length) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      let token = '';
      
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
      }
      return token;
    }
    let authToken = generateRandomToken(20);
    response.status(200).json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      id: user.id,
      authToken,
    });
  }
  else {
    response.status(401).send('Invalid credentials');
  }
}

const getData = (request, response) => {
  const {email, password} = request.headers;
  let user = users.find(user => user.email == email);
  if( user !== undefined && user.password == password) {
    response.status(200).json(users);
  }
  else {
    response.status(401).send('Unauthorized')
  }
}
app.get('/', (request, response) => {
  response.send( {info: 'API started'} )
});
app.post('/signup', signup)
app.post('/login', login)
app.get('/data', getData)

module.exports = app;

app.listen(3000)
