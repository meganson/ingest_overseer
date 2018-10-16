/**
 * Created by megan on 2016-10-17.
 */

var mysql = require('mysql');
var config = require('./configModule');
var log = require('./logModule');

var DbModule = function(){
    this._pool = mysql.createPool({
        connectionLimit : config.conf.db.connLimit,
        host : config.conf.db.hostname,
        user : config.conf.db.username,
        password : config.conf.db.password,
        port : config.conf.db.port,
        database : config.conf.db.database
    });
};

DbModule.prototype.getConnection = function(callback){
    this._pool.getConnection(function(err, connection){
        if(err){
            log.error(err.code);
            callback(err);
            return;
        }
        connection.release();
        callback(connection);
    });
};

// streaming execute
DbModule.prototype.sExecute = function(sp, params, callback){
    this._pool.getConnection(function(err, connection){
        if(err){
            log.error(err.code);
            callback(err);
            return;
        }

        var p = [];
        for(var i = 0; i < params.length; i++){
            p.push(params[i].value);
        }

        var sql, result = [];
        (p.length > 0) ? sql = "call " + sp + "(" + mysql.escape(p) + ");" : sql = "call " + sp + "();";
        var query = connection.query(sql);

        query.on('error', function(err){
            log.error(err);
            callback(err);
        });

        query.on('fields', function(fields, index){

        });

        query.on('result', function(rows, index){
            console.error(rows);
            result.push(rows);
        });

        query.on('end', function(){
            connection.release();
            callback(result.shift());
        });
    });
};

// procedure execute
DbModule.prototype.execute = function (sp, params, callback){
    this._pool.getConnection(function(err, connection){
        if(err){
            log.error(err.code);
            callback(err, null);
            return;
        }

        var p = [];
        for(var i = 0; i < params.length; i++){
            p.push(params[i].value);
        }

        // var sql = "call " + sp + "(" + mysql.escape(p) + ")";
        var sql;
        (p.length > 0) ? sql = "call " + sp + "(" + mysql.escape(p) + ");" : sql = "call " + sp + "();";
        connection.query(sql, function(err, rows, fields){
            if(err){
                log.error(sql, err);
                callback(err, null);
                return;
            }
            connection.release();
            if(rows.length > 0) rows.pop();
            log.debug(sql, rows);
            callback(null, rows);
        });
    });
};

// sql query
DbModule.prototype.query = function (sql, callback){
    this._pool.getConnection(function(err, connection){
        if(err){
            log.error(err.code);
            callback(err);
            return;
        }

        connection.query(sql, function(err, rows, fields){
            if(err){
                log.error(err);
                connection.release();
                callback(err);
                return;
            }
            log.debug(params, rows, fields);
            connection.release();
            callback(rows[0]);
        });
    });
};

module.exports = new DbModule();