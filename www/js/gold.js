angular.module('goldController', [])

.controller('goldController',
['$scope', '$http',
function($scope, $http) {
  var handler = StripeCheckout.configure({
    key: 'pk_test_mpe3LC3a4TIYn286t6KeFijK',
    image: 'img/workout-gold.png',
    allowRememberMe: false,
    // bitcoin: true,
    token: function(token) {
      // Use the token to create the charge with a server-side script.
      // You can access the token ID with `token.id`
    }
  });

  $scope.getGold = function() {
    handler.open({
      name: 'Workout Land Gold',
      description: 'Unlimited workouts, up to 5 devices',
      amount: 4700
    });
  }
}]);
