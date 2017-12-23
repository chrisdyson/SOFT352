var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'mydbinstance.c6xj1ygvt6xb.us-west-2.rds.amazonaws.com',
    user: 'mydbusername',
    password: 'mydbpassword'
});

connection.connect();

connection.query('SELECT * from mydb.user', function(err, rows, fields) {
  if (!err)
    console.log('The solution is: ', rows);
  else
    console.log('Error while performing Query.');
});

connection.end();


     */     connection.query("SELECT * FROM mydb.user WHERE username = 'cpd'",
                function (err, rows, fields) {
                    if (!err)
                        console.log('The solution is: ', rows);
                    else
                        console.log('Error while performing Query.');
                });




            /*()
                        var sql = "SELECT * FROM mydb.user WHERE username = '" + post.username + "'";
                        console.log(sql);
                        connection.query(sql, function (err, result) {
                            if (!err)
                                console.log('username found');
                            else
                                console.log('username not found');
                        });
            /*
                        var sql = "INSERT INTO mydb.user (username, email, password) VALUES ('cd', 'cd@gmail.com', 'pass')";
                        connection.query(sql, function (err, result) {
                            if (err) throw err;
                            console.log("1 record inserted");
                        });
                        
                   */