var fieldServiceLightening = angular.module('fieldServiceLightening', ['ionic','ionic.native', 'ui.calendar', 'ui.bootstrap'])
  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      };
      
    });
  })

  .controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicSideMenuDelegate) {
    $ionicSideMenuDelegate.canDragContent(false);
  })

  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('app', {
        url: '/app',
        templateUrl: 'app/views/sidemenu.html',
        abstract: true,
        controller: 'AppCtrl'
      })

      .state('login', {
        url: '/login',
        templateUrl: 'app/views/login/login.html',
        controller: 'LoginCtrl'
      })

      .state('app.workOrderList', {
        url: '/workOrderList',
        views: {
          'fslmenu': {
            templateUrl: 'app/views/workOrderList/workOrderList.html',
            controller: 'WorkOrderListCtrl'
          }
        }
      });

    $urlRouterProvider.otherwise('/login');
    //$locationProvider.html5Mode(true);
  })
