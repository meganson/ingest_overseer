/**
 * Created by megan on 2017-06-23.
 */

module.exports = {
    name: 'sp_SetReingestJobC001_V3',
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