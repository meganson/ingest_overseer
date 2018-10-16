/**
 * Created by megan on 2017-01-06.
 */

module.exports = {
    name: 'sp_SetReportState',
    setParameters: function (data) {
        return [
            {
                name: 'reportId',
                value: data.reportId
            },
            {
                name: 'reportState',
                value: data.reportState
            }
        ];
    },
    getResult: function(rows){

    }
};