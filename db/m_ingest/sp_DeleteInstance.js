/**
 * Created by megan on 2017-03-02.
 */

module.exports = {
    name: 'sp_DeleteInstance',
    setParameters: function (instanceRequestId) {
        return [
            {
                name: 'instanceRequestId',
                value: instanceRequestId
            }
        ];
    },
    getResult: function(rows){

    }
};