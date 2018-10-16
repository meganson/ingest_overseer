/**
 * Created by megan on 2017-01-16.
 */

var megan = require('modules');
var daemonConf = megan.config.conf.daemon;
var triggerController = require('controllers/triggerController');

exports.startReingest = function(){
    megan.log.notice('start Reingest.....');
    setInterval(function(){
        triggerController.reingestJob(function(rows){
            megan.log.info('reingest result :', rows);
        });
    }, (daemonConf.reingestTimeMinutes || 1) * 60 * 1000);
};

exports.startObserve = function(){
    megan.log.notice('start Observing.....');
    setInterval(function(){
        triggerController.observer(function(rows){
            megan.log.info('observer worker result :', rows);
        });
    }, (daemonConf.observeTimeMinutes || 1) * 60 * 1000);
};

exports.startRereport = function(){
    megan.log.notice('start Rerepoting.....');
    setInterval(function(){
        triggerController.rereportJob(function(rows){
            megan.log.info('rereport result :', rows);
        });
    }, (daemonConf.rereportTimeMinuts || 1) * 60 * 1000);
};
