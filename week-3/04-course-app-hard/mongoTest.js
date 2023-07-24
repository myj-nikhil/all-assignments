const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://korzera-admin:admin123@korzera-cluster-1.qgv9mpa.mongodb.net/?retryWrites=true&w=majority",{ useNewUrlParser: true, useUnifiedTopology: true, dbName: "korzera" })

const userSchema = new mongoose.Schema({
    username: {type: String},
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
  