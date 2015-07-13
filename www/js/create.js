angular.module('createController', [])

.controller('createController',
['$scope', '$http',
function($scope, $http) {
  var workout = $scope.workout = {
    name: '',
    notes: '',
    unit: localStorage.unit || '',
    steps: [{}],
    temp: true
  };

  $scope.addStep = function() {
    workout.steps.push({});
    setTimeout(function() {
      $('.step-name').last()[0].focus();
      window.scrollTo(0, document.body.scrollHeight);
    }, 50);
  };

  $scope.removeStep = function($index) {
    workout.steps.splice($index, 1);
  };

  $scope.createWorkout = function() {
    $scope.createDisabled = true;
    var tempId = Math.floor(Math.random() * 1000000000).toString(36);
    workout.id = tempId;
    localStorage['workout-' + tempId] = JSON.stringify(workout);
    localStorage.unit = workout.unit;

    $http.post('http://workout-land.appspot.com/', workout)
    .success(function(data) {
      var tempWorkout = JSON.parse(localStorage['workout-' + tempId]);
      tempWorkout.id = data;
      delete tempWorkout.temp;
      localStorage.removeItem('workout-' + tempId)
      localStorage['workout-' + data] = JSON.stringify(tempWorkout);
      location.replace('#/' + data);
    })
    .error(function() {
      location.replace('#/' + tempId);
    });
  }
}]);
