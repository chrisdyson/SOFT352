var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var qs = require('querystring');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});
app.get('/w3.css', function (req, res) {
    res.sendFile(__dirname + '/w3.css');
});
app.get('/scripts.js', function (req, res) {
    res.sendFile(__dirname + '/scripts.js');
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


io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
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
