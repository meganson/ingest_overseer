/**
 * Created by megan on 2017-07-05.
 */

var async = require('async');
var megan = require('modules');
var conf = megan.config.conf;

exports.init = function(){
    // aws api 호출 제어 시간 초기화
    this._intervalControl = conf.overseer_v2.intervalMinutes;
    this._interval = '';
    this._workerType = 'PP';
    this._instanceType = [];
    this._instanceType.push('c4.xlarge');
    this.start();
};

exports.start = function(){
    var self = this;
    megan.log.notice('start Prepare Overseer.....');
    this._interval = setInterval(function(){
        self.prepare();
    }, (this._intervalControl || 1) * 60 * 1000);
};

exports.stop = function(){
    megan.log.notice('pause Prepare Overseer....');
    clearInterval(this._interval);
};

// 새로운 워커 감시 시스템( Type C )
exports.prepare = function(){
    megan.log.info('doing prepare overseer..');
    // spot instances request
    this.requestSpotInstances();
};

// spot instances request - jobs
exports.requestSpotInstances = function(){
    var self = this;

    var ec2 = conf.aws.ec2;
    var ami = conf.overseer_v2.imageId;
    var params = megan.sp_GetParallelInstances.setParameters(self._workerType);
    megan.db.execute(megan.sp_GetParallelInstances.name, params, function(err, rows){
        if(!err){   // 프로시져 에러 없음
            if(rows[0][0].result == 0){ // 쿼리 성공
                var jobCnt, wInstanceCnt, tInstanceCnt, spotCnt;
                jobCnt = wInstanceCnt = tInstanceCnt = spotCnt = 0;

                wInstanceCnt = rows[0][0].wInstanceCnt;
                tInstanceCnt = rows[0][0].tInstanceCnt;
                jobCnt = rows[0][0].jobCnt;
                ami = rows[0][0].ami;

                // ts가 대기 서버 보다 클 때 scale up
                if(jobCnt > wInstanceCnt){
                    // scale up
                    megan.log.notice('Prepare Spot Scale Up............');

                    // 가능 서버(m - t)
                    // 대기잡(ts)
                    spotCnt = conf.overseer_v2.prepare.max - tInstanceCnt;
                    if(spotCnt > jobCnt) spotCnt = jobCnt;
                    if(spotCnt > conf.daemon.onceSpotCnt) spotCnt = conf.daemon.onceSpotCnt;

                    if(spotCnt > 0){
                        fn_describeSpotPriceHistory(function(spot){
                            fn_requestSpotInstances(spotCnt, spot, function(arrSpotInstances){
                                var spotState = setInterval(function(){
                                    arrSpotInstances.forEach(function (e, idx, arr){
                                        fn_describeSpotInstanceRequest(e, idx, function(idx){
                                            arrSpotInstances = arrSpotInstances.slice(idx + 1, 1);
                                        });
                                    });
                                    if (arrSpotInstances.length == 0) {
                                        clearInterval(spotState);
                                        self.start();
                                    }
                                }, 0.5 * 60 * 1000);
                            });
                        });
                    }
                }else{
                    // scale down
                    megan.log.notice('Prepare Spot Scale Down............');

                    var waitServerCnt = rows[1].length;
                    if(waitServerCnt > 0){
                        var arrRequestId = [];
                        var arrInstanceId = [];

                        spotCnt = wInstanceCnt - jobCnt;
                        spotCnt = (spotCnt > waitServerCnt) ? waitServerCnt : spotCnt;
                        for(var i = 0; i < spotCnt; i++){
                            arrRequestId.push(rows[1][i].instanceRequestId);
                            arrInstanceId.push(rows[1][i].instanceId);
                        }

                        megan.log.debug('arrRequestId', arrRequestId);
                        megan.log.debug('arrInstanceId', arrInstanceId);
                        if(arrRequestId.length > 0){
                            fn_cancelSpotInstanceRequest(arrRequestId);
                            megan.aws.terminateInstance(arrInstanceId, function(err, data){});
                        }
                    }
                }
            }
        }
    });

    function fn_describeSpotPriceHistory(callback){
        // real time spot price
        var spot = {};
        spot.spotPrice = conf.overseer_v2.prepare.price;
        spot.instanceType = self._instanceType[0];
        spot.subnetId = ec2.spot_subnetId_a;

        var params = {
            EndTime: new Date,
            InstanceTypes: self._instanceType,
            ProductDescriptions: [
                'Linux/UNIX (Amazon VPC)',
                'Linux/UNIX'
            ],
            StartTime: new Date
        };

        megan.aws.describeSpotPriceHistory(params, function(err, data){
            if(!err){
                data.SpotPriceHistory.forEach(function(e, idx, arr){
                    if(spot.spotPrice > data.SpotPriceHistory[idx].SpotPrice){
                        spot.spotPrice = data.SpotPriceHistory[idx].SpotPrice;
                        spot.instanceType = data.SpotPriceHistory[idx].InstanceType;
                        spot.subnetId = (data.SpotPriceHistory[idx].AvailabilityZone === ec2.availabilityZone) ? ec2.spot_subnetId_a : ec2.spot_subnetId_c;
                    }
                });
            }
            callback(spot);
        });
    }

    function fn_requestSpotInstances(spotCnt, spot, callback){
        var params = {
            InstanceCount: spotCnt,
            LaunchSpecification: {
                "BlockDeviceMappings": ec2.blockDeviceMappings,
                ImageId: ami,
                InstanceType: spot.instanceType,
                KeyName: ec2.keyName,
                SubnetId: spot.subnetId,
                SecurityGroupIds: [
                    "sg-d2370abb",
                    "sg-fb8b8b92"
                ]
            },
            SpotPrice: (spot.spotPrice * ec2.spotPriceRate).toString(),
            Type: "one-time",
            ValidFrom: megan.date.addDateSeconds('s', 5),
            ValidUntil: megan.date.addDateSeconds('y', 1)
        };
        megan.log.debug(params);
        megan.aws.requestSpotInstances(params, function(err, data){
            if(!err){
                self.stop();
                callback(data.SpotInstanceRequests);
            }
        });
    }

    function fn_describeSpotInstanceRequest(e, idx, callback){
        megan.aws.describeSpotInstanceRequest(e.SpotInstanceRequestId, function(err, data){
            if(!err){
                var spotReq = data.SpotInstanceRequests[0];
                switch(spotReq.State){
                    case 'active':
                        // aws api 호출 제어 시간 초기화
                        self._intervalControl = conf.overseer_v2.intervalMinutes;
                        var instanceId = spotReq.InstanceId;
                        fn_createTags(instanceId);
                        megan.aws.describeInstance(instanceId, function(err, data){
                            var params = {
                                'spotFleetRequestId': spotReq.SpotInstanceRequestId,
                                'instanceId': instanceId,
                                'instanceType': spotReq.LaunchSpecification.InstanceType,
                                'instanceReqId': spotReq.SpotInstanceRequestId,
                                'instancePrice': spotReq.SpotPrice,
                                'workerIp': data.Reservations[0].Instances[0].PrivateIpAddress,
                                'workerType': self._workerType,
                                'workerState': 'W',
                                'requestType': 'spot'
                            };
                            params = megan.sp_InsertInstance.setParameters(params);
                            megan.db.execute(megan.sp_InsertInstance.name, params, function(err, rows){
                                if(!err) callback(idx);
                            });
                        });
                        break;
                    case 'open':
                        var arrRequestId = [spotReq.SpotInstanceRequestId];
                        switch(spotReq.Status.Code){
                            case 'not-scheduled-yet': case 'fulfilled': case 'pending-evaluation': case 'az-group-constraint':
                                break;
                            case 'placement-group-constraint': case 'capacity-not-available': case 'launch-group-constraint':
                                break;
                            default:
                                // 잦은 aws api 호출 제어
                                if(self._intervalControl < 10) self._intervalControl++;
                                megan.aws.cancelSpotInstanceRequest(arrRequestId, function(err, data){
                                    if(!err){
                                        megan.log.info(e.SpotInstanceRequestId, spotReq.State, spotReq.Status.Code);
                                        if(!err) callback(idx);
                                    }
                                });
                                break;
                        }
                        megan.log.info(e.SpotInstanceRequestId, 'waiting');
                        break;
                    case 'closed': case 'cancelled': case 'failed':
                        // 잦은 aws api 호출 제어
                        if(self._intervalControl < 10) self._intervalControl++;
                        megan.log.info(e.SpotInstanceRequestId, spotReq.State);
                        callback(idx);
                        break;
                    default:
                        break;
                }
                return;
            }
            callback(idx);
        });
    }

    function fn_createTags(instanceId){
        var tagParams = {
            Resources: [instanceId],
            Tags: [{
                Key: "Name",
                Value: conf.overseer_v2.prepare.tag
            }]
        };
        megan.aws.createTags(tagParams);
    }

    function fn_cancelSpotInstanceRequest(arrRequestId){
        megan.aws.cancelSpotInstanceRequest(arrRequestId, function(err, data){
            if (!err) {
                data.CancelledSpotInstanceRequests.forEach(function(e, idx, arr){
                    switch(e.State){
                        case 'cancelled':
                            var params = megan.sp_DeleteInstance.setParameters(e.SpotInstanceRequestId);
                            megan.log.debug(params);
                            megan.db.execute(megan.sp_DeleteInstance.name, params, function(err, rows){
                                megan.log.debug(rows);
                            });
                            break;
                        case 'active': case 'closed': case 'completed':
                            megan.log.debug(e.SpotInstanceRequestId, e.State);
                            break;
                        default:
                            break;
                    }
                });
            }
        });
    }
};