const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // use this secret!
const Users = require('../users/users-model.js');

router.post("/register", validateRoleName, (req, res, next) => {
  let user = req.body;
  user.role_name = req.role_name;

  const hash = bcrypt.hashSync(user.password, 8);
  user.password = hash;

  Users.add(user)
    .then(newUser => {
      res.status(201).json(newUser);
    })
    .catch(next);
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  const { password } = req.body;

  if (bcrypt.compareSync(password, req.existingUser.password)) {
    const payload = {
      subject: req.existingUser.user_id,
      username: req.existingUser.username,
      role_name: req.existingUser.role_name
    }

    const options = {
      expiresIn: '1d'
    }

    const token = jwt.sign(payload, JWT_SECRET, options);
    res.status(200).json({ message: `${req.existingUser.username} is back!`, token });
  } else {
    next({ status: 401, message: 'Invalid credentials' });
  }
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
});

module.exports = router;
