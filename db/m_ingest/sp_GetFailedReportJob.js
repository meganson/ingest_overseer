/**
 * Created by megan on 2017-01-06.
 */

module.exports = {
    name: 'sp_GetFailedReportJob',
    setParameters: function (limitCnt) {
        return [
            {
                name: 'limitCnt',
                value: limitCnt || 10
            }
        ];
    },
    getResult: function(rows){

    }
};