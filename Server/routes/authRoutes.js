
const express = require('express');
const User = require('../models/User');
const Recruiter = require('../models/Recruiter');
const router = express.Router();
const { body, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'Harryisagoodb$oy';

// ROUTE 1: Create a User using: POST "/api/auth/createuser". No login required

router.post('/createuser', [
  body('userName', 'Enter a valid name').isLength({ min: 3 }),
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
  // If there are errors, return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check whether the user with this email exists already
    let user = await User.findOne({ email: req.body.email });
    let recruiter = await Recruiter.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ error: "Sorry a user with this email already exists" })
    }
    if (recruiter) {
      return res.status(400).json({ error: "Sorry a user with this email already exists" })
    }
    var type = req.body.userType;
    // Create a new user
    var data = {}

    if (type == 'recruiter') {
      recruiter = await Recruiter.create({
        userName: req.body.userName,
        password: req.body.password,
        email: req.body.email,
      })
      data = {
        recruiter: {
          id: recruiter.id
        }
      }
    }
    else {
      user = await User.create({
        userName: req.body.userName,
        password: req.body.password,
        email: req.body.email,
        skills: req.body.skills,
        job: req.body.job,
        pay: req.body.pay,
        qualification: req.body.qualification
      });
      data = {
        user: {
          id: user.id
        }
      }
    }

    const authtoken = jwt.sign(data, JWT_SECRET);
    console.log(req.body.type);
    //res.json(user)
    res.json({ success: true, authtoken,type})

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})


// ROUTE 2: Authenticate a User using: POST "/api/auth/login". No login required
router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password cannot be blank').exists(),
], async (req, res) => {

  // If there are errors, return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    let success = false;
    let user = await User.findOne({ email });
    let recruiter = await Recruiter.findOne({ email });
    var data = {};
    var type;
    if (!user && !recruiter) {
      success = false
      return res.status(400).json({ error: "Please try to login with correct credentials" });
    }

    if (user) {
      let passwordCompare = () => {
        if (password === user.password)
          return true;
        else return false;
      }
      if (!passwordCompare()) {
        success = false
        return res.status(400).json({ success, error: "Please try to login with correct password" });
      }
      data = {
        user: {
          id: user.id
        }
      }
      type="jobSeeker";
    }

      if (recruiter) {
        let passwordCompare = () => {
          if (password === recruiter.password)
            return true;
          else return false;
        }
        if (!passwordCompare()) {
          success = false
          return res.status(400).json({ success, error: "Please try to login with correct password" });
        }
        data = {
          user: {
            id: recruiter.id
          }
        }
        type="recruiter";

      }
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken,type })

    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }


  });


// ROUTE 3: Get loggedin User Details using: POST "/api/auth/getuser". Login required
router.post('/getJobSeekerDetails', fetchuser, async (req, res) => {

  try {
    const userId = req.user.id;
    var user = await User.findById(userId)//.select("-password")
    res.send(user)

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})

// ROUTE 4: Get loggedin Recruiter Details using: POST "/api/auth/getuser". Login required
router.post('/getRecruiterDetails', fetchuser, async (req, res) => {

  try {
    const userId = req.user.id;
    var user = await Recruiter.findById(userId)//.select("-password")
    res.send(user)

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})


router.post('/updateJobSeekerDetails', fetchuser, async (req, res) => {
  //find by id and delete user
  const userId = req.user.id;
  var user = await User.findById(userId);
  

  console.log(user)
  const { userName, email, password, skills, job, pay, qualification } = req.body;
  const newObject = {}
  if (userName !== user.userName) newObject.userName = userName;
  if (email !== user.email) newObject.email = email;
  if (password !== user.password) newObject.password = password;
  if (skills !== user.skills) newObject.skills = skills;
  if (job !== user.job) newObject.job = job;
  if (pay !== user.pay) newObject.pay = pay;
  if (qualification !== user.qualification) newObject.qualification = qualification;
  const note = await User.findByIdAndUpdate(userId, { $set: newObject }, { new: true })
  console.log(note)
  //Create user with new details
  res.send({ obj: "value" })
})
module.exports = router

