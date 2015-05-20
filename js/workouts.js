angular.module('workoutsController', [])

.controller('workoutsController',
['$scope', '$timeout', '$state', '$http',
function($scope, $timeout, $state, $http) {
  $scope.workouts = [];

  for (var key in localStorage) {
    if (!~localStorage[key].indexOf('workout-')) {
      $scope.workouts.push(JSON.parse(localStorage[key]))
      var workout = $scope.workouts.slice(-1)[0];
      workout.time = 0;
      workout.steps.map(function(a) {
        workout.time += a.time;
      });
    }
  }

  $scope.workouts.reverse();
}]);
