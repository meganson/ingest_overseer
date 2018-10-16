/**
 * Created by megan on 2017-02-23.
 */

module.exports = {
    name: 'sp_GetInstances',
    setParameters: function (requestType, workerState) {
        return [
            {
                name: 'requestType',
                value: requestType
            },
            {
                name: 'workerState',
                value: workerState
            }
        ];
    },
    getResult: function(rows){

    }
};
