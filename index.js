// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT

// include the express module
var express = require("express");

// create an express application
var app = express();


//  need to run
//  npm install --save ejs
//renders template files
app.set("view engine", 'ejs');

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// native js function for hashing messages with the SHA-256 algorithm
var crypto = require('crypto');

// include the mysql module
var mysql = require("mysql");

var path = require('path');

//  include xml2js parser
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

//  see if user failed password
var fail= false;

//  get username of logged user
var user;

//  check if error has occured in adminPage
var check = false;

//  know what post request just went
// p_mode 0, no request
// 1 : add user
// 2 : update user
// 3 : delete user
var p_mode = 0;

//  need to see if person is logged in
var login = false;




//  server reads in xml data and
//  information used to connect to MySql database
var dataXML;
var dataObj;
var dataHost;
var dataUser;
var dataPassword;
var dataDatabase;
var dataPort;

// USING callback to run setDatabase FIRST
// to initialize vars before setting con

function setDatabase(_callback) {
  //  reading file and setting vars
  fs.readFile(__dirname + '/sample_dbconfig.xml', function(err, data) {
    parser.parseString(data, function(err, result) {
      dataXML = JSON.stringify(result);
      dataObj = JSON.parse(dataXML);
      dataHost = dataObj.dbconfig.host[0];
      dataUser = dataObj.dbconfig.user[0];
      dataPassword = dataObj.dbconfig.password[0];
      dataDatabase = dataObj.dbconfig.database[0];
      dataPort = dataObj.dbconfig.port[0];
      _callback();
    });
  });

}

var con;
function setCon(){
  setDatabase(function() {
    con = mysql.createPool({
    host: dataHost,
    user: dataUser, // replace with the database user provided to you
    password: dataPassword, // replace with the database password provided to you
    database: dataDatabase, // replace with the database user provided to you
    port: dataPort
  });
});
}
setCon();

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false}
));

// server listens on port 9007 for incoming connections
app.listen(9259, () => console.log('Listening on port 9259!'));

//  Get method for welcome page
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/welcome.html');
});

// // GET method route for the contact page.
// It serves contact.ejs in views
app.get('/contact',function(req, res) {
  //make sure user is logged in before access
  if(!login) {
    console.log("must login");
    res.redirect('/login')

  } else {
    res.redirect('/getListOfContacts');
  }
});


// // GET method route for the admin page.
// It serves adminpage.html present in client folder
app.get('/admin',function(req, res) {
  //make sure user is logged in before access
  if(!login) {
    console.log("must login");
    res.redirect('/login');
  } else {
    res.redirect('/getUsers');
  }
});

// GET method route for the addContact page.
// It serves addContact.html present in client folder
app.get('/addContact',function(req, res) {
  //make sure user is logged in before access
  if(!login) {

    console.log("must login");
    res.redirect('/login');
  } else {
    let message = 'welcome ' + user;
    res.render('addContact', {username: message});
  }
});

//GET method for stock page
app.get('/stock', function (req, res) {
  //make sure user is logged in before access
  if(!login) {

    console.log("must login");
    res.redirect('/login');
  } else {
    let message = 'welcome ' + user;
    res.render('stock', {username: message});
  }
});

// GET method route for the login page.
// It serves login.ejs present in views folder
app.get('/login',function(req, res) {
  //want to check is user is still signed in
  if(!login) {
    if (!fail) {
      //  reset message to empty
      res.render('login', {msg: ''});
    } else {
      //  send message of failed authentication
      res.render('login', {msg: 'Invalid Credentials. Please Try Again'})
    }
  } else {
    res.redirect('/contact');
  }
});


// GET method to return the list of contacts
// The function queries the tbl_contacts table for the list of contacts and sends the response back to client
app.get('/getListOfContacts', function(req, res) {
  //query tbl_contacts
  con.query('SELECT * FROM tbl_contacts', function(err, result) {
    if (err) {
      throw err;
    } else {
      //make sure user is logged in before access
      if(!login) {

        console.log("must login");
        res.redirect('/login');
      } else {
        message = "welcome " + user;
        res.render('contact', {contacts: result, username: message});
      }
    }
  });
});

// POST method to insert details of a new contact to tbl_contacts table
app.post('/postContact', function(req, res) {
  //Get details of Post
  var name = req.body.contactName;
  var email = req.body.email;
  var address = req.body.address;
  var phoneNumber = req.body.phoneNumber;
  var favoritePlace = req.body.favoritePlace;
  var favoritePlaceURL = req.body.favoritePlaceURL

  var rowToBeInserted = [
    name,
    email,
    address,
    phoneNumber,
    favoritePlace,
    favoritePlaceURL
  ];

  //  insert into tbl_contacts values from form
  con.query('INSERT INTO tbl_contacts(contact_name, contact_email, contact_address,contact_phone, contact_favoriteplace, contact_favoriteplaceurl) VALUES(?,?,?,?,?,?)', rowToBeInserted, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Value inserted");

  });
  //  redirects back to contact
  res.redirect('/contact');
});

// POST method to validate user login
// upon successful login, user session is created
app.post('/sendLoginDetails', function(req, res) {
  //  get login details
  var username = req.body.username;
  var password = req.body.password;
  var sha_password = crypto.createHash('sha256').update(password).digest('base64')

  //  check if username and password exist if so then
  //  check if username and login exist in tbl__accounts
  if (username && password) {
    con.query('SELECT * FROM tbl_accounts WHERE acc_login = ? AND acc_password = ?', [username, sha_password], function(err, results, fields) {
      if (err) {
        throw err;
      };
      //username and login exists and queried back
      if (results.length > 0) {
        console.log("logged in");
        login = true;
        req.session.username = username;

        con.query('SELECT acc_name FROM tbl_accounts WHERE acc_login = ? AND acc_password = ?', [username, sha_password], function(err, results, fields) {
          if (err) {
            throw err;
          };
          console.log("user " + results[0].acc_name + " logged on");
          user = results[0].acc_name;


        });
        //console.log(user);
        // reset fail flag and go to contacts
        fail= false;
        res.redirect('/contact');
      } else {
        //  user failed login set fail flag to true
        //console.log("F_LOGIN:" + username);
        //console.log("F_PASS:" + password);
        //console.log("failed login");
        fail = true;
        res.redirect('/login');

      }
      res.end();

    });
  } else {
    //  missing username or password just go back to login page
    res.redirect('/login');
  }

});
// GET method to return the list of contacts
// The function queries the tbl_contacts table for the list of contacts and sends the response back to client
app.get('/getUsers', function(req, res) {
  //query tbl_contacts

  con.query('SELECT * FROM tbl_accounts', function(err, result) {
    if (err) {
      throw err;

    } else {


      if(check == true) {

        if(!login) {

          console.log("must login");
          res.redirect('/login');
        } else {
          message = "welcome " + user;
          res.render('adminpage', {response: result, username: message, test: true, mode: p_mode});
        }

        //  reset
        p_mode = 0;

      } else {

        if(!login) {

          console.log("must login");
          res.redirect('/login');
        } else {
          message = "welcome " + user;
          res.render('adminpage', {response: result, username: message, test: false, mode: p_mode});
        }

        //  reset
        p_mode = 0;


      }
    }
  });
});

//  check
app.post('/postContact', function(req, res) {
  console.log("posting users");
  return;

});

//  add new users
//  Trim leading trailing spaces
app.post('/addUser', function(req, res) {
  p_mode = 1;
  check = false;
  var name = req.body.name;
  name = name.trim();

  var login = req.body.login;
  login = login.trim();

  var password = req.body.password;
  password = crypto.createHash('sha256').update(password).digest('base64');

  var rowToBeInserted = [
    name,
    login,
    password
  ];

  //  check if there are duplicate login
  con.query('SELECT * FROM tbl_accounts WHERE acc_login = ?', [login], function(err, results, fields) {
    if (err) {
      throw err;
    };
    // dupes exist
    if (results.length > 0) {
      //  Error
      console.log("Failed to add new user");
      res.end();

    } else {
      //  insert new user into tbl_accounts
      con.query('INSERT INTO tbl_accounts(acc_name, acc_login, acc_password) VALUES(?,?,?)', rowToBeInserted, function(err, result) {
        if(err) {
          throw err;
        }

        console.log(login + " has been inserted");
      });
      check = true;
      res.end();

    }
    });
});

//  delete users
app.post('/deleteUser', function(req, res) {

  check = false;
  p_mode = 3;
  //  only get login
  var login = req.body.login;
  //  get rid of spacing
  login = login.split(' ').join('');
  // cannot delete logged on user
  if (user === login) {
    console.log("cannot delete logged in user");
    res.end();

  } else {
    con.query('DELETE FROM tbl_accounts WHERE acc_login = ?', [login], function(err, results, fields) {
      if (err) {

        throw err;
      };
      console.log("deleted " + login);
    });
    check = true;
    res.end();
  }
  return;

});

//  update information of current users
app.post('/updateUser', function(req, res) {

    p_mode = 2;
    check = false;
    var id = req.body.id;
    var name = req.body.name;
    var login = req.body.login;
    var password = req.body.password;
    //deals with spacing issues with update
    id = id.trim();
    name = name.trim();
    login = login.trim();
    password = password.trim();
    password = crypto.createHash('sha256').update(password).digest('base64');

    var rowToBeUpdated = [
      name,
      login,
      password,
      id
    ];

    //  check if there are duplicate login
    con.query('SELECT * FROM tbl_accounts WHERE acc_login = ?', [login], function(err, results, fields) {
      if (err) {
        throw err;
      };
      // dupes exist
      if (results.length > 0) {
        //  Error Message
        console.log("failed to update")
        //res.redirect('/admin');
        res.end();
      } else {
        //  Update User
        con.query('UPDATE tbl_accounts SET acc_name=?, acc_login=?, acc_password=? WHERE acc_id =?', rowToBeUpdated, function(err, result) {
          if(err) {
            throw err;
          }

          console.log(id + " has been updated");
        });
        check = true;

        //res.redirect('/admin');
        res.end();
      }
    });
});

// log out of the application
// destroy user session
app.get('/logout', function(req, res) {
  //check if session has been started, default redirect to login
  if(!login) {
    console.log("session never started");
    res.redirect('/login');

  //set active session to be false and destroy it
  } else {
    login = false;
    req.session.destroy();
    console.log("logging out");
    res.redirect('/login');
  }
});

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));


// function to return the 404 message and error to client
app.get('*', function(req, res) {
  // add details
  res.sendStatus(404);
});
