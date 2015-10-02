angular.module('quotesApp')
  .controller('QuoteController', function ($window, $scope, $timeout,
                                           STREAMDATAIO_KEY, quoteHelper, chartHelper) {

    $scope.quotes = [];
    $scope.quoteState = {};
    $scope.quoteSelection = {};
    $scope.keySelection = {};
    $scope.getKeys = getKeys;
    $scope.goToTop = goToTop;

    var ctrl = this;
    ctrl.onData = onData;
    ctrl.onPatch = onPatch;
    ctrl.onError = onError;
    ctrl.onOpen = onOpen;
    ctrl.storeQuoteSelection = storeQuoteSelection;
    ctrl.storeKeySelection = storeKeySelection;
    ctrl.initQuoteSelection = initQuoteSelection;
    ctrl.initKeySelection = initKeySelection;
    ctrl.updateQuotesTableWidth = updateQuotesTableWidth;

    ctrl.bg2fontCss = {
      'bg-up': 'font-up',
      'bg-down': 'font-down'
    };

    ctrl.QUOTE_LS = 'quoteSelection';
    ctrl.KEY_LS = 'keySelection';

    var myEventSource = streamdataio.createEventSource('https://test_quotes_ftw.apispark.net/v1/quotes/', STREAMDATAIO_KEY);

    myEventSource
      .onData(ctrl.onData)
      .onPatch(ctrl.onPatch)
      .onError(ctrl.onError)
      .onOpen(ctrl.onOpen);

    myEventSource.open();

    $timeout(function () {
      ctrl.updateQuotesTableWidth();
      $(window).on('resize', ctrl.updateQuotesTableWidth);
    });

    function onData (quotes) {
      console.log('onData', quotes)

      $scope.quotes = quotes;

      ctrl.initQuoteSelection($scope.quotes, $scope.quoteSelection);
      ctrl.initKeySelection($scope.quotes, $scope.keySelection);


      _.each($scope.quotes, function (quote) {

        chartHelper.initPriceChart(quote, [ quoteHelper.getPricePoint(quote) ]);
        chartHelper.initVolumeChart(quote, [ quoteHelper.getVolumePoint(quote) ]);

      });

      $scope.$applyAsync();

      $timeout(function () {
        $('.scrollspy').scrollSpy();
      }, 300);
    }

    function getNumValue (quote, key) {
      return parseFloat(quote[ key ], 10);
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
          return path.key !== 'tradetime';
        })
        .each(function (update) {

          var path = quoteHelper.parsePath(update.path);
          var quoteId = $scope.quotes[ path.idx ].id;
          var key = path.key;

          var oldValue = getNumValue(oldQuotes[ quoteId ], key);
          var newValue = getNumValue(updatedQuotes[ quoteId ], key);

          var bgCss = newValue > oldValue ? 'bg-up' : 'bg-down';
          $scope.quoteState[ quoteId ][ key ] = bgCss;

          $timeout(function () {
            var bgCss = $scope.quoteState[ quoteId ][ key ];
            $scope.quoteState[ quoteId ][ key ] = ctrl.bg2fontCss[ bgCss ];
          }, 1000);

        })
        .value();


      // update charts
      _.each(updatedQuotes, function (updatedQuote) {

        var MAXIMUM_POINTS = 5;

        var priceSerie = chartHelper.getPriceSerie(updatedQuote.id);
        var shouldShiftPrices = _.size(priceSerie.data) > MAXIMUM_POINTS;
        priceSerie.addPoint(quoteHelper.getPricePoint(updatedQuote), true, shouldShiftPrices);


        var volumeSerie = chartHelper.getVolumeSerie(updatedQuote.id);
        var shouldShiftVolumes = _.size(volumeSerie.data) > MAXIMUM_POINTS;
        volumeSerie.addPoint(quoteHelper.getVolumePoint(updatedQuote), true, shouldShiftVolumes);

      });

      $scope.$applyAsync();

    }

    function onError (data) {
      console.log('onError', data);
    }

    function onOpen (data) {
      console.log('onOpen', data)
    }

    function storeQuoteSelection (newValue) {
      $window.localStorage.setItem(ctrl.QUOTE_LS, JSON.stringify(newValue));
    }

    function storeKeySelection (newValue) {
      $window.localStorage.setItem(ctrl.KEY_LS, JSON.stringify(newValue));
    }

    function initQuoteSelection (quotes, quoteSelection) {

      _.each(quotes, function (quote) {
        quoteSelection[ quote.id ] = true;
      });

      $timeout(function () {

        var selectionFromStorage = $window.localStorage.getItem(ctrl.QUOTE_LS);

        if (_.isEmpty(selectionFromStorage)) {
          storeQuoteSelection(quoteSelection);

        } else {
          var selection = JSON.parse(selectionFromStorage);
          _.merge(quoteSelection, selection);
        }

        $scope.$watch('quoteSelection', ctrl.storeQuoteSelection, true);

      }, 500);

    }

    function initKeySelection (quotes, keySelection) {

      if (_.isEmpty(quotes)) {
        return;
      }

      var first8Keys = _.take($scope.getKeys(_.first(quotes)), 8);

      _.each(first8Keys, function (key) {
        keySelection[ key ] = true;
      });

      $timeout(function () {

        var selectionFromStorage = $window.localStorage.getItem(ctrl.KEY_LS);

        if (_.isEmpty(selectionFromStorage)) {
          storeKeySelection(keySelection);

        } else {
          var selection = JSON.parse(selectionFromStorage);
          _.merge(keySelection, selection);
        }

        $scope.$watch('keySelection', ctrl.storeKeySelection, true);

      }, 500);

    }

    function getKeys (quote) {
      return _.filter(_.keys(quote), function (key) {
        var startsWith$$ = key.indexOf('$$') === 0;
        return !startsWith$$;
      });
    }

    function updateQuotesTableWidth () {
      $('#quotesTableContainer').width($('#quoteDataContainer').width());
    }

    function goToTop () {
      $('html, body').animate({ scrollTop: 0 }, 'slow');
    }

  });