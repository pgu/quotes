angular.module('quotesApp')
  .factory('chartHelper', function ($timeout) {

    var initChart = initChart;
    var _initPriceChart = _initPriceChart;
    var _initVolumeChart = _initVolumeChart;

    var service = {
      initPriceChart: initChart(_initPriceChart),
      initVolumeChart: initChart(_initVolumeChart),
      getPriceSerie: getPriceSerie,
      getVolumeSerie: getVolumeSerie
    };

    return service;

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

  });