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

// TODO highcharts
  });