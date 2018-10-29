/*
 * Styleguide.js
 *
 * Handles styleguide data
 */

'use strict';

angular.module('sgApp')
  .service('Order', function($http, $rootScope, Socket, debounce) {

    var _this = this;

    this.order = {};
    this.status = {
      hasError: false,
      error: {},
      errType: ''
    };

    this.get = function() {
      return $http({
        method: 'GET',
        url: '../styleguideData/order.json'
      }).then(function(response) {
        _this.order = response.data;

        if (!Socket.isConnected()) {
          Socket.connect();
        }
      });
    };

    this.refresh = debounce(800, function() {
      _this.get();
    });

    Socket.on('styleguide compile error', function(err) {
      _this.status.hasError = true;
      _this.status.error = err;
      _this.status.errType = 'compile';
    });

    Socket.on('styleguide validation error', function(err) {
      _this.status.hasError = true;
      _this.status.error = err;
      _this.status.errType = 'validation';
    });

    Socket.on('styleguide compile success', function() {
      _this.status.hasError = false;
    });

    $rootScope.$on('styles changed', function() {
      _this.refresh();
    });

    $rootScope.$on('progress end', function() {
      _this.refresh();
    });

    // Get initial data
    this.get();
  });
