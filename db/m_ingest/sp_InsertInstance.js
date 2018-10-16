/**
 * Created by megan on 2017-02-23.
 */

module.exports = {
    name: 'sp_InsertInstance',
    setParameters: function (data) {
        return [
            {
                name: 'spotFleetRequestId',
                value: data.spotFleetRequestId
            },
            {
                name: 'instanceId',
                value: data.instanceId
            },
            {
                name: 'instanceType',
                value: data.instanceType
            },
            {
                name: 'instanceRequestId',
                value: data.instanceReqId
            },
            {
                name: 'instancePrice',
                value: data.instancePrice
            },
            {
                name: 'workerIp',
                value: data.workerIp
            },
            {
                name: 'workerType',
                value: data.workerType
            },
            {
                name: 'workerState',
                value: data.workerState
            },
            {
                name: 'requestType',
                value: data.requestType
            }
        ];
    },
    getResult: function(rows){

    }
};