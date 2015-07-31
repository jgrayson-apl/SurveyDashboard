/*global define,document */
/*jslint sloppy:true,nomen:true */
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
  "dojo/_base/declare",
  "dojo/Evented",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/window",
  "dojo/date",
  "dojo/date/stamp",
  "dojo/_base/Color",
  "dojo/colors",
  "dojo/on",
  "dojo/aspect",
  "dojo/query",
  "dojo/dom",
  "dojo/dom-style",
  "dojo/dom-geometry",
  "dojo/Deferred",
  "dojo/promise/all",
  "dijit/registry",
  "dojo/store/Memory",
  "dojox/charting/Chart",
  "dojox/charting/axis2d/Default",
  "dojox/charting/plot2d/Pie",
  "dojox/charting/plot2d/Bars",
  "dojox/charting/action2d/Tooltip",
  "dojox/charting/StoreSeries",
  "esri/arcgis/utils",
  "esri/graphicsUtils",
  "esri/TimeExtent",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/tasks/StatisticDefinition",
  "esri/dijit/HistogramTimeSlider",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/renderers/SimpleRenderer",
  "esri/dijit/PopupTemplate",
  "./DashboardChartTheme",
  "./ClusterLayer",
  "./WebMapUtils"
], function (declare, Evented, lang, array, win, date, stamp, Color, colors, on, aspect, query,
             dom, domStyle, domGeom, Deferred, all, registry, Memory,
             Chart, Default, Pie, Bars, ChartTooltip, StoreSeries,
             arcgisUtils, graphicsUtils, TimeExtent, Query, QueryTask, StatisticDefinition, HistogramTimeSlider,
             SimpleMarkerSymbol, SimpleLineSymbol, SimpleRenderer, PopupTemplate, DashboardChartTheme, ClusterLayer, WebMapUtils) {

  /**
   * CHART BARS WITH CUSTOM LABELS TO DEAL WITH BARS THAT ARE 'CUTOFF'
   * DUE TO X-AXIS MAX VALUE BEING SO MUCH LESS THAN ACTUAL MAX DATA VALUE,
   * OR IF WE JUST WANT TO ALWAYS HAVE LABELS TO THE RIGHT OF THE BARS
   */
  var BarsWithLabels = declare([Bars], {
    createLabel: function (group, value, bbox, theme) {
      var y = bbox.y + (bbox.height / 2) + 4;
      var x = bbox.x + bbox.width + 15;
      var chartNodeBox = domGeom.getContentBox(this.chart.node);
      if(x > (chartNodeBox.l + chartNodeBox.w)) {
        x = (chartNodeBox.l + chartNodeBox.w) - 50;
      }
      this.renderLabel(group, x, y, this._getLabel(isNaN(value.y) ? value : value.y), theme, "start");
    }
  });

  /**
   * THE APP
   */
  var MainApp = declare([Evented], {

    /**
     * CONSTRUCTOR
     *
     * @param config
     */
    constructor: function (config) {
      declare.safeMixin(this, config);
    },

    /**
     * STARTUP
     */
    startup: function () {
      var itemInfoOrWebmap = (this.itemInfo || this.webmap);
      if(itemInfoOrWebmap) {
        this.loadCSSTheme().then(lang.hitch(this, function () {
          this._createWebMap(itemInfoOrWebmap);
        }), MainApp.displayMessage);
      } else {
        MainApp.displayMessage(new Error("Main:: itemInfo or webmap not defined"));
      }
    },

    /**
     *
     * @returns {Deferred.promise}
     */
    loadCSSTheme: function () {
      var deferred = new Deferred();

      // LOAD THEME CSS //
      // NOTE: SEE 'themeName' PROPERTY IN default.js AND ./css/survey123.css //
      require([
        lang.replace("xstyle/css!./css/{themeName}.css", this)
      ], lang.hitch(this, function () {

        var bodyStyle = domStyle.getComputedStyle(win.body());
        this.textColor = new Color(bodyStyle.color);
        this.backgroundColor = new Color(bodyStyle.backgroundColor);
        this.accentColor = new Color(bodyStyle.borderBottomColor);

        // SET CHART COLORS //
        DashboardChartTheme.setColors({
          textColor: this.textColor,
          backgroundColor: this.backgroundColor,
          accentColor: this.accentColor
        });

        deferred.resolve();
      }), deferred.reject);

      return deferred.promise;
    },

    /**
     * CREATE A MAP BASED ON AN WEBMAP ITEMINFO OR ID
     *
     * @param itemInfo
     * @private
     */
    _createWebMap: function (itemInfo) {
      arcgisUtils.createMap(itemInfo, "center-map-pane", {
        mapOptions: {
          sliderOrientation: "horizontal"
        },
        usePopupManager: false,
        editable: this.editable,
        bingMapsKey: this.bingKey
      }).then(lang.hitch(this, function (response) {

        this.map = response.map;
        this.item = response.itemInfo.item;
        this.webmap = response.itemInfo.itemData;

        // APP TITLE //
        dom.byId("app-title").innerHTML = this.surveyTitle || this.item.title;
        // APP LOGO //
        dom.byId("app-logo").src = this.surveyLogo;

        //
        // CONFIGURATION PARAMETERS FROM HOSTED TEMPLATE NEED TO HANDLED DIFFERENTLY //
        //
        if(this.surveyLayerParam && (this.surveyLayerParam.id != "")) {
          var surveyLayer = this.map.getLayer(this.surveyLayerParam.id);
          this.surveyLayerName = surveyLayer.arcgisProps.title || surveyLayer.name;
          // THIS WORKS OK IN THIS TEMPLATE BUT IS NOT GENERIC ENOUGH... //
          array.forEach(this.surveyLayerParam.fields, lang.hitch(this, function (field) {
            if(field.fields.length === 1) {
              this[field.id] = field.fields[0];
            } else {
              this[field.id] = field.fields;
            }
          }));
        }
        if(this.overlayLayerParam && (this.overlayLayerParam.id != "")) {
          var overlayLayer = this.map.getLayer(this.overlayLayerParam.id);
          this.overlayLayerName = overlayLayer.arcgisProps.title || overlayLayer.name;
          // THIS WORKS OK IN THIS TEMPLATE BUT IS NOT GENERIC ENOUGH... //
          array.forEach(this.overlayLayerParam.fields, lang.hitch(this, function (field) {
            if(field.fields.length === 1) {
              this[field.id] = field.fields[0];
            } else {
              this[field.id] = field.fields;
            }
          }));
        }

        // WEBMAP UTILS //
        this.webMapUtils = new WebMapUtils({webmap: this.webmap});

        // GET SURVEY LAYER //
        this.webMapUtils.getMapLayer(this.surveyLayerName || this.item.title).then(lang.hitch(this, function (surveyLayer) {
          // SURVEY LAYER //
          this.surveyLayer = surveyLayer;
          this.surveyLayer.setOpacity(0.0);

          on.once(this.surveyLayer, "update-end", lang.hitch(this, function (evt) {

            // CLUSTER LAYER //
            this.initClusterLayer();
            // SURVEY COUNTS BY USER //
            this.initUserCounts();
            // SURVEY COUNTS BY TYPE //
            this.initTypeChart();

            if(this.overlayLayerName) {
              // OVERLAY LAYER //
              this.webMapUtils.getMapLayer(this.overlayLayerName).then(lang.hitch(this, function (overlayLayer) {
                this.overlayLayer = overlayLayer;
                // SURVEY COUNTS BY COUNTRY //
                this.initOverlayChart().then(lang.hitch(this, function () {

                  // INIT HISTOGRAM TIME SLIDER //
                  this.initHistogramTimeSlider();

                }), MainApp.displayMessage);
              }));
            } else {
              if(this.surveyTypesFields) {
                registry.byId("center-right-pane").removeChild(registry.byId("right-bottom-pane"));
                registry.byId("right-center-pane").set("region", "center");
                registry.byId("center-right-pane").layout();
              } else {
                registry.byId("main-container").removeChild(registry.byId("center-right-pane"));
                registry.byId("main-container").layout();
              }

              // INIT HISTOGRAM TIME SLIDER //
              this.initHistogramTimeSlider();
            }

            setTimeout(lang.hitch(this, function (evt) {
              // ZOOM TO INITIAL FEATURES WITH GEOMETRIES //
              var featuresWithGeometries = array.filter(this.surveyLayer.graphics, function (feature) {
                return (feature.geometry != null);
              });
              this.map.setExtent(graphicsUtils.graphicsExtent(featuresWithGeometries), true);
              console.info(lang.replace("{0} of {1} features are missing geometry and can't be displayed on the map", [(this.surveyLayer.graphics.length - featuresWithGeometries.length), this.surveyLayer.graphics.length]));
              MainApp.displayMessage();
            }), 2000);

          }));
        }));
      }), MainApp.displayMessage);
    },

    /**
     * GET LIST OF CURRENT FEATURES
     *
     * @returns {Array}
     * @private
     */
    _getCurrentFeatures: function () {

      return array.filter(this.surveyLayer.graphics, lang.hitch(this, function (feature) {
        return (feature.visible); // && (feature.geometry != null));
      })).map(lang.hitch(this, function (visibleFeature) {
        return lang.delegate(visibleFeature, visibleFeature.geometry, visibleFeature.attributes);
      }));

    },

    /**
     * STATISTICS QUERIES HAVE ISSUES WHEN THE DATE RANGE IS LESS THAN ONE DAY
     *
     * @param timeExtent
     * @returns {*}
     * @private
     */
    _adjustTimeExtent: function (timeExtent) {
      var hourCount = date.difference(timeExtent.startTime, timeExtent.endTime, "hours");
      if(hourCount < 24) {
        timeExtent.endTime = date.add(timeExtent.startTime, 1, "day");
      }
      return timeExtent;
    },

    /**
     * HISTOGRAM TIME SLIDER
     */
    initHistogramTimeSlider: function () {

      if(this.surveyLayer.timeInfo) {
        dom.byId("days-label").innerHTML = lang.replace("By {timeLabel}", this);

        this.map.on("time-extent-change", lang.hitch(this, function (evt) {
          var features = this._getCurrentFeatures();
          dom.byId("total-count-label").innerHTML = features.length;
          this.emit("features-updated", {features: features, timeExtent: evt.timeExtent ? this._adjustTimeExtent(evt.timeExtent) : null});
        }));

        this.timeSlider = new HistogramTimeSlider({
          color: this.accentColor,
          textColor: this.textColor,
          dateFormat: "DateFormat(selector: 'date', fullYear: true)",
          layers: [this.surveyLayer],
          mode: "show_all",
          timeInterval: this.timeInterval
        }, dom.byId("histogram-slider-node"));
        this.timeSlider.startup();

        this.map.setTimeSlider(this.timeSlider);

        /*aspect.after(registry.byId("main-bottom-pane"), "resize", lang.hitch(this, function () {
         //console.info(this.timeSlider);
         var containerBox = domGeom.getContentBox(registry.byId("main-bottom-pane").containerNode, true);
         this.timeSlider.histogramSurface.setDimensions(containerBox.width, containerBox.height);
         }), true);*/

      } else {
        var features = this._getCurrentFeatures();
        dom.byId("total-count-label").innerHTML = features.length;
        this.emit("features-updated", {features: features, timeExtent: null});

        registry.byId("main-container").removeChild(registry.byId("main-bottom-pane"));
        registry.byId("main-container").layout();
      }
    },

    /**
     * CLUSTER LAYER
     */
    initClusterLayer: function () {

      var singleSym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 9.0,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(Color.named.white), 0.5),
          this.accentColor);

      this.clusterLayer = new ClusterLayer({
        "id": "clusters",
        "data": [],
        "distance": 100,
        "labelColor": this.textColor,
        "resolution": (this.map.extent.getWidth() / this.map.width),
        "showSingles": true,
        "singleColor": this.accentColor,
        "singleSymbol": singleSym,
        "singleTemplate": this.surveyLayer.infoTemplate
      });

      var outlineColor = new Color(this.accentColor);
      outlineColor.a = 0.4;
      var defaultSym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 16.0,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, outlineColor, 16.0),
          this.accentColor);

      var renderer = new SimpleRenderer(defaultSym);
      renderer.setSizeInfo({
        field: "clusterCount",
        valueUnit: "unknown",
        minSize: 22,
        maxSize: 110,
        minDataValue: 1,
        maxDataValue: 80
      });
      this.clusterLayer.setRenderer(renderer);

      this.map.addLayer(this.clusterLayer);

      this.on("features-updated", lang.hitch(this, function (evt) {
        this.clusterLayer.setData(evt.features);
      }));

    },

    /**
     * SURVEY COUNTS BY USER
     */
    initUserCounts: function () {

      if(this.surveyUserFieldName) {
        dom.byId("users-label").innerHTML = lang.replace("By {surveyUserLabel}", this);

        this.usersStore = new Memory({
          idProperty: "value",
          data: []
        });

        var seriesOptions = {
          color: this.accentColor
        };

        var chartNode = dom.byId("users-chart-node");
        var chartNodeBox = domGeom.getContentBox(chartNode);
        var usersChart = new Chart(chartNode);
        usersChart.setTheme(DashboardChartTheme);
        usersChart.addAxis("y", {
          vertical: true,
          natural: true,
          font: "normal normal 10pt Tahoma",
          dropLabels: false,
          labelFunc: lang.hitch(this, function (text, value, precision) {
            if(this.usersStore.data[value - 1]) {
              return this.usersStore.data[value - 1].value;
            } else {
              return "";
            }
          })
        });
        usersChart.addAxis("x", {
          natural: true,
          includeZero: true,
          minorTicks: false,
          fixUpper: "major",
          font: "normal normal 10pt Tahoma"
        });
        usersChart.addPlot("default", {
          type: BarsWithLabels,
          gap: (chartNodeBox.h > 500 ? 7 : 3),
          labels: true,
          font: "normal bold 11pt Tahoma",
          precision: 0
        });
        usersChart.addSeries("Counts", new StoreSeries(this.usersStore, {query: {}}, "count"), seriesOptions);
        usersChart.render();

        aspect.after(registry.byId("main-left-pane"), "resize", lang.hitch(this, function () {
          usersChart.resize();
        }), true);


        this.on("features-updated", lang.hitch(this, function (evt) {

          if(this.getUserCountsHandle && (!this.getUserCountsHandle.isResolved())) {
            this.getUserCountsHandle.cancel();
            this.getUserCountsHandle = null;
          }

          this.getUserCountsHandle = this._getCountsStore([this.surveyUserFieldName], evt.timeExtent).then(lang.hitch(this, function (countsInfo) {
            if(countsInfo) {
              this.usersStore = lang.clone(countsInfo.store);

              usersChart.updateSeries("Counts", new StoreSeries(this.usersStore, {query: {}}, "count"), seriesOptions);
              usersChart.fullRender();
            }
          }), console.warn);

        }));

      } else {
        MainApp.displayMessage("No User field specified...");
      }
    },

    /**
     * SURVEY COUNTS BY TYPE
     */
    initTypeChart: function () {

      // ARE THE TYPE FIELDS SET //
      if(this.surveyTypesFields && Array.isArray(this.surveyTypesFields) && this.surveyTypesFields.length > 0) {
        dom.byId("types-label").innerHTML = lang.replace("By {surveyTypesLabel}", this);

        this.typesStore = new Memory({
          idProperty: "value",
          data: []
        });

        var chartNode = dom.byId("types-chart-node");
        var chartNodeBox = domGeom.getContentBox(chartNode);
        var typesChart = new Chart(chartNode);
        typesChart.setTheme(DashboardChartTheme);
        typesChart.addPlot("default", {
          type: Pie,
          font: "normal normal 10pt Tahoma",
          ticks: true,
          labels: true,
          labelStyle: "columns",
          htmlLabels: true,
          radius: (Math.min(chartNodeBox.w, chartNodeBox.h) * 0.25)
        });
        typesChart.addSeries("Counts", new StoreSeries(this.typesStore, {query: {}}, "count"));
        typesChart.render();

        aspect.after(registry.byId("right-center-pane"), "resize", lang.hitch(this, function () {
          typesChart.stack[0].opt.radius = (Math.min(typesChart.plotArea.width, typesChart.plotArea.height) * 0.25);
          typesChart.dirty = true;
          typesChart.resize();
        }), true);


        this.on("features-updated", lang.hitch(this, function (evt) {

          if(this.getTypesCountsHandle && (!this.getTypesCountsHandle.isResolved())) {
            this.getTypesCountsHandle.cancel();
            this.getTypesCountsHandle = null;
          }

          this.getTypesCountsHandle = this._getCountsStore(this.surveyTypesFields, evt.timeExtent).then(lang.hitch(this, function (countsInfo) {
            if(countsInfo && countsInfo.store) {

              var typeDomain = this.surveyLayer.getDomain(this.surveyTypesFields[0]);
              if(typeDomain && typeDomain.type === "codedValue") {
                countsInfo.store.query().forEach(lang.hitch(this, function (item) {
                  item.displayValue = typeDomain.getName(item.value);
                  countsInfo.store.put(item);
                }));
              }

              this.typesStore = lang.clone(countsInfo.store);

              typesChart.updateSeries("Counts", new StoreSeries(this.typesStore, {query: {}}, lang.hitch(this, function (item, store) {
                item.percent = ((item.count / countsInfo.total) * 100.0).toFixed(1);
                return {
                  y: item.count,
                  text: lang.replace("<b>{count}</b> ({percent}%)<br>{value}", item),
                  tooltip: item.displayValue
                };
              })));
              typesChart.fullRender();

            }
          }), console.warn);

        }));

      } else {
        console.warn("No Types fields specified...");
        registry.byId("center-right-pane").removeChild(registry.byId("right-center-pane"));
        registry.byId("center-right-pane").layout();
      }
    },

    /**
     * GET COUNTS FOR FIELD NAMES
     *
     * @param fieldNames
     * @param timeExtent
     * @returns {Promise}
     * @private
     */
    _getCountsStore: function (fieldNames, timeExtent) {

      var countsQueries = array.map(fieldNames, lang.hitch(this, function (fieldName) {

        var countsQuery = new Query();
        countsQuery.returnGeometry = false;
        countsQuery.outFields = [fieldName];
        countsQuery.where = "1=1";
        if(timeExtent) {
          countsQuery.timeExtent = timeExtent;
        }

        var statisticDefinition = new StatisticDefinition();
        statisticDefinition.statisticType = "count";
        statisticDefinition.onStatisticField = fieldName;
        statisticDefinition.outStatisticFieldName = fieldName + "Count";

        countsQuery.outStatistics = [statisticDefinition];
        countsQuery.groupByFieldsForStatistics = [fieldName];
        countsQuery.orderByFields = [fieldName + " DESC"];

        var queryTask = new QueryTask(this.surveyLayer.url);
        return queryTask.execute(countsQuery).then(lang.hitch(this, function (countsFeatureSet) {

          var countItems = [];
          array.forEach(countsFeatureSet.features, lang.hitch(this, function (feature) {
            var count = feature.attributes[fieldName + "Count"];
            var values = feature.attributes[fieldName];
            if(values) {
              values = values.split(",");
              array.forEach(values, lang.hitch(this, function (value) {
                countItems.push({
                  value: value,
                  count: count
                })
              }));
            }
          }));
          return countItems

        }), MainApp.displayMessage);

      }));

      return all(countsQueries).then(lang.hitch(this, function (queryResults) {

        var countsStore = new Memory({
          idProperty: "value",
          data: []
        });

        var totalCount = 0;
        array.forEach(queryResults, lang.hitch(this, function (resultFeatures) {
          array.forEach(resultFeatures, lang.hitch(this, function (countInfo) {
            if(countInfo.value) {
              var activityItem = countsStore.get(countInfo.value);
              if(!activityItem) {
                countsStore.add(countInfo);
              } else {
                activityItem.count += countInfo.count;
                countsStore.put(activityItem);
              }
              totalCount += countInfo.count;
            }
          }));
        }));

        return {
          store: countsStore,
          total: totalCount
        };

      }), console.warn);
    },

    /**
     * SURVEY COUNTS BY OVERLAY
     */
    initOverlayChart: function () {
      var deferred = new Deferred();

      if(this.overlayLayerName) {
        dom.byId("overlays-label").innerHTML = lang.replace("By {overlayLabel}", this);

        var overlayQuery = new Query();
        overlayQuery.returnGeometry = true;
        overlayQuery.outFields = [this.overlayFieldName];
        overlayQuery.where = "1=1";

        var overlayQueryTask = new QueryTask(this.overlayLayer.url);
        overlayQueryTask.execute(overlayQuery).then(lang.hitch(this, function (overlayFeatureSet) {

          this.overlayStore = Memory({
            idProperty: this.overlayFieldName,
            data: array.map(overlayFeatureSet.features, lang.hitch(this, function (feature) {
              return lang.delegate(feature, lang.mixin(feature.attributes, {"count": 0, "overlay": false}));
            }))
          });

          var seriesOptions = {
            color: this.accentColor
          };

          var chartNode = dom.byId("overlay-chart-node");
          var chartNodeBox = domGeom.getContentBox(chartNode);
          var countryChart = new Chart(chartNode);
          countryChart.setTheme(DashboardChartTheme);
          countryChart.addAxis("y", {
            vertical: true,
            minorTicks: false,
            font: "normal normal 10pt Tahoma",
            labelFunc: lang.hitch(this, function (text, value) {
              var overlayItems = this.overlayStore.query({"overlay": true});
              return overlayItems[value - 1][this.overlayFieldName];
            })
          });
          countryChart.addAxis("x", {
            natural: true,
            includeZero: true,
            minorTicks: false,
            fixUpper: "major",
            font: "normal normal 10pt Tahoma"
          });
          countryChart.addPlot("default", {
            type: BarsWithLabels,
            gap: (chartNodeBox.h > 300 ? 7 : 3),
            labels: true,
            font: "normal bold 11pt Tahoma",
            precision: 0
          });
          countryChart.addSeries("Counts", new StoreSeries(this.overlayStore, {query: {"overlay": true}}, "count"), seriesOptions);
          countryChart.render();

          aspect.after(registry.byId("right-bottom-pane"), "resize", lang.hitch(this, function () {
            countryChart.resize();
          }), true);


          this.on("features-updated", lang.hitch(this, function (evt) {

            this.overlayStore.query().forEach(lang.hitch(this, function (countryItem) {
              countryItem.count = 0;
              countryItem.overlay = false;

              if(countryItem.geometry) {
                array.forEach(evt.features, lang.hitch(this, function (feature) {
                  if(feature.geometry && countryItem.geometry.contains(feature.geometry)) {
                    countryItem.count += 1;
                    countryItem.overlay = true;
                  }
                }));
              }
            }), MainApp.displayMessage);

            countryChart.updateSeries("Counts", new StoreSeries(this.overlayStore, {query: {"overlay": true}}, "count"), seriesOptions);
            countryChart.fullRender();
          }));

          deferred.resolve();
        }), MainApp.displayMessage);
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    }
  });

  /**
   *  DISPLAY MESSAGE OR ERROR
   *
   * @param messageOrError {string | Error}
   */
  MainApp.displayMessage = function (messageOrError) {
    require(["dojo/query", "put-selector/put"], function (query, put) {
      query(".message-node").orphan();
      if(messageOrError) {
        if(messageOrError instanceof Error) {
          console.error(messageOrError);
          put(document.body, "div.message-node.error-node span", messageOrError.message);
        } else {
          put(document.body, "div.message-node span", messageOrError);
        }
      }
    });
  };

  MainApp.version = "0.0.1";

  return MainApp;
});
