angular.module('workoutsController', [])

.controller('workoutsController',
['$scope', '$timeout', '$state', '$http',
function($scope, $timeout, $state, $http) {
  $scope.workouts = [];
  // if (!~Object.keys(localStorage).join('').indexOf('workout')) {
  //   localStorage.
  // }

  for (var key in localStorage) {
    if (~key.indexOf('workout-')) {
      $scope.workouts.push(JSON.parse(localStorage[key]))
      var workout = $scope.workouts.slice(-1)[0];
      workout.time = 0;
      workout.steps.map(function(a) {
        a.time = a.time || 0;
        a.reps = a.reps || 0;
        workout.time += a.time || a.reps * 5;
      });
      workout.time = Math.floor(workout.time);
    }
  }

  $scope.workouts.reverse();
}]);
