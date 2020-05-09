/*
TO DO:
-----
READ ALL COMMENTS AND REPLACE VALUES ACCORDINGLY
*/

var mysql = require("mysql");

var con = mysql.createConnection({
  host: "us-cdbr-east-06.cleardb.net",
  user: "bb272c5ed62d82", // replace with the database user provided to you
  password: "5b9a633e", // replace with the database password provided to you
  database: "heroku_1a22d43f8cdcb1d", // replace with the database user provided to you
  port: 3306
});

con.connect(function(err) {
  if (err) {
    throw err;
  };
  console.log("Connected!");
  var sql = `CREATE TABLE tbl_accounts(acc_id INT NOT NULL AUTO_INCREMENT,
                                       acc_name VARCHAR(20),
                                       acc_login VARCHAR(20),
                                       acc_password VARCHAR(50), PRIMARY KEY (acc_id))`;
  con.query(sql, function(err, result) {
    if(err) {
      throw err;
    }
    console.log("Table created");
  });
});
