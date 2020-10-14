"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _mongoose = _interopRequireWildcard(require("mongoose"));

var _passport = _interopRequireDefault(require("passport"));

var _passportGithub = _interopRequireDefault(require("passport-github"));

var _passportLocal = _interopRequireDefault(require("passport-local"));

var _expressSession = _interopRequireDefault(require("express-session"));

var _path = _interopRequireDefault(require("path"));

var _express = _interopRequireDefault(require("express"));

var _md = require("./md5.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

//local connection string
//const connectStr = 'mongodb://localhost/appdb';
//remote connection string
//const connectStr = 'mongodb+srv://chundhau:CptS489Sp20@cpts489-sp20-a3bsi.mongodb.net/test?retryWrites=true&w=majority';
var connectStr = 'mongodb+srv://danielchia:bobaguys@cpts489-sp20-txyo8.mongodb.net/test?retryWrites=true&w=majority';

_mongoose["default"].set('useFindAndModify', false); //Open connection to database


_mongoose["default"].connect(connectStr, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  console.log("Connected to ".concat(connectStr, "."));
}, function (err) {
  console.error("Error connecting to ".concat(connectStr, ": ").concat(err));
}); //Define schema that maps to a document in the Users collection in the appdb
//database.


var Schema = _mongoose["default"].Schema;
var roundSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    "enum": ['practice', 'tournament']
  },
  holes: {
    type: Number,
    required: true,
    min: 1,
    max: 18
  },
  strokes: {
    type: Number,
    required: true,
    min: 1,
    max: 300
  },
  minutes: {
    type: Number,
    required: true,
    min: 1,
    max: 240
  },
  seconds: {
    type: Number,
    required: true,
    min: 0,
    max: 60
  },
  SGS: {
    type: Number,
    "default": function _default() {
      return this.strokes * 60 + this.minutes * 60 + this.seconds;
    }
  },
  notes: {
    type: String,
    required: true
  }
});
var userSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  //unique identifier for user
  password: String,
  //unencrypted password (for now!)
  displayName: {
    type: String,
    required: true
  },
  //Name to be displayed within app
  authStrategy: {
    type: String,
    required: true
  },
  //strategy used to authenticate, e.g., github, local
  profileImageUrl: {
    type: String,
    required: true
  },
  //link to profile image
  rounds: [roundSchema],
  securityQuestion: {
    type: String
  },
  securityAnswer: {
    type: String,
    required: function required() {
      return this.securityQuestion ? true : false;
    }
  }
}); //Convert schema to model

var User = _mongoose["default"].model("User", userSchema); //We can use User to read from and write to the 'users' collection of the appdb
//This is by convention. From https://mongoosejs.com/docs/models.html:
//When creating a model from a schema, "Mongoose automatically looks for the 
//plural, lowercased version of your model name [in the first paramater]." 
//It then writes to that collection in the database to which you are connected.
//If that collection does not yet exist, it is automatically created when the
//first document is written!
///////////////////
//PASSPORT SET-UP//
///////////////////


var LOCAL_PORT = 4001;
var DEPLOY_URL = "http://localhost:" + LOCAL_PORT;
var GithubStrategy = _passportGithub["default"].Strategy;

_passport["default"].use(new GithubStrategy({
  clientID: "1b903fd9129642776b3c",
  clientSecret: "1e54162ecb7230eca9d26cc6484636e561e4d838",
  callbackURL: DEPLOY_URL + "/auth/github/callback"
},
/*#__PURE__*/
//The following function is called after user authenticates with github
function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(accessToken, refreshToken, profile, done) {
    var userId, currentUser;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            console.log("User authenticated through GitHub! In passport callback."); //Our convention is to build userId from username and provider

            userId = "".concat(profile.username, "@").concat(profile.provider); //See if document with this userId exists in database 

            _context.next = 4;
            return User.findOne({
              id: userId
            });

          case 4:
            currentUser = _context.sent;

            if (currentUser) {
              _context.next = 9;
              break;
            }

            _context.next = 8;
            return new User({
              id: userId,
              displayName: profile.username,
              authStrategy: profile.provider,
              profileImageUrl: profile.photos[0].value
            }).save();

          case 8:
            currentUser = _context.sent;

          case 9:
            return _context.abrupt("return", done(null, currentUser));

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function (_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}()));

var LocalStrategy = _passportLocal["default"].Strategy;

_passport["default"].use(new LocalStrategy({
  passReqToCallback: true
},
/*#__PURE__*/
//Called when user is attempting to log in with username and password. 
//userId contains the email address entered into the form and password
//contains the password entered into the form.
function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, userId, password, done) {
    var thisUser;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return User.findOne({
              id: userId
            });

          case 3:
            thisUser = _context2.sent;

            if (!thisUser) {
              _context2.next = 13;
              break;
            }

            if (!(thisUser.password === password)) {
              _context2.next = 9;
              break;
            }

            return _context2.abrupt("return", done(null, thisUser));

          case 9:
            req.authError = "The password is incorrect. Please try again or reset your password.";
            return _context2.abrupt("return", done(null, false));

          case 11:
            _context2.next = 15;
            break;

          case 13:
            //userId not found in DB
            req.authError = "There is no account with email " + userId + ". Please try again.";
            return _context2.abrupt("return", done(null, false));

          case 15:
            _context2.next = 20;
            break;

          case 17:
            _context2.prev = 17;
            _context2.t0 = _context2["catch"](0);
            return _context2.abrupt("return", done(_context2.t0));

          case 20:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[0, 17]]);
  }));

  return function (_x5, _x6, _x7, _x8) {
    return _ref2.apply(this, arguments);
  };
}())); //Serialize the current user to the session


_passport["default"].serializeUser(function (user, done) {
  console.log("In serializeUser.");
  console.log("Contents of user param: " + JSON.stringify(user));
  done(null, user.id);
}); //Deserialize the current user from persistent storage to
//the current session.


_passport["default"].deserializeUser( /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(userId, done) {
    var thisUser;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            console.log("In deserializeUser.");
            console.log("Contents of user param: " + userId);
            _context3.prev = 2;
            _context3.next = 5;
            return User.findOne({
              id: userId
            });

          case 5:
            thisUser = _context3.sent;

            if (thisUser) {
              console.log("User with id " + userId + " found in DB. User object will be available in server routes as req.user.");
              done(null, thisUser);
            } else {
              done(new Error("Error: Could not find user with id " + userId + " in DB, so user could not be deserialized to session."));
            }

            _context3.next = 12;
            break;

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3["catch"](2);
            done(_context3.t0);

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[2, 9]]);
  }));

  return function (_x9, _x10) {
    return _ref3.apply(this, arguments);
  };
}()); //////////////////////
//EXPRESS APP SET-UP//
/////////////////////


var PORT = process.env.HTTP_PORT || LOCAL_PORT;
var app = (0, _express["default"])();
app.use((0, _expressSession["default"])({
  secret: "speedgolf2020",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60
  }
})).use(_express["default"]["static"](_path["default"].join(__dirname, "client/build"))).use(_passport["default"].initialize()).use(_passport["default"].session()).use(_express["default"].json()).listen(PORT, function () {
  return console.log("Listening on ".concat(PORT));
}); //////////////////////////////////////////////////////
//EXPRESS APP ROUTES FOR USER AUTHENTICATION (/auth)//
//////////////////////////////////////////////////////
//AUTHENTICATE route (GET): Uses passport to authenticate with GitHub.
//Should be accessed when user clicks on 'Login with GitHub' button on 
//Log In page.

app.get('/auth/github', _passport["default"].authenticate('github')); //CALLBACK route (GET):  GitHub will call this route after the
//OAuth authentication process is complete.
//req.isAuthenticated() tells us whether authentication was successful.

app.get('/auth/github/callback', _passport["default"].authenticate('github', {
  failureRedirect: '/'
}), function (req, res) {
  console.log("auth/github/callback reached.");
  res.redirect('/'); //sends user back to app; req.isAuthenticated() indicates status
}); //LOGOUT route (GET): Use passport's req.logout() method to log the user out and
//redirect the user to the main app page. req.isAuthenticated() is toggled to false.

app.get('/auth/logout', function (req, res) {
  console.log('/auth/logout reached. Logging out');
  req.logout();
  res.redirect('/');
}); //AUTH TEST route (GET): Tests whether user was successfully authenticated.
//Should be called from the React.js client to set up app state.

app.get('/auth/test', function (req, res) {
  console.log("auth/test reached.");
  var isAuth = req.isAuthenticated();

  if (isAuth) {
    console.log("User is authenticated");
    console.log("User object in req.user: " + JSON.stringify(req.user));
  } else {
    //User is not authenticated.
    console.log("User is not authenticated");
  } //Return JSON object to client with results.


  res.json({
    isAuthenticated: isAuth,
    user: req.user
  });
}); //AUTH/LOGIN route (POST): Attempts to log in user using local strategy
//username and password included as query parameters.

app.post('/auth/login', _passport["default"].authenticate('local', {
  failWithError: true
}), function (req, res) {
  console.log("/login route reached: successful authentication.");
  res.status(200).send("Login successful"); //Assume client will redirect to '/' route to deserialize session
}, function (err, req, res, next) {
  console.log("/auth/login route reached: unsuccessful authentication"); //res.sendStatus(401);

  if (req.authError) {
    console.log("req.authError: " + req.authError);
    res.status(400).send(req.authError);
  } else {
    res.status(400).send("Unexpected error occurred when attempting to authenticate. Please try again.");
  }
}); /////////////////////////////////////
//EXPRESS APP ROUTES FOR USER Docs //
/////////////////////////////////////
//USERS/userId route (GET): Attempts to return the data of a user 
//in users collection.
//GIVEN: 
//  id of the user is passed as route parameter.
//  Fields and values to be updated are passed as body as JSON object 
//RETURNS: 
//  Success: status = 200 with user data as JSON object
//  Failure: status = 400 with error message

app.get('/users/:userId', /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res, next) {
    var thisUser;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            console.log("in /users route (GET) with userId = " + JSON.stringify(req.params.userId));
            _context4.prev = 1;
            _context4.next = 4;
            return User.findOne({
              id: req.params.userId
            }).lean();

          case 4:
            thisUser = _context4.sent;

            if (thisUser) {
              _context4.next = 9;
              break;
            }

            return _context4.abrupt("return", res.status(400).message("No user account with specified userId was found in database."));

          case 9:
            return _context4.abrupt("return", res.status(200).json(thisUser));

          case 10:
            _context4.next = 16;
            break;

          case 12:
            _context4.prev = 12;
            _context4.t0 = _context4["catch"](1);
            console.log();
            return _context4.abrupt("return", res.status(400).message("Unexpected error occurred when looking up user in database: " + _context4.t0));

          case 16:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[1, 12]]);
  }));

  return function (_x11, _x12, _x13) {
    return _ref4.apply(this, arguments);
  };
}()); //USERS/userId route (POST): Attempts to add a new user in the users 
//collection. 
//GIVEN: 
//  id of the user to add is passed as route parameter.
//  user data to be added are passed as body as JSON object.
//VALID DATA:
//  'password' field MUST be present
//  The following fields are optional: 
//  displayName', 'profileImageUrl', 'securityQuestion', 'securityAnswer'
//RETURNS: 
//  Success: status = 200
//  Failure: status = 400 with an error message

app.post('/users/:userId', /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(req, res, next) {
    var thisUser;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            console.log("in /users route (POST) with params = " + JSON.stringify(req.params) + " and body = " + JSON.stringify(req.body));

            if (req.body.hasOwnProperty("password")) {
              _context5.next = 3;
              break;
            }

            return _context5.abrupt("return", res.status(400).send("/users POST request formulated incorrectly. " + "It must contain 'password' as field in message body."));

          case 3:
            _context5.prev = 3;
            _context5.next = 6;
            return User.findOne({
              id: req.params.userId
            });

          case 6:
            thisUser = _context5.sent;
            console.log("thisUser: " + JSON.stringify(thisUser));

            if (!thisUser) {
              _context5.next = 12;
              break;
            }

            //account already exists
            res.status(400).send("There is already an account with email '" + req.params.userId + "'.  Please choose a different email.");
            _context5.next = 16;
            break;

          case 12:
            _context5.next = 14;
            return new User({
              id: req.params.userId,
              password: req.body.password,
              displayName: req.params.userId,
              authStrategy: 'local',
              profileImageUrl: req.body.hasOwnProperty("profileImageUrl") ? req.body.profileImageUrl : "https://www.gravatar.com/avatar/".concat((0, _md.md5)(req.params.userId)),
              securityQuestion: req.body.hasOwnProperty("securityQuestion") ? req.body.securityQuestion : "",
              securityAnswer: req.body.hasOwnProperty("securityAnswer") ? req.body.securityAnswer : "",
              rounds: []
            }).save();

          case 14:
            thisUser = _context5.sent;
            return _context5.abrupt("return", res.status(200).send("New account for '" + req.params.userId + "' successfully created."));

          case 16:
            _context5.next = 22;
            break;

          case 18:
            _context5.prev = 18;
            _context5.t0 = _context5["catch"](3);
            console.log(_context5.t0);
            return _context5.abrupt("return", res.status(400).send("Unexpected error occurred when adding or looking up user in database. " + _context5.t0));

          case 22:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[3, 18]]);
  }));

  return function (_x14, _x15, _x16) {
    return _ref5.apply(this, arguments);
  };
}()); //USERS/userId route (PUT): Attempts to update a user in the users collection. 
//GIVEN: 
//  id of the user to update is passed as route parameter.
//  Fields and values to be updated are passed as body as JSON object.  
//VALID DATA:
//  Only the following fields may be included in the message body:
//  password, displayName, profileImageUrl, securityQuestion, securityAnswer
//RETURNS: 
//  Success: status = 200
//  Failure: status = 400 with an error message

app.put('/users/:userId', /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(req, res, next) {
    var validProps, bodyProp, status;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            console.log("in /users PUT with userId = " + JSON.stringify(req.params) + " and body = " + JSON.stringify(req.body));

            if (req.params.hasOwnProperty("userId")) {
              _context6.next = 3;
              break;
            }

            return _context6.abrupt("return", res.status(400).send("users/ PUT request formulated incorrectly." + "It must contain 'userId' as parameter."));

          case 3:
            validProps = ['password', 'displayname', 'profileImageUrl', 'securityQuestion', 'securityAnswer'];
            _context6.t0 = regeneratorRuntime.keys(req.body);

          case 5:
            if ((_context6.t1 = _context6.t0()).done) {
              _context6.next = 11;
              break;
            }

            bodyProp = _context6.t1.value;

            if (validProps.includes(bodyProp)) {
              _context6.next = 9;
              break;
            }

            return _context6.abrupt("return", res.status(400).send("users/ PUT request formulated incorrectly." + "Only the following props are allowed in body: " + "'password', 'displayname', 'profileImageUrl', 'securityQuestion', 'securityAnswer'"));

          case 9:
            _context6.next = 5;
            break;

          case 11:
            _context6.prev = 11;
            _context6.next = 14;
            return User.updateOne({
              id: req.params.userId
            }, {
              $set: req.body
            });

          case 14:
            status = _context6.sent;

            if (status.nModified != 1) {
              //Should never happen!
              res.status(400).send("User account exists in database but data could not be updated.");
            } else {
              res.status(200).send("User data successfully updated.");
            }

            _context6.next = 21;
            break;

          case 18:
            _context6.prev = 18;
            _context6.t2 = _context6["catch"](11);
            res.status(400).send("Unexpected error occurred when updating user data in database: " + _context6.t2);

          case 21:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[11, 18]]);
  }));

  return function (_x17, _x18, _x19) {
    return _ref6.apply(this, arguments);
  };
}()); ///////////////////////////////////////
//EXPRESS APP ROUTES FOR ROUNDS DOCS //
///////////////////////////////////////
//rounds/userId route (GET): Attempts to return all rounds associated with userId
//GIVEN: 
//  id of the user whose rounds are sought is passed as route parameter.
//RETURNS: 
//  Success: status = 200 with array of rounds as JSON object
//  Failure: status = 400 with error message

app.get('/rounds/:userId', /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(req, res) {
    var thisUser;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            console.log("in /rounds (GET) with userId = " + JSON.stringify(req.params.userId));
            _context7.prev = 1;
            _context7.next = 4;
            return User.findOne({
              id: req.params.userId
            }).lean();

          case 4:
            thisUser = _context7.sent;
            console.log("Matched document: " + JSON.stringify(thisUser));

            if (thisUser) {
              _context7.next = 10;
              break;
            }

            return _context7.abrupt("return", res.status(400).send("No user account with specified userId was found in database."));

          case 10:
            return _context7.abrupt("return", res.status(200).json(thisUser.rounds));

          case 11:
            _context7.next = 17;
            break;

          case 13:
            _context7.prev = 13;
            _context7.t0 = _context7["catch"](1);
            console.log(_context7.t0);
            return _context7.abrupt("return", res.status(400).message("Unexpected error occurred when looking up user in database: " + _context7.t0));

          case 17:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[1, 13]]);
  }));

  return function (_x20, _x21) {
    return _ref7.apply(this, arguments);
  };
}()); //rounds/userId/ (POST): Attempts to add new round to database
//GIVEN:
//  id of the user whose round is to be added is passed as 
//  route parameter
//  JSON object containing round to be added is passed in request body
//VALID DATA:
//  user id must correspond to user in Users collection
//  Body object MUST contain only the following fields:
//  date, course, type, holes, strokes, minutes, seconds, notes
//RETURNS:
//  Success: status = 200
//  Failure: status = 400 with error message

app.post('/rounds/:userId', /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(req, res, next) {
    var status;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            console.log("in /rounds (POST) route with params = " + JSON.stringify(req.params) + " and body = " + JSON.stringify(req.body));

            if (!(!req.body.hasOwnProperty("date") || !req.body.hasOwnProperty("course") || !req.body.hasOwnProperty("type") || !req.body.hasOwnProperty("holes") || !req.body.hasOwnProperty("strokes") || !req.body.hasOwnProperty("minutes") || !req.body.hasOwnProperty("seconds") || !req.body.hasOwnProperty("notes"))) {
              _context8.next = 3;
              break;
            }

            return _context8.abrupt("return", res.status(400).send("POST request on /rounds formulated incorrectly." + "Body must contain all 8 required fields: date, course, type, holes, strokes, " + "minutes, seconds, notes."));

          case 3:
            _context8.prev = 3;
            _context8.next = 6;
            return User.updateOne({
              id: req.params.userId
            }, {
              $push: {
                rounds: req.body
              }
            });

          case 6:
            status = _context8.sent;

            if (status.nModified != 1) {
              //Should never happen!
              res.status(400).send("Unexpected error occurred when adding round to database. Round was not added.");
            } else {
              res.status(200).send("Round successfully added to database.");
            }

            _context8.next = 14;
            break;

          case 10:
            _context8.prev = 10;
            _context8.t0 = _context8["catch"](3);
            console.log(_context8.t0);
            return _context8.abrupt("return", res.status(400).send("Unexpected error occurred when adding round to database: " + _context8.t0));

          case 14:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[3, 10]]);
  }));

  return function (_x22, _x23, _x24) {
    return _ref8.apply(this, arguments);
  };
}()); //rounds/userId/roundId (PUT): Attempts to update data for an existing round
//GIVEN:
//  id of the user whose round is to be updated is passed as first 
//  route parameter
//  id of round to be updated is passed as second route parameter
//  JSON object containing data to be updated is passed in request body
//VALID DATA:
//  user id must correspond to user in Users collection
//  round id must correspond to a user's round. (Use rounds/ GET route to obtain a
//  list of all of user's rounds, including their unique ids)
//  Body object may contain only the following 9 fields:
//  date, course, type, holes, strokes, minutes, seconds, notes
//RETURNS:
//  Success: status = 200
//  Failure: status = 400 with error message

app.put('/rounds/:userId/:roundId', /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(req, res, next) {
    var validProps, bodyObj, bodyProp, status;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            console.log("in /rounds (PUT) route with params = " + JSON.stringify(req.params) + " and body = " + JSON.stringify(req.body));
            validProps = ['date', 'course', 'type', 'holes', 'strokes', 'minutes', 'seconds', 'notes'];
            bodyObj = _objectSpread({}, req.body);
            delete bodyObj._id; //Not needed for update

            delete bodyObj.SGS; //We'll compute this below in seconds.

            _context9.t0 = regeneratorRuntime.keys(bodyObj);

          case 6:
            if ((_context9.t1 = _context9.t0()).done) {
              _context9.next = 16;
              break;
            }

            bodyProp = _context9.t1.value;

            if (validProps.includes(bodyProp)) {
              _context9.next = 12;
              break;
            }

            return _context9.abrupt("return", res.status(400).send("rounds/ PUT request formulated incorrectly." + "It includes " + bodyProp + ". However, only the following props are allowed: " + "'date', 'course', 'type', 'holes', 'strokes', " + "'minutes', 'seconds', 'notes'"));

          case 12:
            bodyObj["rounds.$." + bodyProp] = bodyObj[bodyProp];
            delete bodyObj[bodyProp];

          case 14:
            _context9.next = 6;
            break;

          case 16:
            //Add SGS to update object
            bodyObj["rounds.$.SGS"] = Number(bodyObj["rounds.$.strokes"]) * 60 + Number(bodyObj["rounds.$.minutes"]) * 60 + Number(bodyObj["rounds.$.seconds"]);
            _context9.prev = 17;
            _context9.next = 20;
            return User.updateOne({
              "id": req.params.userId,
              "rounds._id": _mongoose["default"].Types.ObjectId(req.params.roundId)
            }, {
              "$set": bodyObj
            });

          case 20:
            status = _context9.sent;

            if (status.nModified != 1) {
              //Should never happen!
              res.status(400).send("Unexpected error occurred when updating round in database. Round was not updated.");
            } else {
              res.status(200).send("Round successfully updated in database.");
            }

            _context9.next = 28;
            break;

          case 24:
            _context9.prev = 24;
            _context9.t2 = _context9["catch"](17);
            console.log(_context9.t2);
            return _context9.abrupt("return", res.status(400).send("Unexpected error occurred when updating round in database: " + _context9.t2));

          case 28:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, null, [[17, 24]]);
  }));

  return function (_x25, _x26, _x27) {
    return _ref9.apply(this, arguments);
  };
}()); //rounds/userId/roundId (DELETE): Attempts to delete an existing round
//GIVEN:
//  id of the user whose round is to be deleted is passed as first 
//  route parameter
//  id of round to be deleted is passed as second route parameter
//VALID DATA:
//  user id must correspond to user in Users collection
//  round id must correspond to a unique id of a user's round. 
//  (Use rounds/ GET route to obtain a list of all of user's 
//  rounds, including their unique ids)
//RETURNS:
//  Success: status = 200
//  Failure: status = 400 with error message

app["delete"]('/rounds/:userId/:roundId', /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(req, res, next) {
    var status;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            console.log("in /rounds (DELETE) route with params = " + JSON.stringify(req.params));
            _context10.prev = 1;
            _context10.next = 4;
            return User.updateOne({
              id: req.params.userId
            }, {
              $pull: {
                rounds: {
                  _id: _mongoose["default"].Types.ObjectId(req.params.roundId)
                }
              }
            });

          case 4:
            status = _context10.sent;

            if (status.nModified != 1) {
              //Should never happen!
              res.status(400).send("Unexpected error occurred when deleting round from database. Round was not deleted.");
            } else {
              res.status(200).send("Round successfully deleted from database.");
            }

            _context10.next = 12;
            break;

          case 8:
            _context10.prev = 8;
            _context10.t0 = _context10["catch"](1);
            console.log(_context10.t0);
            return _context10.abrupt("return", res.status(400).send("Unexpected error occurred when deleting round from database: " + _context10.t0));

          case 12:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, null, [[1, 8]]);
  }));

  return function (_x28, _x29, _x30) {
    return _ref10.apply(this, arguments);
  };
}());
