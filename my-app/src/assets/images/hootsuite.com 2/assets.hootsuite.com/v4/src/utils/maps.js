import $ from 'jquery';
import _ from 'underscore';
import asyncLoader from 'utils/async-loader';

window.googleMapsLoadCallbacks = {}

function setupCallbackAndGetGoogleMapsApiUri(callback) {
    // google maps api uses a global callback system to alert you when the code has
    // been loaded and it has finished its initialization, so we are going to create
    // a global function and pass its name as query parameter to google maps uri

    const uri = 'https://maps-api-ssl.google.com/maps/api/js?v=3&sensor=false';
    const callbackName = 'googleMapsLoadCallbacks_' + (Math.random() + 1).toString(36).substring(7);
    const uriWithCallback = uri + '&callback=' + callbackName;

    window.googleMapsLoadCallbacks[callbackName] = () => {
        callback();
        delete window.googleMapsLoadCallbacks[callbackName];
    }

    return uriWithCallback
}

var gmaps = {

    showGoogleMap: function (lat, lgt, selector) {
        const googleMapUri = setupCallbackAndGetGoogleMapsApiUri(() => {
            var latlng = new window.google.maps.LatLng(lat, lgt);
            var myOptions = {
                zoom: 13,
                center: latlng,
                mapTypeId: window.google.maps.MapTypeId.ROADMAP
            };
            var map = new window.google.maps.Map($(selector).get(0), myOptions);
            var marker = new window.google.maps.Marker({
                position: latlng
            });
            marker.setMap(map);
        });

        asyncLoader(googleMapUri)
    },
    geocode: function (lat, lng, callback) {
        const googleMapUri = setupCallbackAndGetGoogleMapsApiUri(() => {
            var geocoder = new window.google.maps.Geocoder(),
                latlng = new window.google.maps.LatLng(lat, lng);
            geocoder.geocode({'latLng': latlng}, function (results) {
                var locStr = '';
                if (results && results.length && results[0] && results[0].address_components) {
                    var result = results[0].address_components;

                    for (var i = 0; i < result.length; i++) {
                        if (result[i].types[0] == "neighborhood" || result[i].types == "neighborhood") {
                            locStr += result[i].long_name + ', ';
                        }
                        if (result[i].types[0] == "sublocality" || result[i].types == "sublocality") {
                            locStr += result[i].long_name + ', ';
                        }
                        if (result[i].types[0] == "locality" || result[i].types == "locality") {
                            locStr += result[i].long_name + ', ';
                        }
                        if (result[i].types[0] == "administrative_area_level_1" || result[i].types == "administrative_area_level_1") {
                            locStr += result[i].long_name + ', ';
                        }
                        if (result[i].types[0] == "country" || result[i].types == "country") {
                            locStr += result[i].long_name;
                        }
                    }
                }
                _.isFunction(callback) && callback(results, locStr);
            });
        });

        asyncLoader(googleMapUri)
    }
};

hs.util = hs.util || {};
_.extend(hs.util, gmaps);

export default gmaps;
