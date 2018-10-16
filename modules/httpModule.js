/**
 * Created by megan on 2016-11-09.
 */

var http = require('http');
var https = require('https');
var url = require('url');
var request = require('request');
var querystring = require('querystring');
var log = require('./logModule');

var HttpModule = function(){
};

HttpModule.prototype.request = function(host, method, data, timeout, callback){
    var object = url.parse(host);
    var dataString = JSON.stringify(data);
    var req;

    // if(method == 'GET'){
    //     object.path += '?' + querystring.stringify(data);
    // }
    // else{
    if(method === 'POST'){
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataString)
        };
    }
    // }

    var options = {
        host: object.host,
        port: (object.port !== null) ? object.port : (object.protocol === 'https:') ? 443 : 80,
        path: object.protocol + '//' + object.host + object.path + '?' + querystring.stringify(data),
        method: method,
        headers: headers,
        timeout: timeout || 1000
    };
    log.debug(options);

    if(object.protocol === 'https:'){
        req = https.request(options, function(res) {
            res.setEncoding('utf-8');

            var responseString = '';

            res.on('data', function(data) {
                responseString += data;
            });

            res.on('end', function() {
                callback(null, res.statusCode, responseString);
            });
        });
    }else{
        req = http.request(options, function(res) {
            res.setEncoding('utf-8');

            var responseString = '';

            res.on('data', function(data) {
                responseString += data;
            });

            res.on('end', function() {
                callback(null, res.statusCode, responseString);
            });
        });
    }

    req.on('error', function(err){
        log.error(err);
        callback(err, null, null);
    });

    // process.on('uncaughtException', function(err) {
    //     log("uncaughtException");
    //     log.error(err.stack);
    //     process.exit();
    // });

    if(method === 'POST') {
        req.write(dataString);
        log.debug(dataString);
    }
    req.end();
};

HttpModule.prototype.post = function(host, port, path, data, callback){
    var dataString = JSON.stringify(data);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
    };

    var options = {
        hostname: host,
        port: port,
        path: path, // '/compile',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            log.info(responseString);
            var responseObject = JSON.parse(responseString);
            callback(responseObject);
        });
    });

    req.on('error', function(err){
        log.error(err);
        callback();
    });

    req.write(dataString);
    req.end();
};

HttpModule.prototype.get = function(host, port, path, data, callback){
    var options = {
        host: host,
        port: port,
        path: path, // '/compile',
        headers: {}
    };

    var req = http.get(options, function(res) {
        res.on('data', function(data) {
            log.info(path, res.statusCode, JSON.parse(data));
        });
    });

    req.on('error', function(e){
        log.error(path, e);
    });

    callback();
};

module.exports = new HttpModule();