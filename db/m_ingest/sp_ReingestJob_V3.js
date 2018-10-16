/**
 * Created by megan on 2017-06-13.
 */

module.exports = {
    name: 'sp_ReingestJob_V3',
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