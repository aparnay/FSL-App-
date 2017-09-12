angular.module('fieldServiceLightening').controller('LoginCtrl', function($scope, $state,$ionicPopover,$rootScope,force) {
  $scope.environment = [{
    text: 'Sandbox',
    loginURL: 'https://test.salesforce.com',
    value: 'Sandbox'
  },
  {
    text: 'Production',
    loginURL: 'https://login.salesforce.com',
    value: 'Production'
  }];
  $scope.myEnvironment = 'Production';
  $rootScope.user = {};
  $scope.error = {};
  //$ionicSideMenuDelegate.canDragContent(false);
  $ionicPopover.fromTemplateUrl('app/connectionPopover.html', {
      scope: $scope
    }).then(function(popover) {
      $scope.popover = popover;
    });
  $rootScope.openConnectionPopover = function($event) {
      $scope.popover.show($event);
    }
  $scope.switchEnvironment = function(selectionValue){
    if(selectionValue == 'Production'){
      force.init({loginURL: 'https://login.salesforce.com'});
      $scope.myEnvironment = 'Production';
    }
    else{
      force.init({loginURL: 'https://test.salesforce.com'});
      $scope.myEnvironment = 'Sandbox';
    }
  };
  $scope.login = function(username,password){
    if(username&&password){
      force.restLogin(username,password).then(function(){
        if(force.isAuthenticated()){
            $rootScope.user.Id = force.getUserId();
            $rootScope.user.username = username;
            $state.go('app.workOrderList');
        }
        else{
            $scope.error.message = 'Bad username or password.';
        }
      },function(err){
        $scope.error.message = err.error_description;
      });
      
    }else{
      $scope.error.message = 'Bad username or password.';
    }
  };

});
