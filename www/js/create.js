angular.module('createController', [])

.controller('createController',
['$scope', '$http',
function($scope, $http) {
  var workout = $scope.workout = {
    name: '',
    notes: '',
    steps: [{}],
    temp: true
  };

  var inputSuggestions = $scope.inputSuggestions = [
    'Push ups',
    'Pull ups',
    'Iron butterflies',
    'Windmills',
    'Incline Bench press',
    'Squats',
    'Pistol squats',
    'V-ups',
    'Sit ups',
    'Rest',
    'Break',
    'Bench press',
    'Decline Bench press',
    'Left side plank dips',
    'Right side plank dips'
  ];

  $scope.addStep = function() {
    workout.steps.push({});
    setTimeout(function() {
      $('.step-name').last()[0].focus();
      window.scrollTo(0, document.body.scrollHeight);
    }, 50);

    console.log(workout.steps);
    workout.steps.forEach(function(step) {
      console.log(step, inputSuggestions.indexOf(step.name))
      if (!~inputSuggestions.indexOf(step.name)) {
        inputSuggestions.push(step.name);
      }
    });
  };

  $scope.removeStep = function($index) {
    workout.steps.splice($index, 1);
  };

  $scope.createWorkout = function() {
    $scope.createDisabled = true;
    var tempId = Math.floor(Math.random() * 1000000000).toString(36);
    workout.id = tempId;
    workout.unit = settings.unit;
    localStorage['workout-' + tempId] = JSON.stringify(workout);

    $http.post('https://workout-land.appspot.com/', workout)
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
