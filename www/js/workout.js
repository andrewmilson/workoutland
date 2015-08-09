angular.module('workoutController', [])

.controller('workoutController',
['$scope', '$timeout', '$state', '$http', '$rootScope',
function($scope, $timeout, $state, $http, $rootScope) {
  var workout, steps;

  var speak = function(text) {
    if (!settings.TTS) return;
    if (isApp) {
      TTS.speak(text);
    } else {
      if (window.speechSynthesis) {
        return speechSynthesis.speak(new SpeechSynthesisUtterance(text));
      } else {
        setTimeout(function() {
          meSpeak.speak(text)
        }, 20);
      }
    }
  }

  $scope.$on('$locationChangeStart', function(event) {
    annyang && annyang.abort();

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

  var handleStepDurationDifficulty = function(step, newVal, oldVal) {
    if (step.time < 0 || step.reps < 0) {
      step.toFailure = true;
    } else {
      step.time = step.time / oldVal * newVal || 0;
      step.reps = step.reps / oldVal * newVal || 0;
      step.displayReps = Math.round(step.reps);
      step.displayTime = Math.round(step.time);
    }
  }

  var handleDifficulty = function(newVal, oldVal) {
    newVal = newVal || 1;
    oldVal = oldVal || 1;
    if (!workout) return;
    meta.progress = Math.floor(meta.progress / oldVal * newVal);
    workout.time = 0;
    steps.forEach(function(a) {
      handleStepDurationDifficulty(a, newVal, oldVal);
      workout.time += (a.toFailure && 30) || a.time || a.reps * 5 + 20;
    });
    workout.time = Math.round($scope.workout.time);
  }

  $scope.changeDuration = function(e, i, amount) {
    var step = steps[i];
    step[step.time ? 'time' : 'reps'] += amount;
    console.log(step);
    handleStepDurationDifficulty(step, 1, 1);
    console.log(step);
    e.stopPropagation();
  };

  var handleStepWeightDifficulty = function(oldVal, newVal) {
    steps.forEach(function(step) {
      if (step.name == oldVal.name) {
        step.weight = step.weight / newVal.difficulty * oldVal.difficulty || 0;
        step.displayWeight = Math.round(
          step.weight * (settings.unit == 'lbs' ? 2.20462 : 1)
        );
      }
    });
  }

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

  annyang && annyang.addCommands(commands);

  $rootScope.$watch('settings', function(newVal, oldVal) {
    if (annyang) {
      if (newVal.voiceControl) {
        annyang.addCommands(commands);
        annyang.start();
      } else {
        annyang.abort();
      }
    }

    steps.length && steps.forEach(function(step) {
      if (!step.weight) return;
      step.displayWeight = Math.round(
        step.weight * (settings.unit == 'lbs' ? 2.20462 : 1)
      );
    })
  }, true);

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
      $scope.$watch('workout.stepDifficulty[' + i + ']', handleStepWeightDifficulty, true);
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
          localStorage.removeItem('workout-' + localWorkout.id);
          localWorkout.id = data;
          delete localWorkout.temp;
          localStorage['workout-' + data] = JSON.stringify(localWorkout);
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
      time += (step.toFailure && 1) || step.time || step.reps;
      if (time >= meta.progress) {
        meta.stepProgress = time - meta.progress;

        if (window.androidWatch) {
          var stepMeta = {
            playingWorkout: true,
            stepMeta: '',
            stepNumber: i + 1 + ' / ' + steps.length,
            stepName: step.name,
            next: i + 1 != steps.length,
            prev: !!i,
            upNext:
              (i + 1 == steps.length ? 'FINISH' : steps[i + 1].name) +
              '... up next'
          };

          if (step.toFailure) {
            stepMeta.stepMeta += 'To failure'
          } else if (step.time) {
            stepMeta.stepMeta +=
              Math.round(step.time - meta.stepProgress) + ' / ' +
              step.displayTime + ' sec';
          } else {
            stepMeta.stepMeta += step.displayReps + ' reps'
          }

          if (step.weight) {
            stepMeta.stepMeta += ' - ' + step.displayWeight + ' ' + settings.unit;
          }

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

            if (step.toFailure) {
              speechText += 'to failure';
            } else if (step.time) {
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
      meta.progress += Math.abs(steps[i].time || steps[i].reps || 0);
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
    workout.lastPlayed = new Date().getTime();
    localStorage['workout-' + workout.id] = JSON.stringify(workout);
    $scope.meta.current = -1;
    $scope.meta.progress = 0;
    $scope.meta.playing = true;
    workoutIncrimenter();
    update(true);
  };

  $scope.deleteWorkout = function() {
    if (!confirm('Do you want to delete this workout?')) return;
    localStorage.removeItem('workout-' + workout.id);
    location.replace('#/');
    console.log('workout-' + workout.id);
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
      prompt('Copy to clipboard: Ctrl+C, Enter', 'https://' + website + '/' + $state.params.id)
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

.filter('round', function(){
  return function(n){
    return Math.round(n);
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
})

.filter('instagramDate', function() {
  return function(i) {
    var TSC = (new Date().getTime() - i) / 1000;

    var secYear = 31536000, secMonth = 2678400, secWeek = 604800,
        secDay = 86400, secHour = 3600, secMin = 60;

    return Math.floor(TSC /
        (TSC > secWeek && secWeek ||
        TSC > secDay && secDay ||
        TSC > secHour && secHour ||
        TSC > secMin && secMin || 1))
        +
        (TSC > secWeek && 'w' ||
        TSC > secDay && 'd' ||
        TSC > secHour && 'h' ||
        TSC > secMin && 'm' || 's');
  };
});
