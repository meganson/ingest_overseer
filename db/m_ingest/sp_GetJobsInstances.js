/**
 * Created by megan on 2017-03-09.
 */

module.exports = {
    name: 'sp_GetJobsInstances',
    setParameters: function (workerType) {
        return [
            {
                name: 'workerType',
                value: workerType
            }
        ];
    },
    getResult: function(rows){

    }
};