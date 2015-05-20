angular.module('workoutland', [
  'ui.router',
  'workoutsController',
  'createController',
  'workoutController',
  'ngSanitize'
])

.config(
['$stateProvider', '$urlRouterProvider', '$compileProvider', '$locationProvider',
function($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {
  if (!isApp && !isLocalhost) $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise('/');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|geo|file|maps):/);

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
'$rootScope',
function($rootScope) {
  $rootScope.website = website;
}]);
