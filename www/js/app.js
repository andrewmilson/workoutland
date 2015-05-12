angular.module('callisthenicstimer', ['ui.router'])

.config(
['$stateProvider', '$urlRouterProvider', '$compileProvider',
function($stateProvider, $urlRouterProvider, $compileProvider) {
  $urlRouterProvider.otherwise('/workouts');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|geo|file|maps):/);

  $stateProvider
  .state('workouts', {
    url: '/workouts',
    templateUrl: 'views/workouts.html',
    controller: 'workoutsController'
  })
  .state('workout', {
    url: '/workout',
    templateUrl: 'views/workout.html',
    controller: 'workoutController'
  })
  .state('create', {
    url: '/create',
    templateUrl: 'views/create.html',
    controller: 'createController'
  })
  .state('login', {
    url: '/login',
    templateUrl: 'views/login.html',
    controller: 'loginController'
  });
}]);
