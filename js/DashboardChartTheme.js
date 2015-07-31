/**
 * https://www.sitepen.com/blog/2012/11/09/dojo-charting-dive-into-theming/
 * https://github.com/dojo/dojox/blob/master/charting/SimpleTheme.js
 */

define([
  "dojo/_base/array",
  "dojox/charting/Theme",
  "dojox/charting/themes/common",
  "dojox/gfx/gradutils"
], function (array, Theme, themes) {

  var gradient = Theme.generateGradient;

  /* fill settings for gradation */
  defaultFill = {type: "linear", space: "shape", x1: 0, y1: 0, x2: 0, y2: 100};

  /* create theme */
  themes.DashboardChartTheme = new Theme({

    /* customize the chart wrapper */
    chart: {
      fill: "transparent",
      stroke: {color: "transparent"},
      pageStyle: {
        backgroundColor: "transparent",
        color: "#fff"
      }
    },

    /* plotarea definition */
    plotarea: {fill: "transparent"},

    /* axis definition */
    axis: {
      stroke: { // the axis itself
        color: "#fff",
        width: 1.5
      },
      tick: { // used as a foundation for all ticks
        color: "#fff",
        width: 1.0,
        position: "center",
        font: "normal normal normal 7pt Helvetica, Arial, sans-serif",  // labels on axis
        fontColor: "#fff" // color of labels
      }
    },

    /* series definition */
    series: {
      stroke: {width: 1.0, color: "#fff"},
      outline: null, //{width: 1.0, color: "#fff"},
      font: "normal normal normal 8pt Helvetica, Arial, sans-serif",
      fontColor: "#fff"
    },

    /* marker definition */
    marker: {
      stroke: {width: 1.0, color: "#fff"},
      outline: {width: 1.0, color: "#fff"},
      font: "normal normal normal 8pt Helvetica, Arial, sans-serif",
      fontColor: "#fff"
    },

    /* series theme with gradations! */
    //light => dark
    //defaultFill object holds all of our gradation settings
    seriesThemes: [
      {fill: gradient(defaultFill, "#fff", "#f2f2f2")},
      {fill: gradient(defaultFill, "#d5ecf3", "#bed3d9")},
      {fill: gradient(defaultFill, "#9ff275", "#7fc25d")},
      {fill: gradient(defaultFill, "#81ee3b", "#60b32b")},
      {fill: gradient(defaultFill, "#4dcff4", "#277085")},
      {fill: gradient(defaultFill, "#666", "#333")}
    ],

    /* marker theme */
    markerThemes: [
      {fill: "#bf9e0a", stroke: {color: "#ecc20c"}},
      {fill: "#73b086", stroke: {color: "#95e5af"}},
      {fill: "#216071", stroke: {color: "#277084"}},
      {fill: "#c7212d", stroke: {color: "#ed2835"}},
      {fill: "#87ab41", stroke: {color: "#b6e557"}}
    ]
  });

  /**
   * USE THIS METHOD TO OVERRIDE THE COLORS AND THEMES
   *
   * @param themeColors
   */
  themes.DashboardChartTheme.setColors = function (themeColors) {

    // analogous,monochromatic,triadic,complementary,splitComplementary,compound,shades
    this.colors = Theme.defineColors({base: themeColors.accentColor, generator: "shades"});

    this.chart = {
      fill: themeColors.backgroundColor,
      stroke: {color: themeColors.backgroundColor},
      pageStyle: {
        backgroundColor: themeColors.backgroundColor,
        color: themeColors.textColor
      }
    };

    this.axis = {
      stroke: {
        color: themeColors.textColor,
        width: 1.5
      },
      tick: {
        color: themeColors.textColor,
        width: 1.0,
        position: "center",
        font: "normal normal normal 7pt Helvetica, Arial, sans-serif",
        fontColor: themeColors.textColor
      }
    };

    this.series = {
      stroke: {width: 0, color: themeColors.textColor},
      outline: {width: 0, color: themeColors.textColor},
      font: "normal normal normal 8pt Helvetica, Arial, sans-serif",
      fontColor: themeColors.textColor
    };

    this.seriesThemes = array.map(this.colors, function (color) {
      return {fill: color};
    });

    /*this.marker = {
     stroke: {width: 1.0, color: themeColors.textColor},
     outline: {width: 1.0, color: themeColors.textColor},
     font: "normal normal normal 8pt Helvetica, Arial, sans-serif",
     fontColor: themeColors.textColor
     };*/


    /*this.markerThemes = [
     {fill: "#bf9e0a", stroke: {color: "#ecc20c"}},
     {fill: "#73b086", stroke: {color: "#95e5af"}},
     {fill: "#216071", stroke: {color: "#277084"}},
     {fill: "#c7212d", stroke: {color: "#ed2835"}},
     {fill: "#87ab41", stroke: {color: "#b6e557"}}
     ];*/

  };

  return themes.DashboardChartTheme;
});