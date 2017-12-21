var http = require('http');
var fs = require("fs");
var mysql = require('mysql');
var qs = require('querystring');

var server = http.createServer(function (request, response) {

    if (request.url === "/home") {
        sendFileContent(response, "employee.html", "text/html");
    } else if (request.url === "/manager") {
        sendFileContent(response, "management.html", "text/html");
    } else if (request.url === "/") {
        sendFileContent(response, "login.html", "text/html");
    } else if (request.url === "/?error=true") {
        sendFileContent(response, "login.html", "text/html");
    } else if (request.url === "/login") {
        checkLogin(request, response);
    } else if (/^\/[a-zA-Z0-9\/]*.js$/.test(request.url.toString())) {
        sendFileContent(response, request.url.toString().substring(1), "text/javascript");
    } else if (/^\/[a-zA-Z0-9\/]*.css$/.test(request.url.toString())) {
        sendFileContent(response, request.url.toString().substring(1), "text/css");
    } else if (/^\/[a-zA-Z0-9\/]*.txt$/.test(request.url.toString())) {
        sendFileContent(response, request.url.toString().substring(1), "text/plain");
    } else {
        //console.log("Requested URL is: " + request.url);
        response.end();
    }
})

server.listen(80, function () {
    console.log('Server listening on port 80')
})

function sendFileContent(response, fileName, contentType) {
    fs.readFile(fileName, function (err, data) {
        if (err) {
            response.writeHead(404);
            response.write("Not Found!");
        } else {
            response.writeHead(200, {
                'Content-Type': contentType
            });
            response.write(data);
        }
        response.end();
    });
}



function checkLogin(request, response) {
    var userPriviledge;
    if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6)
                request.connection.destroy();
        });

        request.on('end', function () {
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
                            if (userPriviledge == 0) {
                                connection.end();
                                response.writeHead(301, {
                                    Location: "http://" +
                                        request.headers.host + "/home"
                                });
                                response.end();
                            } else if (userPriviledge == 1) {
                                connection.end();
                                response.writeHead(301, {
                                    Location: "http://" +
                                        request.headers.host + "/manager"
                                });
                                response.end();
                            } else {
                                connection.end();
                                response.writeHead(301, {
                                    Location: "http://" +
                                        request.headers.host + "/"
                                });
                                response.end();
                            }
                        } else {
                            connection.end();
                            response.writeHead(301, {
                                Location: "http://" +
                                    request.headers.host + "/?error=true"
                            });
                            response.end();
                        }
                    } else {
                        console.log('Error while performing Query.');
                        connection.end();
                        response.writeHead(301, {
                            Location: "http://" +
                                request.headers.host + "/"
                        });
                        response.end();
                    }
                });
        });
    }
}
