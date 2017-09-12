angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider



    .state('tabsController.myWorkOrders', {
    url: '/workOrders',
    views: {
      'tab1': {
        templateUrl: 'templates/myWorkOrders.html',
        controller: 'myWorkOrdersCtrl'
      }
    }
  })

  .state('tabsController.myCalendar', {
    url: '/calendar',
    views: {
      'tab2': {
        templateUrl: 'templates/myCalendar.html',
        controller: 'myCalendarCtrl'
      }
    }
  })

  .state('workOrderDetails', {
    url: '/workOrder',
    templateUrl: 'templates/workOrderDetails.html',
    controller: 'workOrderDetailsCtrl'
  })

  .state('tabsController', {
    url: '/tabs',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('map', {
    url: '/map',
    templateUrl: 'templates/map.html',
    controller: 'mapCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('help', {
    url: '/help',
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl'
  })
  .state('faq', {
    url: '/faq',
    templateUrl: 'templates/FAQ.html',
    controller: 'FaqCtrl'
  })
  .state('multimap', {
    url: '/multimap',
    templateUrl: 'templates/multimap.html',
    controller: 'MultimapCtrl'
  })

$urlRouterProvider.otherwise('/login')



});
