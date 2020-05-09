/*
TO DO:
-----
READ ALL COMMENTS AND REPLACE VALUES ACCORDINGLY
*/

var mysql = require("mysql");
var crypto = require('crypto');

var con = mysql.createConnection({
  host: "cse-larry.cse.umn.edu",
  user: "C4131S20U151", // replace with the database user provided to you
  password: "22831", // replace with the database password provided to you
  database: "C4131S20U151", // replace with the database user provided to you
  port: 3306
});

con.connect(function(err) {
  if (err) {
    throw err;
  };
  console.log("Connected!");

  var rowToBeInserted = {
    acc_name: 'admin', // replace with acc_name chosen by you OR retain the same value
    acc_login: 'admin', // replace with acc_login chosen by you OR retain the same vallue
    acc_password: crypto.createHash('sha256').update("admin").digest('base64') // replace with acc_password chosen by you OR retain the same value
  };

  var sql = ``;
  con.query('INSERT tbl_accounts SET ?', rowToBeInserted, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Value inserted");
  });
});
