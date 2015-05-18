angular.module('createController', [])

.controller('createController',
['$scope', '$http',
function($scope, $http) {
  $scope.workout = {
    name: '',
    steps: [{}]
  };

  $scope.addStep = function() {
    $scope.workout.steps.push({});
  };

  $scope.removeStep = function($index) {
    $scope.workout.steps.splice($index, 1);
  };

  $scope.createWorkout = function() {
    $scope.createDisabled = true;
    var workout = angular.copy($scope.workout);

    workout.steps.map(function(step) {
      step.time = (step.mins || 0) * 60 + (step.seconds || 0);
      delete step.mins;
      delete step.seconds;
    });

    $http.post('http://workout-land.appspot.com/', workout)
    .success(function(data) {
      location.replace('#/' + data);
    });
  }
}]);
