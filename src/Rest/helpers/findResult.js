module.exports = function (result, requestQuery, api) {

    var metadata = {
        resultset: {
            count: result.docs.length,
            total: result.total,
            limit: requestQuery.limit,
            offset: requestQuery.offset
        }
    };

    var docs = api.clearSystemFields(result.docs);

    return {
        result: docs,
        metadata: metadata
    };
};
