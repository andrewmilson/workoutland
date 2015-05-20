angular.module('createController', [])

.controller('createController',
['$scope', '$http',
function($scope, $http) {
  $scope.workout = {
    name: '',
    notes: '',
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

    $http.post('http://workout-land.appspot.com/', $scope.workout)
    .success(function(data) {
      location.replace('#/' + data);
    });
  }
}]);
