/*
 * Styleguide.js
 *
 * Handles styleguide data
 */

'use strict';

angular.module('sgApp')
  .service('Styleguide', function($http, $rootScope, Socket, debounce, Order) {

    var _this = this;

    this.sections = {};
    this.config = {};
    this.variables = {};
    this.status = {
      hasError: false,
      error: {},
      errType: ''
    };

		/*
		 *
		 */
		this.orderByJson = function(a, b, jsonOrder) {
				const compare = function(a, b, section) {
					if (jsonOrder[section].indexOf(a) < jsonOrder[section].indexOf(b)) {
						return -1;
					} else {
						return 1;
					}
				};
				const compareLists = function(a, b, category) {
					if (a.length == 0) {
						return a;
					} else if (b.length == 0) {
						return b;
					} else if (a[0] !== b[0]) {
						return compare(a[0], b[0], category);
					} else if (a[0] == b[0]){
						const category = a[0];
						a.shift();
						b.shift();
						return compareLists(a, b, category);
					} else {
						console.error("should not reach here");
					}
				}
				const aList = a.split('.');
				const bList = b.split('.');
				if(aList.length == 0 || bList.length == 0) {
					console.error('Error in comparison: ' + a + ', ' + b);
					return;
				}
				return compareLists(aList, bList, "sections");
		}

		this.isSectionInFile = function(section, order) {
			const isReferenceInFile = function (reference, category) {
				if (reference.length == 0) {
					return true;
				}
				const x = reference.shift();
				if (order[category].indexOf(x) == -1) {
					return false;
				} else {
					return isReferenceInFile(reference, x);
				}
			}
			return isReferenceInFile(section.reference.split('.'), "sections");
		}

		this.get = function() {
			Promise.all([$http.get('styleguide.json'),
				$http.get('../styleguideData/order.json')]).then((values) => {
					const styleguide = values[0].data;
					const order = values[1].data;
					_this.config.data = styleguide.config;
					_this.variables.data = styleguide.variables;
					_this.sections.data = styleguide.sections
						.filter((section) => _this.isSectionInFile(section, order))
						.sort((a,b) => _this.orderByJson(a.reference,b.reference,order));

					if (!Socket.isConnected()) {
						Socket.connect();
					}
			});
		}

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
