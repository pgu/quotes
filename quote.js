angular.module('quotesApp', [])
  .controller('QuotesController', function ($window, $scope) {

    $scope.quotes = [];

    var myEventSource = streamdataio.createEventSource('https://test_quotes_ftw.apispark.net/v1/quotes/', 'MzlkYTVkYTMtYzRiOS00OGVlLThhOGEtOWY1YjJjY2U2ZDlh');

    myEventSource.onData(function (data) {
      console.log('init')
      console.log(data);

      $scope.quotes = data;

      var chart = $('#container').highcharts();
      console.info('15', 'chart', chart);
      _.each($scope.quotes, function (quote) {
        chart.series[ 0 ].addPoint(getOhlc(quote));
      });


      $scope.$applyAsync();

    }).onPatch(function (data) {
      console.log('update')
      console.log(data);

      var updates = data;
      _.each(updates, function (update) {

        var parts = update.path.split('/');
        parts.shift();
        var idx = _.first(parts);
        var attribute = _.last(parts);

        var quote = $scope.quotes[ idx ];
        quote[ attribute ] = update.value;
        $scope.$applyAsync();

      });

      var chart = $('#container').highcharts();
      chart.series[ 0 ].addPoint(getOhlc($scope.quotes[ 0 ]));

    }).onError(function (data) {
      console.log('error')
      console.log(data);
    }).onOpen(function (data) {
      console.log('open')
      console.log(data);
    });

    myEventSource.open();

    //ohlc.push([
    //  data[i][0], // the date
    //  data[i][1], // open
    //  data[i][2], // high
    //  data[i][3], // low
    //  data[i][4] // close
    //]);
    function getOhlc (quote) {
      return _.map([
        moment.utc(quote.tradetime, 'MM/DD/YYYY HH:mm:SS').valueOf(),
        quote.priceopen,
        quote.high,
        quote.low,
        quote.closeyest
      ], _.parseInt);
    }

    //volume.push([
    //  data[i][0], // the date
    //  data[i][5] // the volume
    //]);
    function getVolume (quote) {
      return _.map([
        moment.utc(quote.tradetime, 'MM/DD/YYYY HH:mm:SS').valueOf(),
        quote.volume
      ], _.parseInt);
    }

    // set the allowed units for data grouping
    var groupingUnits = [ [
      'week',                         // unit name
      [ 1 ]                             // allowed multiples
    ], [
      'month',
      [ 1, 2, 3, 4, 6 ]
    ] ];

    $('#container').highcharts('StockChart', {

      rangeSelector: {
        selected: 1
      },

      title: {
        text: 'AAPL Historical'
      },

      yAxis: [ {
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'OHLC'
        },
        height: '60%',
        lineWidth: 2
      }, {
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Volume'
        },
        top: '65%',
        height: '35%',
        offset: 0,
        lineWidth: 2
      } ],

      series: [ {
        type: 'candlestick',
        name: 'AAPL',
        data: [],
        dataGrouping: {
          units: groupingUnits
        }
      },
        {
          type: 'column',
          name: 'Volume',
          data: [],
          yAxis: 1,
          dataGrouping: {
            units: groupingUnits
          }
        } ]
    });

  });