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
app.get('/setlogin', function (req, res) {
    res.sendFile(__dirname + '/setlogin.html');
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
    checkLogin(req, res);
});
app.post('/createuser', function (req, res) {
    createUser(req, res);
});
app.post('/sendtimesheet', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload.path;
        var newpath = '/home/ubuntu/timesheets/' + files.filetoupload.name;
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            res.write('Timesheet uploaded successfully!');
            res.end();
        });
    });
});
app.get('/timesheet', function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write('<form action="sendtimesheet" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
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

http.listen(80, function () {
    console.log('listening on :80');
});

function checkLogin(req, res) {
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

                                res.redirect('/setlogin?username=' + userUsername + '&priviledge=0');

                            } else if (userPriviledge == 1) { //user found, is manager
                                connection.end();

                                res.redirect('/setlogin?username=' + userUsername + '&priviledge=1');

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
}

function createUser(req, res) {
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
}
