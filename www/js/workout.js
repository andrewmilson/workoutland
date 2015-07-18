angular.module('workoutController', [])

.controller('workoutController',
['$scope', '$timeout', '$state', '$http',
function($scope, $timeout, $state, $http) {
  var workout, steps;

  var speak = function(text) {
    console.log(settings);
    if (!settings.TTS) return;
    if (isApp) {
      TTS.speak(text);
    } else {
      if (window.speechSynthesis) {
        speechSynthesis.speak(new SpeechSynthesisUtterance(text));
      } else {
        setTimeout(function() {
          meSpeak.speak(text)
        }, 20);
      }
    }
  }

  $scope.$on('$locationChangeStart', function(event) {
    if (isApp) {
      window.plugins.insomnia.allowSleepAgain();
    }
  });

  var meta = $scope.meta = {
    current: -1,
    progress: 0,
    stepProgress: 0,
    playing: false,
    paused: false
  };

  var handleDifficulty = function(newVal, oldVal) {
    newVal = newVal || 1;
    oldVal = oldVal || 1;
    if (!workout) return;
    meta.progress = Math.floor(meta.progress / oldVal * newVal);
    workout.time = 0;
    steps.map(function(a) {
      a.time = a.time / oldVal * newVal || 0;
      a.reps = a.reps / oldVal * newVal || 0;
      a.displayReps = Math.ceil(a.reps);
      a.displayTime = Math.ceil(a.time);
      workout.time += a.time || a.reps * 5;
    });
    workout.time = Math.floor($scope.workout.time);
  }

  var handleStepDifficulty = function(oldVal, newVal) {
    steps.forEach(function(step) {
      if (step.name == oldVal.name) {
        step.weight = step.weight / newVal.difficulty * oldVal.difficulty || 0;
        step.displayWeight = Math.ceil(step.weight);
      }
    });
  }

  var handleWorkout = function(workoutInfo) {
    workout = $scope.workout = workoutInfo;
    steps = workout.steps;

    workout.difficulty = workout.difficulty || 1;
    handleDifficulty(workout.difficulty, workout.difficulty)

    workout.stepDifficulty = [];
    workout.steps.forEach(function(step) {
      if (!step.weight) return;
      for (var i = 0; i < workout.stepDifficulty.length; i++) {
        if (workout.stepDifficulty[i].name.toLowerCase() === step.name.toLowerCase()) return;
      }

      workout.stepDifficulty.push({
        name: step.name,
        difficulty: 1
      });
    });

    workout.stepDifficulty.forEach(function(step, i) {
      $scope.$watch('workout.stepDifficulty[' + i + ']', handleStepDifficulty, true);
    });

    if (workout && !localStorage['workout-' + $state.params.id]) {
      localStorage['workout-' + $state.params.id] = JSON.stringify(workout);
    }


    if (window.AndroidWear) {
      AndroidWear.onConnect(function(e) {
        window.androidWatch = e;

        AndroidWear.onDataReceived(androidWatch.handle, function(command) {
          if (command.data == 'next') {
            $scope.goToStep(meta.current + 1, true);
            $scope.$apply();
          } else if (command.data == 'prev') {
            $scope.goToStep(meta.current - 1, true);
            $scope.$apply();
          } else if (command.data == 'start') {
            $scope.startWorkout()
            $scope.$apply();
          }
        });

        AndroidWear.sendData(androidWatch.handle, JSON.stringify({
          workoutName: workout.name
        }));
      });
    }

    return workout;
  }

  $scope.getWorkout = function() {
    if (localStorage['workout-' + $state.params.id]) {
      handleWorkout(JSON.parse(localStorage['workout-' + $state.params.id]));

      var localWorkout = JSON.parse(localStorage['workout-' + $state.params.id]);
      if (workout.temp) {
        $http.post('https://workout-land.appspot.com/', workout)
        .success(function(data) {
          localWorkout.id = data;
          delete localWorkout.temp;
          localStorage['workout-' + data] = JSON.stringify(localWorkout);
          localStorage.removeItem('workout-' + $state.params.id);
          handleWorkout(JSON.parse(localStorage['workout-' + data]));
        })
      }
    } else {
      $http.get('https://workout-land.appspot.com/' + $state.params.id)
      .success(function(workoutData) {
        handleWorkout(workoutData);
      });
    }
  };

  $scope.$watch('workout.difficulty', handleDifficulty);

  $scope.getWorkout();

  var progressTimeout;
  var beep = document.getElementById('beep');

  var update = function(TextToSpeech) {
    var time = 0;
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      time += step.time || step.reps;
      if (time >= meta.progress) {
        meta.stepProgress = time - meta.progress;

        if (window.androidWatch) {
          var stepMeta = {
            playingWorkout: true,
            stepMeta: (step.time ?
              Math.ceil(step.time - meta.stepProgress) + ' / ' + step.displayTime + ' sec' :
              step.displayReps + ' reps') +
              (step.weight ? ' - ' + step.displayWeight + ' ' + settings.unit : ''),
            stepNumber: i + 1 + ' / ' + steps.length,
            stepName: step.name,
            next: i + 1 != steps.length,
            prev: !!i,
            upNext:
              (i + 1 == steps.length ? 'FINISH' : steps[i + 1].name) +
              '... up next'
          };

          AndroidWear.sendData(androidWatch.handle, JSON.stringify(stepMeta));
        }

        if (i != meta.current) {
          if (TextToSpeech) {
            var $step = $(document.getElementsByClassName('step')[i]);
            var windowHeight = $(window).height();
            var offset = $step.offset().top -
              ($step.height() < $(window).height() &&
              ($(window).height() / 2) - ($step.height() / 2) || 0);
            $('html, body').animate({scrollTop: offset}, 500);

            var speechText = step.name + '. ';

            if (step.time) {
              speechText +=
                (step.displayTime >= 60 ? Math.floor(step.displayTime / 60) + ' minute': '') +
                (step.displayTime % 60 ? (step.displayTime > 60 ? 'and' : '') + step.displayTime % 60 + ' seconds' : '');
            } else if (step.reps) {
              speechText += step.displayReps + ' reps'
            }

            if (step.weight) {
              speechText += ' ' + step.displayWeight + ' ' + settings.unit.replace('lbs', 'pounds')
            }

            if (settings.TTSUpNext) {
              speechText += '.'
              if (i + 1 >= steps.length) {
                  speechText += ' finish';
              } else {
                var nextStep = steps[i + 1];
                speechText += ' ' + nextStep.name + (nextStep.weight ? nextStep.displayWeight + ' ' + settings.unit.replace('lbs', 'pounds') : '');
              }

              speechText += ', up next';
            }

            settings.vibrate && navigator.vibrate && navigator.vibrate(100);
            speak(speechText);
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
    speak(speechText);
  }

  var workoutIncrimenter = $scope.workoutIncrimenter = function() {
    progressTimeout = $timeout(function() {
      workoutIncrimenter();
      if (steps[meta.current].time) meta.progress++;
      update(true);
    }, 1000);
  };

  $scope.$steps = document.getElementsByClassName('step');

  $scope.goToStep = function($index, TextToSpeech, $e) {
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
    if ($index < steps.length) return update(TextToSpeech);
    workoutOver();
  };

  $scope.startWorkout = function() {
    $scope.meta.current = -1;
    $scope.meta.progress = 0;
    $scope.meta.playing = true;
    workoutIncrimenter();
    update(true);
  };

  var commands = {
    next: function() {
      $scope.goToStep(meta.current + 1, true);
      $scope.$apply();
    },
    previous: function() {
      $scope.goToStep(meta.current - 1, true);
      $scope.$apply();
    },
    pause: function() {
      if ($scope.meta.paused) return;
      $scope.toggleWorkout();
      $scope.$apply();
    },
    play: function() {
      if (!$scope.meta.paused) return;
      $scope.toggleWorkout();
      $scope.$apply();
    },
    start: function() {
      $scope.startWorkout()
      $scope.$apply();
    },
    stop: function() {
      $scope.stopWorkout()
      $scope.$apply();
    }
  }

  if (annyang && settings.voiceControl) {
    annyang.addCommands(commands);
    annyang.start();
  }

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
      window.plugins.socialsharing.share('https://' + website + '/' + $state.params.id)
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
