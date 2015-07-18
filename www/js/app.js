angular.module('workoutland', [
  'ui.router',
  'workoutsController',
  'createController',
  'workoutController',
  'ngSanitize',
  'autocomplete'
])

.config(
['$stateProvider', '$urlRouterProvider', '$compileProvider', '$locationProvider',
function($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {
  if (!isApp && !isLocalhost) $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise('/');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|geo|file|maps):/);

  if (isApp) {
    $stateProvider.state('gold', {
      url: '/gold',
      templateUrl: 'views/gold.html',
      controller: 'goldController'
    });
  }

  $stateProvider
  .state('workouts', {
    url: '/',
    templateUrl: 'views/workouts.html',
    controller: 'workoutsController'
  })
  .state('create', {
    url: '/c',
    templateUrl: 'views/create.html',
    controller: 'createController'
  })
  .state('workout', {
    url: '/:id',
    templateUrl: 'views/workout.html',
    controller: 'workoutController'
  });
}])

.directive('wlHref', function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attr) {
      elm[0].href = (isApp || isLocalhost ? '#' : '') + attr.wlHref;
    }
  }
})

.run([
'$rootScope', '$timeout',
function($rootScope, $timeout) {
  $rootScope.$watch('settings', function(val) {
    settings = val;
    updateSettings();

    if (isApp) {
      if (settings.keepAwake) {
        window.plugins.insomnia.keepAwake();
      } else {
        window.plugins.insomnia.allowSleepAgain();
      }
    }
  }, true);

  $rootScope.$on('$viewContentLoaded', function(event, currentRoute, previousRoute) {
    window.scrollTo(0, 0);
  });

  $rootScope.isApp = isApp;
  $rootScope.website = website;
  $rootScope.settings = settings;
  $rootScope.canVibrate = !!navigator.vibrate;
}]);
