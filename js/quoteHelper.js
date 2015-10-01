angular.module('quotesApp')
  .factory('quoteHelper', function () {


    var service = {
      updateQuotes: updateQuotes,
      copyQuotesToUpdate: copyQuotesToUpdate,
      getPricePoint: getPricePoint,
      getVolumePoint: getVolumePoint,
      parsePath: parsePath
    };
    return service;

    function parsePath (path) {

      var parts = path.split('/'); // '/0/price'
      parts.shift(); // [ "", "0", "price" ] -> [ "0", "price" ]

      return {
        idx: _.first(parts),
        key: _.last(parts)
      };
    }

    function getVolumePoint (quote) {
      return [
        quote.tradetime,
        _.parseInt(quote.volume)
      ];
    }

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

    function getQuotesToUpdate (updates, quotes) {

      return _(updates)
        .pluck('path')
        .map(parsePath)
        .pluck('idx')
        .uniq()
        .map(function (idx) {
          return quotes[ idx ];
        });

    }

    function updateQuotes (updates, quotes) {

      _.each(updates, function (update) {

        var path = parsePath(update.path);
        quotes[ path.idx ][ path.key ] = update.value;

      });

      return getQuotesToUpdate(updates, quotes)
        .indexBy('id')
        .value();
    }

    function copyQuotesToUpdate (updates, quotes) {

      return getQuotesToUpdate(updates, quotes)
        .map(_.cloneDeep)
        .indexBy('id')
        .value();
    }

  });