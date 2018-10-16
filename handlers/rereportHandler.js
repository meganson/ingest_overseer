/**
 * Created by megan on 2017-02-20.
 */

var megan = require('modules');
var daemonConf = megan.config.conf.daemon;

exports.init = function(){
    this._interval = '';
    this.start();
};

exports.start = function(){
    var self = this;
    megan.log.notice('start Rerepoting.....');
    this._interval = setInterval(function(){
        self.rereport(function(rows){
            megan.log.info('doing rereport..', rows);
        });
    }, (daemonConf.rereportTimeMinutes || 0.1) * 60 * 1000);
};

exports.stop = function(){
    clearInterval(this._interval);
};

exports.rereport = function(callback){
    var params = megan.sp_GetFailedReportJob.setParameters(megan.config.conf.daemon.rereportLimitCnt);
    megan.db.execute(megan.sp_GetFailedReportJob.name, params, function(err, rows){
        // 실패 재보고 (pooq api)
        if(rows[0].length > 0) fn_ReportPooq(rows[0]);
        callback(rows);
    });

    function fn_ReportPooq(rows){
        var params;
        // 무조건 보고
        // 재입수 시 파일 없는 경우 성공으로 보고하지만 코멘트 존재
        if(!megan.common.isNull(rows[0].reportApiUrl)){
            var json = {
                // 'channelId': rows[0].channelId,
                'contentId': rows[0].contentId,
                'cornerId': rows[0].cornerId,
                'bitrate': rows[0].bitrate,
                'acquire': rows[0].acquire,
                'comment': rows[0].comment,
                'playTime': rows[0].playtime,
                'fileSize': rows[0].filesize,
                'mediaVersion': rows[0].mediaVersion,
                'transcodingType': rows[0].transcodingType,
                'drmType': rows[0].drmType
                // 'isAdaptive': (rows[0].isAdaptive == 0) ? 'N' : 'Y',
                // 'videoCodec': rows[0].videoCodec
            };
            // var pooqConf = megan.config.conf.pooq;
            megan.http.request(rows[0].reportApiUrl+'/'+ rows[0].channelId, 'POST', json, 5 * 60 * 1000, function (err, statusCode, data) {
                if(!err && statusCode == 200 && megan.common.isJsonString(data)){
                    var responseObject;
                    responseObject = JSON.parse(data);
                    if(responseObject.message == 'success' && responseObject.returnCode == '200' && responseObject.result.status == 'OK') {
                        params = {'reportId': rows[0].reportId, 'reportState': 'S'};
                        fn_executeReportState(params);
                        megan.log.debug('pooq api report success', responseObject);
                        return;
                    }
                }

                params = {'reportId': rows[0].reportId, 'reportState': 'F'};
                fn_executeReportState(params);
                megan.log.error('pooq api report fail', data);
            });
        }
    }

    function fn_executeReportState(data){
        var params = megan.sp_SetReportState.setParameters(data);
        megan.db.execute(megan.sp_SetReportState.name, params, function(err, rows){});
    }
};