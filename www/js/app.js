angular.module('workoutland', [
  'ui.router',
  'workoutsController',
  'createController',
  'workoutController'
])

.config(
['$stateProvider', '$urlRouterProvider', '$compileProvider', '$locationProvider',
function($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {
  if (!isApp) $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise('/w');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|geo|file|maps):/);

  $stateProvider
  .state('workouts', {
    url: '/w',
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

.run([
'$rootScope',
function($rootScope) {
  $rootScope.website = website;
}]);
