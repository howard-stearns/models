"use strict";
/*jslint vars:true, forin:true*/
/*global XMLHttpRequest, Script, Window, location*/
/* Prompts for a username, and remove all connectins between yourself and whatever is entered. */

function request(options, callback) { // cb(error, responseOfCorrectContentType) of url. A subset of npm request.
    var httpRequest = new XMLHttpRequest(), key;
    // QT bug: apparently doesn't handle onload. Workaround using readyState.
    httpRequest.onreadystatechange = function () {
        var READY_STATE_DONE = 4;
        var HTTP_OK = 200;
        if (httpRequest.readyState >= READY_STATE_DONE) {
            var error = (httpRequest.status !== HTTP_OK) && httpRequest.status.toString() + ':' + httpRequest.statusText,
                response = !error && httpRequest.responseText,
                contentType = !error && httpRequest.getResponseHeader('content-type');
            if (!error && contentType.indexOf('application/json') === 0) { // ignoring charset, etc.
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    error = e;
                }
            }
            callback(error, response);
        }
    };
    if (typeof options === 'string') {
        options = {uri: options};
    }
    if (options.url) {
        options.uri = options.url;
    }
    if (!options.method) {
        options.method = 'GET';
    }
    if (options.body && (options.method === 'GET')) { // add query parameters
        var params = [], appender = (-1 === options.uri.search('?')) ? '?' : '&';
        for (key in options.body) {
            params.push(key + '=' + options.body[key]);
        }
        options.uri += appender + params.join('&');
        delete options.body;
    }
    if (options.json) {
        options.headers = options.headers || {};
        options.headers["Content-type"] = "application/json";
        options.body = JSON.stringify(options.body);
    }
    for (key in options.headers || {}) {
        httpRequest.setRequestHeader(key, options.headers[key]);
    }
    httpRequest.open(options.method, options.uri, true);
    httpRequest.send(options.body);
}

var url = location.metaverseServerUrl + '/api/v1/user/connection_request';

request({
    uri: url,
    method: 'DELETE'
}, function (error, response) {
    Window.alert(error ?
                 "ERROR in DELETE " + url + " " + error + " " + JSON.stringify(response) :
                 url + " ok " + JSON.stringify(response));
    Script.stop();
});
