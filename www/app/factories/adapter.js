angular.module('fieldServiceLightening')
    .factory('adapter', function($rootScope, $q, $window, $http) {

        function getWorkOrders(){
            
        }
        // The public API
        return {
            getWorkOrders:getWorkOrders
        };

    });
