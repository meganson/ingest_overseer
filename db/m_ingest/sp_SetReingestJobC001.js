/**
 * Created by megan on 2017-03-03.
 */

module.exports = {
    name: 'sp_SetReingestJobC001',
    setParameters: function (mediaId) {
        return [
            {
                name: 'mediaId',
                value: mediaId
            }
        ];
    },
    getResult: function(rows){

    }
};