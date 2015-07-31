/*global define,location */
/*jslint sloppy:true */
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
define({
  //Default configuration settings for the application. This is where you'll define things like a bing maps key,
  //default web map, default app color theme and more. These values can be overwritten by template configuration settings and url parameters.
  "appid": "",
  "webmap": "3f33a5f0ac094b8e8af9c7cd7ac95fe7",
  "oauthappid": null,
  //Group templates must support a group url parameter. This will contain the id of the group.
  "group": "",
  //Enter the url to the proxy if needed by the application. See the 'Using the proxy page' help topic for details
  //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
  "proxyurl": "../../proxy/DotNet/proxy.ashx",
  //Example of a template specific property. If your template had several color schemes
  //you could define the default here and setup configuration settings to allow users to choose a different
  //color theme.
  "theme": "blue",
  "bingKey": "", //Enter the url to your organizations bing maps key if you want to use bing basemaps
  //Defaults to arcgis.com. Set this value to your portal or organization host name.
  "sharinghost": location.protocol + "//" + "www.arcgis.com",
  "units": null,
  //If your application needs to edit feature layer fields set this value to true. When false the map will
  //be created with layers that are not set to editable which allows the FeatureLayer to load features optimally.
  "editable": false,
  "helperServices": {
    "geometry": {
      "url": null
    },
    "printTask": {
      "url": null
    },
    "elevationSync": {
      "url": null
    },
    "geocode": [{
      "url": null
    }]
  },
  //
  // SURVEY123 DASHBOARD PARAMETERS //
  //
  // APP TITLE: SET TO NULL IF YOU WANT TO USE SURVEY NAME
  surveyTitle: "Damage Assessment Dashboard",
  // APP LOGO: IMAGE SHOULD HAVE HEIGHT OF 50PX
  surveyLogo: "./images/Esri-labs.png",
  // THEME: NAME OF THE CSS FILE IN /CSS FOLDER
  //   EXAMPLE - IF CSS FILE IS ./css/myTheme.css THEN USE themeName: "myTheme"
  themeName: "survey123",
  // CHART SECTION LABELS
  surveyUserLabel: "User",
  timeLabel: "Day",
  surveyTypesLabel: "Needs",
  overlayLabel: "Overly",
  // SURVEY LAYER NAME
  surveyLayerName: "Damage Assessment",
  // SURVEY USER FIELD NAME
  surveyUserFieldName: "Creator",
  // SURVEY TYPE FIELDS: LIST OF FIELDS WITH SIMILAR CONTENT - FORM REPEAT OR GROUP?
  surveyTypesFields: ["Needs", "Needs_other"],
  // OVERLAY LAYER NAME: LEAVE AS NULL IF NO ADDITIONAL POLYGON OVERLAY LAYER EXISTS IN MAP
  overlayLayerName: "",
  // OVERLAY LAYER UNIQUE FIELD FOR CHART LABELS
  overlayFieldName: "",
  //
  // TIME INTERVAL
  timeInterval: "esriTimeUnitsDays" // DON'T USE esriTimeUnitsWeeks
});