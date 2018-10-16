/**
 * Created by megan on 2016-11-04.
 */

var winston = require('winston');
require('winston-daily-rotate-file');
var fs = require('fs');
var moment = require('moment');
var config = require('./configModule');
var date = require('./dateModule');

var LogModule = function(){
    this._logDir = config.conf.log.dir;
    if(!fs.existsSync(this._logDir)){
        fs.mkdirSync(this._logDir);
    }
    this._logDir += config.conf.appName;
    if(!fs.existsSync(this._logDir)){
        fs.mkdirSync(this._logDir);
    }

    var seoulZone = date.getTimeDifference() + 9;

    var customLog = {
        levels: {
            emerg: 0,
            alert: 1,
            crit: 2,
            error: 3,
            warn: 4,
            notice: 5,
            info: 6,
            debug: 7
        },
        colors: {
            emerg: 'red',
            alert: 'yellow',
            crit: 'red',
            error: 'red',
            warn: 'red',
            notice: 'yellow',
            info: 'green',
            debug: 'blue'
        }
    };

    this._logger = new (winston.Logger)({
        levels: customLog.levels,
        colors: customLog.colors,
        timestamp: true,
        transports: [
            // Console transport
            new (winston.transports.Console)({
                level: config.conf.log.consoleLevel || 'debug',
                colorize: true,
                timestamp: function() { return date.getBarDatetimeMsFormat_24(date.getDatetime() + seoulZone); }
            }),
            // File transport
            // new (winston.transports.File)({
            //     level: 'debug',
            //     colorize: true,
            //     silent: false,
            //     timestamp: function(){ return moment().format('YYYY-MM-DD hh:mm:ss.SSS') },
            //     name: 'debug-file',
            //     filename: this._logDir + '_debug.log.' + moment().format('YYYYMMDD'),
            //     maxFiles: 2,
            //     json: false
            //         //moment().format('YYYYMMDD')+'.log';
            // }),
            // File transport
            new winston.transports.DailyRotateFile({
                level: 'debug',
                colorize: true,
                timestamp: function() { return date.getBarDatetimeMsFormat_24(date.getDatetime() + seoulZone); },
                name: 'debug-file',
                filename: this._logDir + '/debug.',
                datePattern: date.getDateFormat_24(date.getDatetime() + seoulZone) + '.log',
                maxFiles: 5,
                json: false
            }),
            new winston.transports.DailyRotateFile({
                level: 'error',
                colorize: true,
                timestamp: function() { return date.getBarDatetimeMsFormat_24(date.getDatetime() + seoulZone); },
                name: 'error-file',
                filename: this._logDir + '/error.',
                datePattern: date.getDateFormat_24(date.getDatetime() + seoulZone) + '.log',
                maxFiles: 5,
                json: false
            })
        ]
        // , exceptionHandlers: [
        //     // Console transport
        //     new (winston.transports.Console)(),
        //
        //     // new winston.transports.File({
        //     new (require('winston-daily-rotate-file'))({
        //         filename: logDir + '_exceptions.log.',
        //         datePattern: 'yyyyMMdd',
        //         maxFiles: 2
        //     })
        // ]
    });

    if(!(config.conf.log.fileDebug || true))
        this._logger.remove('debug-file');

    if(!(config.conf.log.fileError || true))
        this._logger.remove('error-file');
};

LogModule.prototype.debug = function(){
    this._logger.debug.apply(this._logger, Array.prototype.slice.call(arguments));
};

LogModule.prototype.info = function(){
    this._logger.info.apply(this._logger, Array.prototype.slice.call(arguments));
};

LogModule.prototype.notice = function(){
    this._logger.notice.apply(this._logger, Array.prototype.slice.call(arguments));
};

LogModule.prototype.warn = function(){
    this._logger.warn.apply(this._logger, Array.prototype.slice.call(arguments));
};

LogModule.prototype.error = function(){
    this._logger.error.apply(this._logger, Array.prototype.slice.call(arguments));
};

LogModule.prototype.crit = function(){
    this._logger.crit.apply(this._logger, Array.prototype.slice.call(arguments));
};

LogModule.prototype.alert = function(){
    this._logger.alert.apply(this._logger, Array.prototype.slice.call(arguments));
};

LogModule.prototype.emerg = function(){
    this._logger.emerg.apply(this._logger, Array.prototype.slice.call(arguments));
};

module.exports = new LogModule();