var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var qs = require('querystring');
var formidable = require('formidable');
var fs = require('fs');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

app.get('/w3.css', function (req, res) {
    res.sendFile(__dirname + '/w3.css');
});

app.get('/timesheet.docx', function (req, res) {
    res.sendFile(__dirname + '/Timesheet.docx');
});

app.get('/home', function (req, res) {
    res.sendFile(__dirname + '/employee.html');
});

app.get('/manager', function (req, res) {
    res.sendFile(__dirname + '/management.html');
});

app.get('/chat', function (req, res) {
    res.sendFile(__dirname + '/chat.html');
});

app.post('/login', function (req, res) {
    var userPriviledge;
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            var connection = mysql.createConnection({
                host: 'mydbinstance.c6xj1ygvt6xb.us-west-2.rds.amazonaws.com',
                user: 'mydbusername',
                password: 'mydbpassword'
            });

            connection.connect();
            connection.query("SELECT * FROM mydb.user WHERE username = " + mysql.escape(post.username) + "AND password = " + mysql.escape(post.password),
                function (err, rows, fields) {
                    if (!err) {
                        if (rows != '') {
                            userPriviledge = rows[0].ismanager;
                            userUsername = rows[0].username;
                            if (userPriviledge == 0) { //user found, is not manager
                                connection.end();
                                res.write('<script>localStorage.setItem("username", "' + userUsername + '");localStorage.setItem("priviledge", "' + userPriviledge + '");window.location.replace("/home");</script>');
                                return res.end();
                            } else if (userPriviledge == 1) { //user found, is manager
                                connection.end();
                                res.write('<script>localStorage.setItem("username", "' + userUsername + '");localStorage.setItem("priviledge", "' + userPriviledge + '");window.location.replace("/manager");</script>');
                                return res.end();
                            } else { //error with priviledge
                                connection.end();
                                res.writeHead(301, {
                                    Location: "http://" +
                                        req.headers.host + "/"
                                });
                                res.end();
                            }
                        } else { //error, user not found or password incorrect
                            connection.end();
                            res.writeHead(301, {
                                Location: "http://" +
                                    req.headers.host + "/?error=true"
                            });
                            res.end();
                        }
                    } else { //error
                        console.log('Error while performing Query.');
                        connection.end();
                        res.writeHead(301, {
                            Location: "http://" +
                                req.headers.host + "/"
                        });
                        res.end();
                    }
                });
        });
    }
});

app.post('/createuser', function (req, res) {
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            var connection = mysql.createConnection({
                host: 'mydbinstance.c6xj1ygvt6xb.us-west-2.rds.amazonaws.com',
                user: 'mydbusername',
                password: 'mydbpassword'
            });
            connection.connect();
            var ismanager;
            if (post.ismanager == undefined) {
                ismanager = 0;
            } else {
                ismanager = 1;
            }
            connection.query("INSERT INTO mydb.user (username, email, password, ismanager) VALUES (" + mysql.escape(post.username) + "," + mysql.escape(post.email) + "," + mysql.escape(post.password) + "," + ismanager + ")",
                function (err, rows, fields) {
                    if (!err) {
                        connection.end();
                        res.writeHead(301, {
                            Location: "http://" +
                                req.headers.host + "/manager"
                        });
                        res.end();
                    } else { //error
                        console.log('Error while performing Query.');
                        connection.end();
                        res.writeHead(301, {
                            Location: "http://" +
                                req.headers.host + "/manager?error=true"
                        });
                        res.end();
                    }
                });
        });
    }
});

app.post('/sendtimesheet', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload.path;
        var newpath = '/home/ubuntu/timesheets/' + fields.username + '.docx';
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.write('<link rel="stylesheet" href="w3.css">');
            res.write('<script>function uploadmore() { window.location.replace("/timesheet"); }</script>');
            res.write('<div class="w3-center">Timesheet uploaded successfully!</div><br>');
            res.write('<div class="w3-center"><input class="w3-center w3-button w3-ripple w3-light-grey" type="button" onclick="uploadmore()" value="Upload More"></div>');
            res.end();
        });
    });
});

app.get('/timesheet', function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write('<link rel="stylesheet" href="w3.css">');
    res.write('<script src="http://code.jquery.com/jquery-latest.js" type="text/javascript"></script>');
    res.write('<script>var currentdate = new Date(); var datetime = "" + currentdate.getDate() + "-" + (("0" + (currentdate.getMonth() + 1)).slice(-2))  + "-" + ("0" + (currentdate.getFullYear() + 1)).slice(-2) + "_" + ("0" + (currentdate.getHours() + 1)).slice(-2) + ":" + ("0" + (currentdate.getMinutes() + 1)).slice(-2) + ":" + ("0" + (currentdate.getSeconds() + 1)).slice(-2); </script>');
    res.write('<script>$(document).ready(function() { $("#hiddenusername").val( localStorage.username + "_" + datetime) });</script>');
    res.write('<form class="w3-center" action="sendtimesheet" method="post" enctype="multipart/form-data">');
    res.write('<input class="w3-center w3-button w3-dark-grey" type="file" name="filetoupload" accept=".docx" required><br><br>');
    res.write('<input type="hidden" id="hiddenusername" name="username" value="">');
    res.write('<input class="w3-center w3-button w3-ripple w3-light-grey" type="submit" value="Upload">');
    res.write('</form>');
    return res.end();
});

app.post('/addtomessageboard', function (req, res) {
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            var connection = mysql.createConnection({
                host: 'mydbinstance.c6xj1ygvt6xb.us-west-2.rds.amazonaws.com',
                user: 'mydbusername',
                password: 'mydbpassword'
            });

            connection.connect();
            connection.query("INSERT INTO mydb.messageboard (message, author) VALUES (" + mysql.escape(post.message) + ", " + mysql.escape(post.username) + ")",
                function (err, rows, fields) {
                    if (!err) {
                        connection.end();
                        res.writeHead(301, {
                            Location: "http://" +
                                req.headers.host + "/manager"
                        });
                        res.end();
                    } else { //error
                        console.log('Error while performing Query.');
                        console.log(err);
                        connection.end();
                        res.writeHead(301, {
                            Location: "http://" +
                                req.headers.host + "/manager?posterror=true"
                        });
                        res.end();
                    }
                });
        });
    }
});

app.get('/viewmessageboard', function (req, res) {
    var connection = mysql.createConnection({
        host: 'mydbinstance.c6xj1ygvt6xb.us-west-2.rds.amazonaws.com',
        user: 'mydbusername',
        password: 'mydbpassword'
    });
    connection.connect();
    connection.query("SELECT * FROM(SELECT * FROM mydb.messageboard ORDER BY messageID DESC LIMIT 50) sub ORDER BY messageID DESC",
        function (err, rows, fields) {
            if (!err) {
                if (rows != '') {
                    res.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    var numOfMessages = rows.length;
                    var messagesToShow;
                    if (numOfMessages <= 5) {
                        messagesToShow = numOfMessages;
                    } else {
                        messagesToShow = 6;
                    }
                    res.write('<link rel="stylesheet" href="w3.css">');
                    res.write('<table class="w3-table-all w3-card-4"><tr><th style="width:60%">Message</th><th style="width:20%">Posted By</th><th style="width:20%">Posted On</th></tr>');
                    for (i = 0; i < messagesToShow; i++) {
                        var postdate = String(rows[i].postdate).slice(0, -18);
                        res.write('<tr><td>' + rows[i].message + '</td><td>' + rows[i].author + '</td><td>' + postdate + '</td></tr>');
                    }
                    res.write('</table>');
                    res.write('<p>Showing ' + messagesToShow + ' out of ' + numOfMessages + ' messages</p>')
                    res.end();
                    connection.end();
                } else { //error - no data
                    console.log('Error while performing Query.');
                    connection.end();
                    res.write("Sorry, there was an error retrieving the message board data");
                    res.end();
                }
            } else { //error
                console.log('Error while performing Query.');
                connection.end();
                res.write("Sorry, there was an error retrieving the message board data");
                res.end();
            }
        });
});

var usersConnected = 0;
io.on('connection', function (socket) {
    //io.emit('chat message', 'A user has joined the chat');
    usersConnected++;
    io.emit('nums', usersConnected);
    socket.on('disconnect', function () {
        //io.emit('chat message', 'A user has left the chat');
        usersConnected--;
        io.emit('nums', usersConnected);
    });
    socket.on('join chat message', function (user) {
        io.emit('chat message', '<b>' + user + '</b> has joined the chat');
    });
    socket.on('leave chat message', function (user) {
        io.emit('chat message', '<b>' + user + '</b> has left the chat');
    });
    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
        io.emit('nums', usersConnected);
    });
});

http.listen(3000, function () {
    console.log('listening on :3000');
});
