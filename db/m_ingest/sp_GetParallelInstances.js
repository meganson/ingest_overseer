/**
 * Created by megan on 2017-04-19.
 */

module.exports = {
    name: 'sp_GetParallelInstances',
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