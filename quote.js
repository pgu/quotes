angular.module('quotesApp', [])
  .controller('QuotesController', function ($window, $scope, $timeout) {

    $scope.quotes = [];

    function getPriceChartId (quoteId) {
      return $('#price-chart-' + quoteId);
    }

    function getPriceChart (quoteId) {
      return getPriceChartId(quoteId).highcharts();
    }

    function getVolumeChartId (quoteId) {
      return $('#volume-chart-' + quoteId);
    }

    function getVolumeChart (quoteId) {
      return getVolumeChartId(quoteId).highcharts();
    }

    var myEventSource = streamdataio.createEventSource('https://test_quotes_ftw.apispark.net/v1/quotes/', 'MzlkYTVkYTMtYzRiOS00OGVlLThhOGEtOWY1YjJjY2U2ZDlh');

    myEventSource.onData(function (data) {
      console.log('init')
      console.log(data);

      $scope.quotes = data;

      _.each($scope.quotes, function (quote) {

        initPriceChart(quote, [ getPricePoint(quote) ]);
        initVolumeChart(quote, [ getVolumePoint(quote) ]);

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

      //getPriceChart().series[ 0 ].addPoint(getPricePoint($scope.quotes[ 0 ]));
      //getVolumeChart().series[ 0 ].addPoint(getVolumePoint($scope.quotes[ 0 ]));

    }).onError(function (data) {
      console.log('error')
      console.log(data);
    }).onOpen(function (data) {
      console.log('open')
      console.log(data);
    });

    myEventSource.open();

    function getPoint (tradetime, valueAsString) {

      var point = [
        moment.utc(tradetime, 'MM/DD/YYYY HH:mm:SS').valueOf(),
        parseFloat(valueAsString, 10)
      ];

      return point;
    }

    function getPricePoint (quote) {
      return getPoint(quote.tradetime, quote.price);
    }

    function getVolumePoint (quote) {
      return [
        quote.tradetime,
        _.parseInt(quote.volume)
      ];
    }

    function initPriceChart (quote, data) {
      return $timeout(function () {

        getPriceChartId(quote.id).highcharts({

          chart: {
            type: 'spline',
            animation: Highcharts.svg, // don't animate in old IE
            marginRight: 10
          },
          title: {
            text: 'Quotes'
          },
          xAxis: {
            type: 'datetime',
            tickPixelInterval: 150
          },
          yAxis: {
            plotLines: [ {
              value: 0,
              width: 1,
              color: '#808080'
            } ]
          },
          legend: {
            enabled: false
          },
          exporting: {
            enabled: false
          },
          series: [
            {
              name: quote.id,
              data: data
            }
          ]

        });

      });
    }

    function initVolumeChart (quote, data) {

      return $timeout(function () {

        getVolumeChartId(quote.id).highcharts({
          chart: {
            type: 'column'
          },
          title: {
            text: 'Volumes'
          },
          xAxis: {
            type: 'category'
          },
          yAxis: {
            min: 0
          },
          legend: {
            enabled: false
          },
          series: [
            {
              name: quote.id,
              data: data
            }
          ]
        });

      });

    }

  });