# maf/Chain

## usage

```js
var Chain = require('maf/Chain');

var ch = new Chain({
    steps: {
        viewId: null,

        dateRange: function (data, f, t) {
            data['dateRanges'].push({
                startDate: f,
                endDate: t
            });
        },

        dateRanges: null
    },
    defaults: {
        viewId: '100',
        dateRanges: []
    }
});

ch.viewId(200);

ch.dateRange('1', '2').dateRange('3', '4');

// ch.dateRanges([{startDate: '5', endDate: '6'}]);

ch.onExec(function (data) {
    console.log(data);
});

ch.exec();
```