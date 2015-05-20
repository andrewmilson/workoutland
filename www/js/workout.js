angular.module('workoutController', [])

.controller('workoutController',
['$scope', '$timeout', '$state', '$http',
function($scope, $timeout, $state, $http) {

  $scope.getWorkout = function() {
    if (localStorage['workout-' + $state.params.id]) {
      $scope.workout = JSON.parse(localStorage['workout-' + $state.params.id]);
      console.log($scope.workout);
    } else {
      $http.get('http://workout-land.appspot.com/' + $state.params.id)
      .success(function(workout) {
        $scope.workout = workout;

        workout.time = 0;
        workout.steps.map(function(a) {
          workout.time += a.time;
        });

        if (!localStorage['workout-' + $state.params.id]) {
          localStorage['workout-' + $state.params.id] = JSON.stringify(workout);
        }
      });
    }
  };

  $scope.getWorkout();

  var progressTimeout;
  var beep = document.getElementById('beep');

  $scope.meta = {
    current: -1,
    progress: 0,
    stepProgress: 0,
    playing: false,
    paused: false
  };

  var update = function(playBeep) {
    var time = 0;
    for (var i = 0; i < $scope.workout.steps.length; i++) {
      time += $scope.workout.steps[i].time;
      if (time >= $scope.meta.progress) {
        $scope.meta.stepProgress = time - $scope.meta.progress;

        if (i != $scope.meta.current) {
          if (playBeep) {
            var step = $(document.getElementsByClassName('step')[i]);
            var windowHeight = $(window).height();
            var offset = step.offset().top -
              (step.height() < $(window).height() &&
              ($(window).height() / 2) - (step.height() / 2) || 0);
            $('html, body').animate({scrollTop: offset}, 500);

            setTimeout(function() {
              var step = $scope.workout.steps[i]
              var speechText = step.name + ' ' + (step.time > 60 ? Math.floor(step.time / 60) + ' minutes': '') + (step.time % 60 ? (step.time > 60 ? 'and' : '') + step.time % 60 + ' seconds' : '');
              if (isApp) {
                navigator.tts.speak(speechText);
              } else {
                meSpeak.speak(speechText)
              }
            }, 0);
          }
        }

        $scope.meta.current = i;

        if (i == $scope.workout.steps.length - 1 && $scope.meta.progress == time) {
          $scope.stopWorkout();
          var speechText = 'workout over';
          if (isApp) {
            navigator.tts.speak(speechText);
          } else {
            meSpeak.speak(speechText)
          }
        }

        break;
      }
    }
  };

  $scope.workoutIncrimenter = function() {
    progressTimeout = $timeout(function() {
      $scope.workoutIncrimenter();
      $scope.meta.progress++;
      update(true);
    }, 1000);
  };

  $scope.$steps = document.getElementsByClassName('step');

  $scope.goToStep = function($index, $e) {
    if (!$scope.meta.playing) return;
    $scope.meta.progress = 1;
    for (var i = 0; i < $index; i++) {
      $scope.meta.progress += $scope.workout.steps[i].time;
    }

    if ($index == $scope.meta.current) {
      var $step = $scope.$steps[$index];
      var offset = $step.getBoundingClientRect();
      $scope.meta.progress += Math.floor($scope.workout.steps[$index].time / $step.clientWidth * ($e.pageX - offset.left))
    }

    $timeout.cancel(progressTimeout);
    !$scope.meta.paused && $scope.workoutIncrimenter();
    update();
  };

  $scope.startWorkout = function() {
    $scope.meta.current = 0;
    $scope.meta.progress = 0;
    $scope.meta.playing = true;
    $scope.workoutIncrimenter();
    update(false);
  };

  $scope.toggleWorkout = function() {
    if ($scope.meta.paused) {
      $scope.workoutIncrimenter();
    } else {
      $timeout.cancel(progressTimeout);
    }

    $scope.meta.paused = !$scope.meta.paused;
    console.log($scope.meta.paused);
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
