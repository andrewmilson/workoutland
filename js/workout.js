angular.module('workoutController', [])

.controller('workoutController',
['$scope', '$timeout', '$state', '$http',
function($scope, $timeout, $state, $http) {
  var workout, steps;

  var meta = $scope.meta = {
    current: -1,
    progress: 0,
    stepProgress: 0,
    playing: false,
    paused: false
  };

  var handleDifficulty = function(newVal, oldVal) {
    meta.progress = Math.floor(meta.progress / oldVal * newVal);
    $scope.workout.time = 0;
    steps.map(function(a) {
      a.time = a.time / oldVal * newVal || 0;
      a.reps = a.reps / oldVal * newVal || 0;
      workout.time += a.time || a.reps * 5;
    });
    workout.time = Math.floor($scope.workout.time);
  }

  var handleWorkout = function(workoutInfo) {
    workout = $scope.workout = workoutInfo;
    steps = workout.steps;

    workout.difficulty = workout.difficulty || 1;
    handleDifficulty(workout.difficulty, workout.difficulty)

    if (workout && !localStorage['workout-' + $state.params.id]) {
      localStorage['workout-' + $state.params.id] = JSON.stringify(workout);
    }

    return workout;
  }

  $scope.getWorkout = function() {
    if (localStorage['workout-' + $state.params.id]) {
      handleWorkout(JSON.parse(localStorage['workout-' + $state.params.id]));

      var localWorkout = JSON.parse(localStorage['workout-' + $state.params.id]);
      if (workout.temp) {
        $http.post('http://workout-land.appspot.com/', workout)
        .success(function(data) {
          localWorkout.id = data;
          delete localWorkout.temp;
          localStorage['workout-' + data] = JSON.stringify(localWorkout);
          localStorage.remove('workout-' + $state.params.id);
          handleWorkout(JSON.parse(localStorage['workout-' + data]));
        })
      }
    } else {
      $http.get('http://workout-land.appspot.com/' + $state.params.id)
      .success(function(workoutData) {
        handleWorkout(workoutData);
      });
    }
  };

  $scope.$watch('workout.difficulty', handleDifficulty);

  $scope.getWorkout();

  var progressTimeout;
  var beep = document.getElementById('beep');

  var update = function(TTS) {
    var time = 0;
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      time += step.time || step.reps;
      if (time >= meta.progress) {
        meta.stepProgress = time - meta.progress;

        if (i != meta.current) {
          if (TTS) {
            var $step = $(document.getElementsByClassName('step')[i]);
            var windowHeight = $(window).height();
            var offset = $step.offset().top -
              ($step.height() < $(window).height() &&
              ($(window).height() / 2) - ($step.height() / 2) || 0);
            $('html, body').animate({scrollTop: offset}, 500);

            setTimeout(function() {

              var speechText = step.name + '. ';

              if (step.time) {
                speechText +=
                  (step.time > 60 ? Math.floor(step.time / 60) + ' minutes': '') +
                  (step.time % 60 ? (step.time > 60 ? 'and' : '') + step.time % 60 + ' seconds' : '');
              } else if (step.reps) {
                speechText += Math.round(step.reps) + ' reps'
              }

              if (isApp) {
                navigator.tts.speak(speechText);
              } else {
                meSpeak.speak(speechText)
              }
            }, 0);
          }
        }

        meta.current = i;

        if (i == steps.length - 1 && meta.progress == time) {
          workoutOver();
        }

        break;
      }
    }
  };

  var workoutOver = $scope.workoutOver = function() {
    $scope.stopWorkout();
    var speechText = 'workout over';
    if (isApp) {
      navigator.tts.speak(speechText);
    } else {
      meSpeak.speak(speechText)
    }
  }

  var workoutIncrimenter = $scope.workoutIncrimenter = function() {
    progressTimeout = $timeout(function() {
      workoutIncrimenter();
      if (steps[meta.current].time) meta.progress++;
      update(true);
    }, 1000);
  };

  $scope.$steps = document.getElementsByClassName('step');

  $scope.goToStep = function($index, TTS, $e) {
    if (!meta.playing) return;
    meta.progress = 1;
    for (var i = 0; i < $index; i++) {
      meta.progress += steps[i].time || steps[i].reps || 0;
    }

    if ($index == $scope.meta.current) {
      var $step = $scope.$steps[$index];
      var offset = $step.getBoundingClientRect();
      if ($e) $scope.meta.progress += Math.floor(steps[$index].time / $step.clientWidth * ($e.pageX - offset.left));
    }

    $timeout.cancel(progressTimeout);
    !$scope.meta.paused && workoutIncrimenter();
    if ($index < steps.length) return update(TTS);
    workoutOver();
  };

  $scope.startWorkout = function() {
    $scope.meta.current = 0;
    $scope.meta.progress = 0;
    $scope.meta.playing = true;
    workoutIncrimenter();
    update(false);
  };

  $scope.toggleWorkout = function() {
    if ($scope.meta.paused) {
      workoutIncrimenter();
    } else {
      $timeout.cancel(progressTimeout);
    }

    $scope.meta.paused = !$scope.meta.paused;
  };

  $scope.shareWorkout = function() {
    if (isApp) {
      window.plugins.socialsharing.share('http://' + website + '/' + $state.params.id)
    } else {
      var clippyString = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="110" height="14" id="clippy" ><param name="movie" value="clippy.swf"/><param name="allowScriptAccess" value="always" /><param name="quality" value="high" /><param name="scale" value="noscale" /><param NAME="FlashVars" value="text=#{text}"><param name="bgcolor" value="#ffffff"><embed src="clippy.swf" width="110" height="14" name="clippy" quality="high" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" FlashVars="text=#{text}" bgcolor="#ffffff"/></object>';
      $('#clippy-container').html(clippyString.replace(/#\{text\}/g, 'http://' + website + '/' + $state.params.id))
      alert('Workout URL coppied to clipboard')
    }
  }

  $scope.stopWorkout = function() {
    $scope.meta.playing = false;
    $timeout.cancel(progressTimeout);
  };

  $scope.$on("$destroy", function(event) {
    $timeout.cancel(progressTimeout);
  });
}])

.filter('floor', function(){
  return function(n){
    return Math.floor(n);
  };
})

.filter('dateSuffix', function() {
  return function(i) {
    var j = i % 10, k = i % 100;
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
  };
});
