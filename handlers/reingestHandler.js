/**
 * Created by megan on 2017-02-20.
 */

var megan = require('modules');
var async = require('async');
var daemonConf = megan.config.conf.daemon;

exports.init = function(){
    this._interval = '';
    this.start();
};

exports.start = function(){
    var self = this;
    megan.log.notice('start Reingest.....');
    this._interval = setInterval(function(){
        self.reingest(function(rows){
            megan.log.info('doing reingest..', rows);
        });
    }, (daemonConf.reingestTimeMinutes || 10) * 60 * 1000);

    setInterval(function(){
        self.reingestC001(function(){
            megan.log.info('doing reingest C001..');
        });
    }, (daemonConf.C001IntervalMinutes || 1) * 60 * 1000);
};

exports.stop = function(){
    clearInterval(this._interval);
};

exports.reingest = function(callback){
    var params = megan.sp_ReingestJob.setParameters(daemonConf.reingestLimitCnt);
    megan.db.execute(megan.sp_ReingestJob.name, params, function(err, rows){
        callback(rows);
    });
};

exports.reingestC001 = function(callback){
    var params = megan.sp_GetReingestJobC001.setParameters(daemonConf.reingestLimitCnt);
    megan.db.execute(megan.sp_GetReingestJobC001.name, params, function(err, rows){
        if(!err){
            if(rows[0][0].result == 0){ // 프로시져 성공
                async.each(rows[1], function(e, cb){
                    if(!megan.common.isNull(e.downloadUrl)){
                        megan.http.request(e.downloadUrl, 'HEAD', '', 10 * 6000, function(err, statusCode, data){
                            if(!err && statusCode < 300){
                                params = megan.sp_SetReingestJobC001.setParameters(e.mediaId);
                                megan.db.execute(megan.sp_SetReingestJobC001.name, params, function(err, rows){
                                    cb();
                                });
                            }
                        });
                    }
                }, function(err){
                    callback();
                });
            }
        }
    });
};