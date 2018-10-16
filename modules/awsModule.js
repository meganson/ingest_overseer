/**
 * Created by megan on 2016-11-09.
 */

var AWS = require('aws-sdk');
var log = require('./logModule');
var config = require('./configModule');

var AwsModule = function(){
    // configure AWS security tokens

    // AWS.config.update({accessKeyId: process.env.AccessKeyID,
    //     secretAccessKey: process.env.SecretAccessKey});
    //
    // // Set your region for future requests.
    // AWS.config.update({region: 'us-west-1'});

    // AWS.config.update({accessKeyId: config.conf.aws.ec2.accessKeyId,
    //     secretAccessKey: config.conf.aws.ec2.secretAccessKey});
    //
    AWS.config.update({region: config.conf.aws.ec2.region});

    this._ec2 = new AWS.EC2();
};

AwsModule.prototype.runInstances = function(params, callback){
    this._ec2.runInstances(params, function(err, data){
        err ? log.error("Running ", err) : log.info("Running instance success", data);
        callback(err);
    });
};

AwsModule.prototype.startInstance = function(instanceId, callback){
    var params = {InstanceIds: [instanceId]};

    this._ec2.startInstances(params, function(err, data){
        err ? log.error("Starting ", err) : log.info("Starting instance success", data);
        callback(err);
    });
};

AwsModule.prototype.stopInstance = function(instanceId, callback){
    var params = {InstanceIds: [instanceId]};

    this._ec2.stopInstances(params, function(err, data){
        err ? log.error("Stopping ", err) : log.info("Stopping instance success", data);
        callback(err);
    });
};

AwsModule.prototype.rebootInstance = function(instanceId, callback) {
    var params = {InstanceIds: [instanceId]};

    this._ec2.rebootInstances(params, function (err, data) {
        err ? log.error("Rebooting ", err) : log.info("Rebooting instance success", data);
        callback(err);
    });
};

AwsModule.prototype.terminateInstance = function(instanceIds, callback){
    var params = {InstanceIds: instanceIds};

    this._ec2.terminateInstances(params, function(err, data){
        err ? log.error("Terminating ", err) : log.info("Terminating instance success", data);
        callback(err);
    });
};

AwsModule.prototype.describeInstance = function(instanceId, callback){
    var params = {InstanceIds: [instanceId]};

    this._ec2.describeInstances(params, function(err, data){
        err ? log.error("Describing ", err) : log.info("Describing instance success", data);
        callback(err, data);
    });
};

AwsModule.prototype.monitorInstance = function(instanceId, callback){
    var params = {InstanceIds: [instanceId]};

    this._ec2.monitorInstances(params, function(err, data){
        err ? log.error("Monitering ", err) : log.info("Monitering instance success", data);
        callback(err, data);
    });
};

AwsModule.prototype.requestSpotFleet = function(params, callback){
    this._ec2.requestSpotFleet(params, function(err, data){
        err ? log.error("Requesting spot fleet ", err) : log.info("Requesting spot instance fleet success", data);
        callback(err, data);
    });

    // var request = this._ec2.requestSpotFleet(params);
    //
    // request.
    //     on('success', function(res){
    //         console.log('suc', res);
    //         callback();
    //     }).
    //     on('error', function(res) {
    //         console.error('err', res);
    //     }).
    //     on('complete', function(res){
    //         console.log('com', res);
    //     }).
    //     send();
};

AwsModule.prototype.cancelSpotFleetRequest = function(spotFleetRequestId, callback){
    var params = {SpotFleetRequestIds: [spotFleetRequestId], TerminateInstances: true};

    this._ec2.cancelSpotFleetRequests(params, function(err, data){
        err ? log.error("Canceling spot fleet ", err) : log.info("Canceling spot instance fleet success", data);
        callback(err, data);
    });
};

AwsModule.prototype.describeSpotFleetInstance = function(spotFleetRequestId, callback){
    var params = {SpotFleetRequestId: spotFleetRequestId};

    this._ec2.describeSpotFleetInstances(params, function(err, data){
        err ? log.error("Describe spot fleet instance ", err) : log.info("Describe spot fleet instance success", data);
        callback(err, data);
    });
};

AwsModule.prototype.describeSpotFleetRequestHistory = function(spotFleetRequestId, callback){
    var params = {SpotFleetRequestId: spotFleetRequestId, StartTime: ''};

    this._ec2.describeSpotFleetRequestHistory(params, function(err, data){
        err ? log.error("Describe spot fleet request history ", err) : log.info("Describe spot fleet request history success", data);
        callback(err, data);
    });
};

AwsModule.prototype.describeSpotFleetRequest = function(spotFleetRequestId, callback){
    var params = {SpotFleetRequestIds: [spotFleetRequestId]};

    this._ec2.describeSpotFleetRequests(params, function(err, data){
        err ? log.error("Describe spot fleet request ", err) : log.info("Describe spot fleet request success", data);
        callback(err, data);
    });
};

AwsModule.prototype.modifySpotFleetRequest = function(spotFleetRequestId, targetCapacity, callback){
    var params = {SpotFleetRequestId: spotFleetRequestId, TargetCapacity: targetCapacity};

    this._ec2.modifySpotFleetRequest(params, function(err, data){
        err ? log.error("Modifying spot fleet request ", err) : log.info("Modifying spot fleet request success", data);
        callback(err, data);
    });
};

AwsModule.prototype.requestSpotInstances = function(params, callback){
    this._ec2.requestSpotInstances(params, function(err, data){
        err ? log.error("Requesting Spot ", err) : log.info("Requesting spot instance success", data);
        callback(err, data);
    });
};

AwsModule.prototype.cancelSpotInstanceRequest = function(spotInstanceRequestIds, callback){
    var params = {SpotInstanceRequestIds: spotInstanceRequestIds};

    this._ec2.cancelSpotInstanceRequests(params, function(err, data){
        err ? log.error("Canceling spot instance request ", err) : log.info("Canceling spot instance success", err, data);
        callback(err, data);
    });
};

AwsModule.prototype.describeSpotInstanceRequest = function(spotInstanceRequestId, callback){
    var params = {SpotInstanceRequestIds: [spotInstanceRequestId]};

    this._ec2.describeSpotInstanceRequests(params, function(err, data){
        err ? log.error("Describe spot instance request ", err) : log.info("Describe spot instance request success", data);
        callback(err, data);
    });
};

AwsModule.prototype.describeSpotPriceHistory = function(params, callback){
    this._ec2.describeSpotPriceHistory(params, function(err, data){
        err ? log.error("Describe spot price history ", err) : log.info("Describe spot price history success", data);
        callback(err, data);
    });
};

AwsModule.prototype.waitFor = function(state, params){
    this._ec2.waitFor(state, params, function(err, data){
        log.debug(data);
    });
};

AwsModule.prototype.createTags = function(params){
    this._ec2.createTags(params, function(err, data){
        err ? log.error("Create tags", err) : log.info("Create tags", data);
    });
};

module.exports = new AwsModule();