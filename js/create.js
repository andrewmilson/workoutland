angular.module('createController', [])

.controller('createController',
['$scope',
function($scope) {
  $scope.steps = [{}];

  $scope.addExercise = function() {
    $scope.steps.push({});
  };

  $scope.remove = function($index) {
    $scope.steps.splice($index, 1);
  };
}]);
