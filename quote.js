angular.module('quotesApp', [])
  .controller('QuotesController', function ($window, $scope) {

    $scope.quotes = [];

    var myEventSource = streamdataio.createEventSource('https://test_quotes_ftw.apispark.net/v1/quotes/', 'MzlkYTVkYTMtYzRiOS00OGVlLThhOGEtOWY1YjJjY2U2ZDlh');

    myEventSource.onData(function (data) {
      console.log('init')
      console.log(data);

      $scope.quotes = data;
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

        $scope.quotes[ idx ][ attribute ] = update.value;
        $scope.$applyAsync();
      });

    }).onError(function (data) {
      console.log('error')
      console.log(data);
    }).onOpen(function (data) {
      console.log('open')
      console.log(data);
    });

    myEventSource.open();

    $('#container').highcharts('StockChart', {


      title: {
        text: 'GOOG stock price by minute'
      },

      subtitle: {
        text: 'Using ordinal X axis'
      },

      xAxis: {
        gapGridLineWidth: 0
      },

      rangeSelector : {
        buttons : [{
          type : 'hour',
          count : 1,
          text : '1h'
        }, {
          type : 'day',
          count : 1,
          text : '1D'
        }, {
          type : 'all',
          count : 1,
          text : 'All'
        }],
        selected : 1,
        inputEnabled : false
      },

      series : [{
        name : 'GOOG',
        type: 'area',
        data : data,
        gapSize: 5,
        tooltip: {
          valueDecimals: 2
        },
        fillColor : {
          linearGradient : {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops : [
            [0, Highcharts.getOptions().colors[0]],
            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
          ]
        },
        threshold: null
      }]
    });

  });