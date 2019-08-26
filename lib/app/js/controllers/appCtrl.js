'use strict';

angular.module('sgApp')
    .controller('AppCtrl', function ($scope, ngProgressFactory, $http, $location) {
        var ngProgress = ngProgressFactory.createInstance();
        // ngProgress do not respect styles assigned via CSS if we do not pass empty parameters
        // See: https://github.com/VictorBjelkholm/ngProgress/issues/33
        ngProgress.setHeight('');
        ngProgress.setColor('');

        $scope.$on('progress start', function () {
            ngProgress.start();
        });

        $scope.currentCss = "";
        $scope.updateCurrentCss = function (newCss) {
            $scope.currentCss = newCss;
        }

        $scope.$on('progress end', function () {
            ngProgress.complete();
        });

		const defaultThemeName = $location.search().theme || "main-0-0";
		const defaultThemeUrl = `/typo3conf/ext/providerece/Resources/Public/dev/css/${defaultThemeName}.css`;

		$scope.updateCurrentCss({
			"center": "Host",
			"url": defaultThemeUrl,
			"linie": "Host",
		});

		$scope.stylesheets = "/typo3conf/ext/providerece/Resources/Public/styleguideData/stylesheets/"
		$scope.themes = "";
		$http.get('/typo3conf/ext/providerece/Resources/Public/styleguideData/themes.json')
			.then(function (data) {
				$scope.themes = data.data.themes.map(
					function (theme) {
						theme.url = $scope.stylesheets + theme.center + '.css';
						return theme
					})
				},
				function (error) {
					console.log(error)
				}
			);

		// Retrieve the host css
		/*
		$http.get('/404')
		.then(
			(data) => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(data.data, 'text/html');
				const hostCss = doc.querySelector("[href*=merged]").getAttribute("href");
				$scope.themes.push({
					"center": "Host",
					"url": hostCss,
					"linie": "Host",
				});
				$scope.themes.push($scope.currentCss);
			}
		)
		.catch((error) => console.log("Styleguide main.js error: " + error));
		*/

        // Reload styles when server notifies about the changes
        // Add cache buster to every stylesheet on the page forcing them to reload
        $scope.$on('styles changed', function () {
            var links = Array.prototype.slice.call(document.getElementsByTagName('link'));
            links.forEach(function (link) {
                if (typeof link === 'object' && link.getAttribute('type') === 'text/css' && link.getAttribute('data-noreload') === null) {
                    link.href = link.href.split('?')[0] + '?id=' + new Date().getTime();
                }
            });
        });

        $scope.$on('socket connected', function () {
            console.log('Socket connection established');
        });

        $scope.$on('socket disconnected', function () {
            console.error('Socket connection dropped');
            ngProgress.reset();
        });

        $scope.$on('socket error', function (err) {
            console.error('Socket error:', err);
        });

    });
