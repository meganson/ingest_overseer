/**
 * Created by megan on 2017-01-16.
 */

var megan = require('modules');

module.exports = {
    reingestJob: function(callback){
        var params = megan.sp_ReingestJob.setParameters(megan.config.conf.daemon.reingestLimitCnt);
        megan.db.execute(megan.sp_ReingestJob.name, params, function(err, rows){
            callback(rows);
        });
    },
    observer: function(callback){
        var self = this;
        var data;
        megan.db.execute(megan.sp_StoppedWorker.name, [], function(err, rows) {
            var stoppedWorkerId = rows[0][0].stoppedWorkerId, waitingWorkerId = rows[0][0].waitingWorkerId;
            if (!megan.common.isNull(stoppedWorkerId)) {
                // 중지된 워커 존재시 가동
                megan.aws.startInstance(stoppedWorkerId, function (err) {
                    data = {'workerId': stoppedWorkerId, 'workerStatus': 'W'};
                    if (!err) self.fn_executeWorkerReport(data);
                });
            }else if (!megan.common.isNull(waitingWorkerId)) {
                // 작업 리스트 0개 && 대기 중 워커 존재시 종료
                megan.aws.stopInstance(waitingWorkerId, function (err) {
                    data = {'workerId': waitingWorkerId, 'workerStatus': 'S'};
                    if (!err) self.fn_executeWorkerReport(data);
                });
            }
            callback(rows);
        });
    },
    rereportJob: function(callback){
        var self = this;
        var params = megan.sp_GetFailedReportJob.setParameters(megan.config.conf.daemon.rereportLimitCnt);
        megan.db.execute(megan.sp_GetFailedReportJob.name, params, function(err, rows){
            // 실패 재보고 (pooq api)
            if(rows[0].length > 0) self.fn_ReportPooq(rows[0]);
            callback();
        });
    },
    fn_executeWorkerReport: function(data){
        var params = megan.sp_ReportWorker.setParameters(data);
        megan.db.execute(megan.sp_ReportWorker.name, params, function(err, rows){});
    },
    fn_ReportPooq: function(rows){
        var self = this;
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
                'drmType': rows[0].drmType,
                'isAdaptive': (rows[0].isAdaptive == 0) ? 'N' : 'Y',
                'videoCodec': rows[0].videoCodec,
                'transcodingType': rows[0].transcodingType
            };
            var pooqConf = megan.config.conf.pooq;
            megan.http.request('http', pooqConf.host, 80, rows[0].reportApiUrl+"/"+rows[0].channelId, 'POST', json, function (data) {
                if(megan.common.isJsonString(data)){
                    var responseObject;
                    responseObject = JSON.parse(data);
                    if(responseObject.message == 'success') {
                        if(responseObject.returnCode == '200'){
                            if(responseObject.result.status == 'OK'){
                                params = {'reportId': rows[0].reportId, 'reportState': 'S'};
                                self.fn_executeReportState(params);
                                megan.log.debug('pooq api report success', responseObject);
                                return;
                            }
                        }
                    }
                }

                params = {'reportId': rows[0].reportId, 'reportState': 'F'};
                self.fn_executeReportState(params);
                megan.log.error('pooq api report fail', data);
            });
        }
    },
    fn_executeReportState: function(data){
        var params = megan.sp_SetReportState.setParameters(data);
        megan.db.execute(megan.sp_SetReportState.name, params, function(err, rows){});
    }
};