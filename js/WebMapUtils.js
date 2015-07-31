/**
 *
 * WebMapUtils
 *  - Helper methods for working with webmaps
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  10/21/2014 - 0.1.0 -
 * Modified:
 *
 */
define([
  "dojo/Evented",
  "dojo/_base/declare",
  "dojo/Deferred",
  "dojo/_base/lang",
  "dojo/_base/array"
], function (Evented, declare, Deferred, lang, array) {

  // CLASS //
  var WebMapUtils = declare([Evented], {

    // DECLARED CLASS NAME //
    declaredClass: "WebMapUtils",

    // WEB MAP //
    webmap: null,

    // CONSTRUCTOR //
    constructor: function (options) {
      declare.safeMixin(this, options);
      if(!this.webmap) {
        throw new Error("WebMapUtils:: webmap is not defined");
      }
    },

    /**
     * GET MAP LAYER
     *
     * @param layerName
     * @param isBasemap
     * @returns {*}
     */
    getMapLayer: function (layerName, isBasemap) {
      var deferred = new Deferred();

      if(this.webmap) {
        var webmapLayer = isBasemap ? this.getBasemapLayer(layerName) : this.getOperationalLayer(layerName);
        if(webmapLayer) {
          if(webmapLayer.layerObject.loaded) {
            deferred.resolve(webmapLayer.layerObject);
          } else {
            webmapLayer.layerObject.on("load", deferred.resolve);
          }
        } else {
          deferred.reject(new Error("Can't find layer in webmap: " + layerName));
        }
      } else {
        deferred.reject(new Error("getMapLayer:: webmap is not defined"));
      }

      return deferred.promise;
    },

    /**
     * GET WEBMAP OPERATIONAL LAYER
     *
     * @param layerName
     * @returns {*}
     */
    getOperationalLayer: function (layerName) {
      if(this.webmap) {
        return this._findItemByTitle(this.webmap.operationalLayers, layerName);
      } else {
        this.emit("error", new Error("getOperationalLayer:: webmap is not defined"));
        return null;
      }
    },

    /**
     *
     * @param layerName
     * @returns {*}
     */
    getBasemapLayer: function (layerName) {
      if(this.webmap) {
        return this._findItemByTitle(this.webmap.baseMap.baseMapLayers, layerName);
      } else {
        this.emit("error", new Error("getBasemapLayer:: webmap is not defined"));
        return null;
      }
    },

    /**
     * GET WEBMAP TABLE DETAILS
     *
     * @param tableName
     * @returns {*}
     */
    getTableInfo: function (tableName) {
      if(this.webmap) {
        return this._findItemByTitle(this.webmap.tables, tableName);
      } else {
        this.emit("error", new Error("getTableInfo:: webmap is not defined"));
        return null;
      }
    },

    /**
     *
     * @param items
     * @param title
     * @returns {*}
     * @private
     */
    _findItemByTitle: function (items, title) {
      var candidates = array.filter(items, function (item) {
        return (item.title === title);
      });
      return (candidates.length > 0) ? candidates[0] : null;
    }

  });

  // VERSION //
  WebMapUtils.version = "0.1.0";

  // RETURN CLASS //
  return WebMapUtils;
});
  

