const express = require('express');
const app = express();

app.use(express.json());


let ADMINS = [];
let USERS = [];
let COURSES = [];

const jwt =  require('jsonwebtoken');

let secret = "secret";
console.log(secret);

class User {
  constructor (username,password,userId) {
    this.username = username;
    this.password = password;
    this.userId = userId;
  }
}

class Course {
  constructor (title , description, price, imageLink, published, courseId) {
    this.title = title;
    this.description = description;
    this.price = price;
    this.imageLink = imageLink;
    this.published = published;
    this.courseId = courseId;
  }
}

const  generateId = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }
  return token;
}


const findPerson = (array, username) => {
  let person = array.find((person)=> person.username === username);


  return person;
}
const findCourse= (courseId) => {
  
  let course = COURSES.find((course)=> course.courseId === courseId);

  return course;
}



const generateAccessToken = (username , password) => {
  return jwt.sign({username , password},secret, {expiresIn : '1h'})
}

const authenticateAccessToken = (req,res,next) => {
  const {authorization} = req.headers;
  if (authorization) {
    const authorizationToken = authorization.split(" ")[1];
    jwt.verify(authorizationToken,secret,(error,decodedData) => {
    if(error){
      console.log(error);
      return res.status(401).send("Unauthorized");

    }
    req.user = decodedData;
    next();
  });
  }

  else res.sendStatus(401);
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  let {username, password}  = req.body;

  let admin = findPerson(ADMINS,username);

  if(admin) {
    res.status(400).send("Admin already exists");
  }

  else {
    let newAdmin = new User;
  
    newAdmin.userId =  generateId();
    newAdmin.username = username;
    newAdmin.password = password;
    ADMINS.push(newAdmin);
    console.log(ADMINS);  
    
    res.status(201).send({"message":"Admin created successfully", "token":`${generateAccessToken(username,password)}`});
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  let {username, password} = req.headers;
  let admin = findPerson(ADMINS,username);
  if(admin) {
    
    if(admin.password === password) {
      res.status(200).json({"message":"Logged in successfully" , "token":`${generateAccessToken(username,password)}`});
    }
    else {
      res.status(401).json({"message": "Unauthorized, Please check the password"})
    }   
  }

  else {
    res.status(404).send("Admin not found. Please sign up!!")
  }

});

app.post('/admin/courses', authenticateAccessToken, (req, res) => {
  // logic to create a course
  let {title, description, price, imageLink , published} = req.body;
  if( title && description && price && imageLink && req.body.hasOwnProperty('published') ) {
    let course = new Course;
  course.title = title;
  course.description = description;
  course.price = price;
  course.imageLink = imageLink;
  course.published = published;
  course.courseId = generateId();
  COURSES.push(course);
  res.status(201).send({"message":"Course created successfully","courseId":`${course.courseId}`});
  }
  else {
    res.status(403).send({"message":"Required fileds are missing.Please check if the following fields are present : title, description, price, imageLink , published"});
  }

});

app.put('/admin/courses/:courseId', authenticateAccessToken,  (req, res) => {
  // logic to edit a course
  const {courseId} = req.params;

  const course = findCourse(courseId);
  
  
  if (course) {
    let courseIndex = COURSES.findIndex((c)=> c === course);
    let updatedCourse = {...course, ...req.body};
    COURSES[courseIndex] = updatedCourse;
    res.status(200).send("Course updated successfully");
  }

  else res.status(404).send("Course not found")

});

app.get('/admin/courses', authenticateAccessToken, (req, res) => {
  // logic to get all courses
  res.status(200).send({ "courses":COURSES })
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user

  let {username, password}  = req.body;

  let user = findPerson(USERS,username);

  if(user) {
    res.status(400).send("User already exists");
  }

  else {
    let newUSer = new User;
  
    newUSer.userId =  generateId();
    newUSer.username = username;
    newUSer.password = password;
    USERS.push(newUSer);
    
    res.status(201).send({"message":"User created successfully", "token":`${generateAccessToken(username,password)}`});
  }


});

app.post('/users/login', (req, res) => {
  // logic to log in user

  let {username, password} = req.headers;
  let user = findPerson(USERS,username);
  if(user) {
    
    if(user.password === password) {
      res.status(200).json({"message":"Logged in successfully" , "token":`${generateAccessToken(username,password)}`});
    }
    else {
      res.status(401).json({"message": "Unauthorized, Please check the password"})
    }   
  }

  else {
    res.status(404).send("User not found. Please sign up!!")
  }
});

app.get('/users/courses', authenticateAccessToken, (req, res) => {
  // logic to list all courses
  console.log(COURSES);
  let publishedCourses = [];
  COURSES.forEach(course => {
    if(course.published === true) publishedCourses.push(course);
  });
  res.send({"courses":publishedCourses})
});

app.post('/users/courses/:courseId', authenticateAccessToken, (req, res) => {
  // logic to purchase a course
  let user = req.user;
  let username = user.username;
  console.log("users are" + USERS);
  console.log(" is",user);
  const {courseId} = req.params;
  let course = findCourse(courseId);
  let userIndex = USERS.findIndex((u) => u.username === username);
  if(userIndex > -1 ) {
    console.log("Course to be purchased ", course);

  if(!course) {
    res.status(404).send("Course not found");
  }
  else{
    console.log("user courses", )
    if (!USERS[userIndex].purchasedCourses) {
      USERS[userIndex].purchasedCourses = [];
    }
    console.log("Purchased courses", USERS[userIndex].purchasedCourses);
    USERS[userIndex].purchasedCourses.push(course);
    console.log("user purchased", USERS[userIndex].purchasedCourses)
    USERS.forEach((e)=> console.log(e));
    res.status(200).json({"message":"Course purchased successfully"});
    }
  }
  else {
    res.status(404).send("User not found");
  }
  
});

app.get('/users/purchasedCourses', authenticateAccessToken,(req, res) => {
  // logic to view purchased courses
  let user = req.user;
  let username =  user.username;
  let userIndex = USERS.findIndex((u) => u.username === username);
  if(userIndex > -1) {
    console.log("purchased coursees user", USERS[userIndex]);
    console.log(USERS[userIndex].purchasedCourses);
    res.status(200).json(USERS[userIndex].purchasedCourses);
  }
  else {
    res.status(404).send({"message":"User not found"})
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
