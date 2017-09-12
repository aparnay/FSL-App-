angular.module('fieldServiceLightening').controller('WorkOrderListCtrl', function($scope,$compile,$timeout,$state,$rootScope,force,$cordovaGeolocation,$ionicSideMenuDelegate) {
    $rootScope.logout = function(){
        force.logout();
        $state.go('login');
    };
    $ionicSideMenuDelegate.canDragContent(false);
    var someEvents = [];
    $scope.WorkOrders = [];
    $scope.eventsF = function (start, end, timezone, callback) {
          var events = [];
          for(var i=0; i<$scope.WorkOrders.length; i++){
            workOrder = $scope.WorkOrders[i];
            events.push({
              title: workOrder.WorkOrderNumber,
              start: workOrder.StartDate,
              type: workOrder.Id,
              end: workOrder.EndDate,
              id: workOrder.Id,
              backgroundColor: '#387ef5',
              allDay: false
            });
          };
        //console.log($scope.eventSources);
        callback(events);
    };
    $scope.renderCalender = function(calendar) {
        if(uiCalendarConfig.calendars[calendar]){
        uiCalendarConfig.calendars[calendar].fullCalendar('render');
      }
    };

     /* Render Tooltip */
    $scope.eventRender = function( event, element, view ) {
        element.attr({'tooltip': event.title,
                     'tooltip-append-to-body': true});
        $compile(element)($scope);
    };
    $scope.onEventClick = function( date, jsEvent, view){
        console.log(date.title + ' was clicked ',date);
    };
    /* config object */
    $scope.uiConfig = {
      calendar:{
        height: 400,
        editable: true,
        header:{
          left: 'month basicWeek agendaWeek basicDay agendaDay',
          center: 'title,today',
          right: 'prev,next'
        },
        eventRender: $scope.eventRender,
        eventClick: $scope.onEventClick
      }
    };
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    $scope.eventSources = [someEvents];
    force.query('select Id, WorkOrderNumber, TotalPrice, Owner.Name, GrandTotal, EndDate, StartDate, Contact.Name, Priority, Status from WorkOrder').then(function(WorkOrders){
        $scope.WorkOrders = WorkOrders.records;
        console.log(WorkOrders);
        angular.forEach($scope.WorkOrders,function(workOrder){
          $scope.eventSources[0].push({
            title: workOrder.WorkOrderNumber,
            start: workOrder.StartDate,
            end: workOrder.EndDate,
            backgroundColor: '#387ef5',
            id: workOrder.Id,
            type: workOrder.Id,
            allDay: false
          });
        });
        console.log($scope.eventSources);
    });
    $scope.position = {};
    $scope.address = '';
    navigator.geolocation.getCurrentPosition
    (function (position) {

    Latitude = position.coords.latitude;
    Longitude = position.coords.longitude;
    $scope.position = {lat: Latitude, long: Longitude};
    var geocoder = new google.maps.Geocoder();
    console.log(geocoder);
      var latlng = new google.maps.LatLng(Latitude, Longitude);
      var request = {
        latLng: latlng
      };
      geocoder.geocode(request, function(data, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (data[0] != null) {
            console.log("address is: " + data[0].formatted_address);
            $scope.address = data[0].formatted_address;
            $scope.$digest();
          } else {
            console.log("No address available");
          }
        }
      });

    console.log(Latitude, Longitude);
    }, function (error) {
        console.log(error);
    }, { enableHighAccuracy: true });
});

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
