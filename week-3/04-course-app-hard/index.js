const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(express.json());

let corsOptions = {
  origin : ['http://localhost:5173'],
}
 
app.use(cors(corsOptions))


mongoose.connect("mongodb+srv://korzera-admin:admin123@korzera-cluster-1.qgv9mpa.mongodb.net/?retryWrites=true&w=majority",{ useNewUrlParser: true, useUnifiedTopology: true, dbName: "korzera" })

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
  });
  
const adminSchema = new mongoose.Schema({
username: String,
password: String
});

const courseSchema = new mongoose.Schema({
title: String,
description: String,
price: Number,
imageLink: String,
published: Boolean
});

const User = mongoose.model('User', userSchema)
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

const jwt =  require('jsonwebtoken');

let secret = "secret";
// console.log(secret);



const generateAccessToken = (username , password) => {
  return jwt.sign({username , password},secret, {expiresIn : '1h'})
}

const authenticateAccessToken = (req,res,next) => {
  const {authorization} = req.headers;
  if (authorization) {
    const authorizationToken = authorization.split(' ')[1];
    console.log("auth"+authorization);
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
app.get('/admin/me', authenticateAccessToken , async (req, res) => {
  const admin = await Admin.findOne({ username: req.user.username });
  if (!admin) {
    res.status(403).json({msg: "Admin doesnt exist"})
    return
  }
  res.json({
      username: admin.username
  })
});

// Admin routes
app.post('/admin/signup', async (req, res) => {
  // logic to sign up admin
  const {username, password}  = req.body;

  let admin = await Admin.findOne({ username })
  if(admin) {
    res.status(400).send("Admin already exists");
  }
  else {
    const requestingAdmin  = {username : username , password : password};
    const newAdmin = new Admin(requestingAdmin);
    await newAdmin.save(); 
    res.status(201).send({"message":"Admin created successfully", "token":`${generateAccessToken(username,password)}`});
  }
  });

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const { username , password } = req.headers;
  console.log("username"+username+"pass"+password);
  let admin = await Admin.findOne({username: username, password: password});
  console.log("admin",admin);
  if(admin) {
      res.status(200).json({"message":"Logged in successfully" , "token":`${generateAccessToken(username,password)}`});
  }
  else {
    res.status(403).send("Invalid username/password")
  }
});

app.post('/admin/courses', authenticateAccessToken, async (req, res) => {
  // logic to create a course
  const course = new Course(req.body);
  await course.save();
  res.json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', authenticateAccessToken, async (req, res) => {
  // logic to edit a course

  try {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
  
    // The update was successful, and 'course' now holds the updated document
    console.log('Course updated successfully:', course);
  
    // Do additional processing with the updated 'course' if needed
    res.json({ message: 'Course updated successfully' });
  
  } catch (error) {
    // Handle errors that occurred during the update process
    console.error('Error updating course:', error.message);
  
    // You can also log the full error object for more detailed information
    console.error(error);
  
    // Handle specific error cases
    if (error.name === 'CastError') {
      // The provided 'courseId' may be in an invalid format
      console.error('Invalid courseId:', error);
    } else {
      // Handle other types of errors as needed
      // e.g., database connection issues, validation errors, etc.
    }
    res.status(404).json({ message: 'Course not found' });
  }
  
});

app.get('/admin/courses', authenticateAccessToken, async (req, res) => {
  // logic to get all courses
  const courses = await Course.find({});
  res.status(200).send({ courses })
});

app.get('/admin/course/:courseId', authenticateAccessToken, async (req, res) => {
  // logic to get a particular course
  const courses = await Course.findById(req.params.courseId);
  res.status(200).send({ courses })
});



// User routes
app.post('/users/signup', async (req, res) => {
  // logic to sign up user

  const {username, password}  = req.body;

  let user = await User.findOne({ username })
  if(user) {
    res.status(400).send("User already exists");
  }
  else {
    const requestingUser  = {username : username , password : password};
    const newUser = new User(requestingUser);
    await newUser.save(); 
    res.status(201).send({"message":"User created successfully", "token":`${generateAccessToken(username,password)}`});
  }


});

app.post('/users/login', async (req, res) => {
  // logic to log in user
  const {username, password} = req.headers;

  const user = await User.findOne({ username: username, password: password});
  if(user) {
    res.status(200).send({"message":"User loggedin successfully", "token":`${generateAccessToken(username,password)}`})
  }
  else {
    res.status(403).send("Invalid username/password")
  }
  
});

app.get('/users/courses', authenticateAccessToken, async (req, res) => {
  // logic to list all courses
  const publishedCourses = await Course.find({published:true});
  res.send({"courses":publishedCourses});
});

app.get('/users/courses/:courseId', authenticateAccessToken, async (req, res) => {
  // logic to get a particular course
  const course = await Course.findOne({_id: req.params.courseId, published: true});
  console.log(course);
  res.status(200).send({ course })
});

app.post('/users/courses/:courseId', authenticateAccessToken, async (req, res) => {
  // logic to purchase a course
  const {username,password} = req.user;
  const course = await Course.findOne({_id: req.params.courseId, published: true});
  if(course) {
    const user = await User.findOne({username: username, password: password});
    if(user){
      console.log(user.purchasedCourses);
      console.log(user);
      const isAlreadyPurchased = user.purchasedCourses.includes(course.id);
      if(isAlreadyPurchased) {
        res.status(400).send({"message":"Course purchased already"})
      }
      else {
        user.purchasedCourses.push(course);
        await user.save();
        res.json({ message: 'Course purchased successfully' });
      }
    }
    else {
      res.status(403).send({"message":"User not found"})
    }
  }
  else {
    res.status(404).send({"message":"Course not found"});
  }
});

app.get('/users/purchasedCourses', authenticateAccessToken,async (req, res) => {
  // logic to view purchased courses
  const {username, password} = req.user;
  const user = await User.findOne({username: username, password: password});
  if(user) {
    const courses = user.purchasedCourses;
    console.log(courses)
    res.status(200).json(courses);
  }
  else {
    res.status(404).send({"message":"User not found"})
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
