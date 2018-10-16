/**
 * Created by megan on 2017-03-03.
 */

module.exports = {
    name: 'sp_GetReingestJobC001',
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