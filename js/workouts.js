var Small = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17,
  'eighteen': 18,
  'nineteen': 19,
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'sixty': 60,
  'seventy': 70,
  'eighty': 80,
  'ninety': 90
};

function handleSentence(sentense) {
  var index = sentense.length;

  for (var key in Small) {
    var keyIndex = sentense.indexOf(Small[key]);
    if (keyIndex < index) {
      index = keyIndex;
    }
  }

  console.log(index)
}

angular.module('workoutsController', [])

.controller('workoutsController',
['$scope', '$timeout', '$state', '$http',
function($scope, $timeout, $state, $http) {
  $scope.workouts = [];

  $http.get('workout.srt').success(function(data) {
    var splitSubs = data.split(/[\n\r][\n\r]/g);

    var sentenses = [];

    for (var i = 0; i < splitSubs.length; i++) {
      if (splitSubs[i].indexOf('seconds') != -1) {
        var sentence = splitSubs[i].split('seconds')[0].replace(/[\n\r]+/g, ' ');
        // var sentence = handleSentence();
        sentenses.push(sentence)
      }
    }

    console.log(sentenses);
  });

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
