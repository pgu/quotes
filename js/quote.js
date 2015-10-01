angular.module('quotesApp')
  .controller('QuotesController', function ($window, $scope, $timeout,
                                            STREAMDATAIO_KEY, quoteHelper, chartHelper) {

    $scope.quotes = [];
    $scope.quoteState = {};
    $scope.quoteSelection = {};
    $scope.attributeSelection = {};

    var ctrl = this;
    ctrl.onData = onData;
    ctrl.onPatch = onPatch;
    ctrl.onError = onError;
    ctrl.onOpen = onOpen;

    ctrl.bg2fontCss = {
      'bg-up': 'font-up',
      'bg-down': 'font-down'
    };

    var myEventSource = streamdataio.createEventSource('https://test_quotes_ftw.apispark.net/v1/quotes/', STREAMDATAIO_KEY);

    myEventSource
      .onData(ctrl.onData)
      .onPatch(ctrl.onPatch)
      .onError(ctrl.onError)
      .onOpen(ctrl.onOpen);

    myEventSource.open();

    $scope.keys = function (quote) {
      return _.filter(_.keys(quote), function (key) {
        var startsWith$$ = key.indexOf('$$') === 0;
        return !startsWith$$;
      });
    };

    function onData (quotes) {
      console.log('onData', quotes)

      $scope.quotes = quotes;

      if (!_.isEmpty($scope.quotes)) {

        _.each($scope.keys(_.first($scope.quotes)), function (key) {
          $scope.attributeSelection[ key ] = true;
        });

      }

      _.each($scope.quotes, function (quote) {

        $scope.quoteSelection[ quote.id ] = true;

        chartHelper.initPriceChart(quote, [ quoteHelper.getPricePoint(quote) ]);
        chartHelper.initVolumeChart(quote, [ quoteHelper.getVolumePoint(quote) ]);

      });

      $scope.$applyAsync();
    }

    function getNumValue (quote, attribute) {
      return parseFloat(quote[ attribute ], 10);
    }

    function onPatch (updates) {

      console.log('onPatch', updates)

      var oldQuotes = quoteHelper.copyQuotesToUpdate(updates, $scope.quotes);
      var updatedQuotes = quoteHelper.updateQuotes(updates, $scope.quotes);

      _.each(updatedQuotes, function (updatedQuote) {
        $scope.quoteState[ updatedQuote.id ] = {};
      });

      _(updates)
        .filter(function (update) {
          var path = quoteHelper.parsePath(update.path);
          return path.attribute !== 'tradetime';
        })
        .each(function (update) {

          var path = quoteHelper.parsePath(update.path);
          var quoteId = $scope.quotes[ path.idx ].id;
          var att = path.attribute;

          var oldValue = getNumValue(oldQuotes[ quoteId ], att);
          var newValue = getNumValue(updatedQuotes[ quoteId ], att);

          var bgCss = newValue > oldValue ? 'bg-up' : 'bg-down';
          $scope.quoteState[ quoteId ][ att ] = bgCss;

          $timeout(function () {
            var bgCss = $scope.quoteState[ quoteId ][ att ];
            $scope.quoteState[ quoteId ][ att ] = ctrl.bg2fontCss[ bgCss ];
          }, 1000);

        })
        .value();


      // update charts
      _.each(updatedQuotes, function (updatedQuote) {

        chartHelper.getPriceSerie(updatedQuote.id).addPoint(quoteHelper.getPricePoint(updatedQuote));
        chartHelper.getVolumeSerie(updatedQuote.id).addPoint(quoteHelper.getVolumePoint(updatedQuote));

      });

      $scope.$applyAsync();

    }

    function onError (data) {
      console.log('error', data);
    }

    function onOpen (data) {
      console.log('open', data)
    }

  });