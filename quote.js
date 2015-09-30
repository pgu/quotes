angular.module('quotesApp', [])
  .controller('QuotesController', function ($window, $scope, $timeout) {

    $scope.quotes = [];
    $scope.quoteState = {};

    var bg2fontCss = {
      'bg-up': 'font-up',
      'bg-down': 'font-down'
    };

    function getPriceChartId (quoteId) {
      return $('#price-chart-' + quoteId);
    }

    function getVolumeChartId (quoteId) {
      return $('#volume-chart-' + quoteId);
    }

    function getPriceSerie (quoteId) {
      return _.first(getPriceChartId(quoteId).highcharts().series);
    }

    function getVolumeSerie (quoteId) {
      return _.first(getVolumeChartId(quoteId).highcharts().series);
    }

    var myEventSource = streamdataio.createEventSource('https://test_quotes_ftw.apispark.net/v1/quotes/', 'MzlkYTVkYTMtYzRiOS00OGVlLThhOGEtOWY1YjJjY2U2ZDlh');

    myEventSource.onData(function (quotes) {
      console.log('init')
      console.log(quotes);

      $scope.quotes = quotes;

      _.each($scope.quotes, function (quote) {

        initPriceChart(quote, [ getPricePoint(quote) ]);
        initVolumeChart(quote, [ getVolumePoint(quote) ]);

      });

      $scope.$applyAsync();

    }).onPatch(function (updates) {
      console.log('update')
      console.log(updates);

      var oldQuotes = _.reduce(updates, function (oldItems, update) {

        var path = parsePath(update.path);
        var quote = $scope.quotes[ path.idx ];

        oldItems[ quote.id ] = _.cloneDeep(quote);
        return oldItems;
      }, {});

      var updatedQuotes = _.uniq(_.reduce(updates, function (updatedItems, update) {

        var path = parsePath(update.path);

        var quote = $scope.quotes[ path.idx ];
        quote[ path.attribute ] = update.value;

        if (!_.has($scope.quoteState, quote.id)) {
          $scope.quoteState[ quote.id ] = {};
        }

        if (path.attribute !== 'tradetime') {

          var oldValue = parseFloat(oldQuotes[ quote.id ][ path.attribute ], 10);
          var newValue = parseFloat(quote[ path.attribute ], 10);

          var bgCss = newValue > oldValue ? 'bg-up' : 'bg-down';
          $scope.quoteState[ quote.id ][ path.attribute ] = bgCss;

          $timeout(function () {
            var bgCss = $scope.quoteState[ quote.id ][ path.attribute ];

            $scope.quoteState[ quote.id ][ path.attribute ] = bg2fontCss[ bgCss ];
          }, 1000);

        }

        updatedItems.push(quote);
        return updatedItems;

      }, []));


      // update charts
      _.each(updatedQuotes, function (updatedQuote) {

        getPriceSerie(updatedQuote.id).addPoint(getPricePoint(updatedQuote));
        getVolumeSerie(updatedQuote.id).addPoint(getVolumePoint(updatedQuote));

      });

      $scope.$applyAsync();

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

    function _initPriceChart (quote, data) {
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

    }

    function _initVolumeChart (quote, data) {

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

    }

    function initChart (fnChart) {
      return function (quote, data) {

        $timeout(function () {
          return fnChart(quote, data);
        }, 300);

      };
    }

    var initPriceChart = initChart(_initPriceChart);
    var initVolumeChart = initChart(_initVolumeChart);

    function parsePath (path) {

      var parts = path.split('/'); // '/0/price'
      parts.shift(); // [ "", "0", "price" ] -> [ "0", "price" ]

      return {
        idx: _.first(parts),
        attribute: _.last(parts)
      };
    }

    $scope.keys = function (quote) {
      return _.filter(_.keys(quote), function (key) {
        var startsWith$$ = key.indexOf('$$') === 0;
        return !startsWith$$;
      });
    };

  });