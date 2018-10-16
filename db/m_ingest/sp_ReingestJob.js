/**
 * Created by megan on 2016-11-18.
 */

module.exports = {
    name: 'sp_ReingestJob',
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