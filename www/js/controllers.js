angular.module('app.controllers', [])

  .controller('myWorkOrdersCtrl', ['$scope', '$ionicPlatform', '$http', '$ionicPopup', '$stateParams', '$compile', '$timeout', '$state', '$rootScope', 'force', '$cordovaGeolocation', '$ionicSideMenuDelegate', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
    // You can include any angular dependencies as parameters for this function
    // TIP: Access Route Parameters for your page via $stateParams.parameterName
    function($scope, $ionicPlatform, $http, $ionicPopup, $stateParams, $compile, $timeout, $state, $rootScope, force, $cordovaGeolocation, $ionicSideMenuDelegate) {
      $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = true;
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
        var locations = [];
        $scope.defaultStr = 'default';
        var woScope = false;
        $rootScope.getWorkOrder($scope.defaultStr);
      });
      $ionicSideMenuDelegate.canDragContent(false);
      var someEvents = [];
      $scope.detail = function(Id) {
        //console.log(Id);
        $rootScope.currentWorkOrder = Id;
        $state.go('workOrderDetails');
      };

      $scope.convertTo = function(arr, key, dayWise) {
        var wO = {};
        for (var i = 0; i < arr.length; i++) {
          if (dayWise) {
            if (arr[i][key] != null) {
              var newdate = new Date(arr[i][key]);
              arr[i][key] = moment(newdate).format('DD MMM YYYY');
            }
          } else {
            arr[i][key] = arr[i][key].toTimeString();
          }
          wO[arr[i][key]] = wO[arr[i][key]] || [];
          wO[arr[i][key]].push(arr[i]);
        }
        //console.log("wO::::",wO);
        return wO;
      };


      $rootScope.getWorkOrder = function(workOrderType) {
        $scope.WorkOrders = [];
        $scope.PlannedWO = [];
        $scope.PastWO = [];
        $rootScope.profile = '';
        //console.log("User Id:: ", $rootScope.user.Id);
        force.query("select Id, Name, Profile.Name from User where Id = '" + $rootScope.user.Id + "'").then(function(Profiles) {
          //console.log("Profiles::::::", Profiles.records[0]);
          $rootScope.profile = Profiles.records[0].Profile.Name;
          //console.log("pname:::::", $rootScope.profile);

          if ($rootScope.profile == 'System Administrator') {
            force.query("select Id, WorkOrderNumber, Account.Name,Account.BillingAddress, Owner.Name, GrandTotal, Description, Subject, CreatedDate, EndDate, StartDate, Contact.Name, Priority, Status from WorkOrder where Approval_Status__c = 'Approved' order by StartDate ASC").then(function(WorkOrders) {
              //$scope.WorkOrders = WorkOrders.records;
              //if($rootScope.workOrderType ==  undefined || $rootScope.workOrderType == 'PlannedWO' ){
              if (WorkOrders.records.length > 0) {
                for (var i = 0; i < WorkOrders.records.length; i++) {
                  if (new Date(WorkOrders.records[i].StartDate) >= new Date()) {
                    $scope.PlannedWO.push(WorkOrders.records[i]);
                  } else if (new Date(WorkOrders.records[i].StartDate) < new Date()) {
                    $scope.PastWO.push(WorkOrders.records[i]);
                  }
                }
                if (workOrderType == 'PlannedWO') {
                  if ($scope.PlannedWO.length == 0)
                    var alertPopup = $ionicPopup.alert({
                      title: 'Warning!',
                      template: 'No Work Order.',
                    });
                  $scope.WorkOrders = $scope.convertTo($scope.PlannedWO, 'StartDate', true);
                  $rootScope.HeaderTitle = 'My Planned Work Orders';
                } else if (workOrderType == 'PastWO') {
                  if ($scope.PastWO.length == 0)
                    var alertPopup = $ionicPopup.alert({
                      title: 'Warning!',
                      template: 'No Work Order.',
                    });
                  $scope.WorkOrders = $scope.convertTo($scope.PastWO, 'StartDate', true);
                  $rootScope.HeaderTitle = 'Past Work Orders';
                } else {
                  if ($scope.PlannedWO.length == 0)
                    var alertPopup = $ionicPopup.alert({
                      title: 'Warning!',
                      template: 'No Work Order.',
                    });
                  $scope.WorkOrders = $scope.convertTo($scope.PlannedWO, 'StartDate', true);
                  $rootScope.HeaderTitle = 'My Planned Work Orders';
                }

              } else {
                var alertPopup = $ionicPopup.alert({
                  title: 'Warning!',
                  template: 'No Work Order.',
                });
              }

              //else if($rootScope.workOrderType == 'PastWO'){


              //console.log("WorkOrders::", WorkOrders);
            });

          } else {
            //console.log("In else part::::", $rootScope.user.Id);
            $scope.WorkOrders = [];
            $scope.PlannedWO = [];
            $scope.PastWO = [];
            $scope.WorkOrderIds = "";
            force.query("select Id, Work_Order__c  from Service_Resource__c where User__c = '" + $rootScope.user.Id + "'").then(function(serviceResource) {
              $scope.serviceResources = serviceResource.records;
              if ($scope.serviceResources.length > 0) {
                for (var i = 0; i < $scope.serviceResources.length; i++) {
                  if ($scope.WorkOrderIds == "") {
                    $scope.WorkOrderIds = "'" + $scope.serviceResources[i].Work_Order__c + "'";
                  } else {
                    $scope.WorkOrderIds += ",'" + $scope.serviceResources[i].Work_Order__c + "'";
                  }
                }
                //console.log("WorkOrder Ids::", $scope.WorkOrderIds);
                force.query("select Id, WorkOrderNumber, Account.Name,Account.BillingAddress, Owner.Name, GrandTotal, Description, Subject, CreatedDate, EndDate, StartDate, Contact.Name, Priority, Status from WorkOrder where Id in (" + $scope.WorkOrderIds + ") and Approval_Status__c = 'Approved' order by StartDate ASC").then(function(WorkOrders) {
                  if (WorkOrders.records.length > 0) {
                    for (var i = 0; i < WorkOrders.records.length; i++) {
                      if (new Date(WorkOrders.records[i].StartDate) >= new Date()) {
                        $scope.PlannedWO.push(WorkOrders.records[i]);
                      } else if (new Date(WorkOrders.records[i].StartDate) < new Date()) {
                        $scope.PastWO.push(WorkOrders.records[i]);
                      }
                    }
                    if (workOrderType == 'PlannedWO') {
                      if ($scope.PlannedWO.length == 0)
                        var alertPopup = $ionicPopup.alert({
                          title: 'Warning!',
                          template: 'No Work Order.',
                        });
                      //console.log("$rootScope.workOrderType::", workOrderType);
                      $scope.WorkOrders = $scope.convertTo($scope.PlannedWO, 'StartDate', true);
                      $rootScope.HeaderTitle = 'My Planned Work Orders';
                      //console.log("$scope.PlannedWO::", $scope.PlannedWO.length);
                    } else if (workOrderType == 'PastWO') {
                      //console.log("$rootScope.workOrderType::", workOrderType);
                      if ($scope.PastWO.length == 0)
                        var alertPopup = $ionicPopup.alert({
                          title: 'Warning!',
                          template: 'No Work Order.',
                        });
                      $scope.WorkOrders = $scope.convertTo($scope.PastWO, 'StartDate', true);
                      $rootScope.HeaderTitle = 'Past Work Orders';
                      //console.log("$scope.PastWO::", $scope.PastWO.length);
                    } else {
                      if ($scope.PlannedWO.length == 0)
                        var alertPopup = $ionicPopup.alert({
                          title: 'Warning!',
                          template: 'No Work Order.',
                        });
                      $scope.WorkOrders = $scope.convertTo($scope.PlannedWO, 'StartDate', true);
                      $rootScope.HeaderTitle = 'My Planned Work Orders';
                      //console.log("$scope.DefaultWO::", $scope.PlannedWO.length);
                    }
                  } else {
                    var alertPopup = $ionicPopup.alert({
                      title: 'Warning!',
                      template: 'No Work Order.',
                    });
                  }
                });


              }
              // console.log("WorkOrder Ids::",$scope.WorkOrderIds);
            });

          }
        });

        //console.log("user name", $rootScope.user.username);
        //console.log("pname1:::::", $rootScope.profile);
      };

      $scope.setToTop = function(query) {
        if (query) {
          window.scrollTo(0, 0);
        }
      }


      //$scope.today = moment(new Date()).add(0, 'days').format('YYYY-MM-DD');
      function GetSortOrder(prop) {
        return function(a, b) {
          if (a[prop] > b[prop]) {
            return 1;
          } else if (a[prop] < b[prop]) {
            return -1;
          }
          return 0;
        }
      };

      $scope.placeAllAddress = function(workOrders) {
        var locations = [];
        $rootScope.locations = [];
        navigator.geolocation.getCurrentPosition(function(position) {
          //console.log("position",position);
          $rootScope.userLatitude = position.coords.latitude;
          $rootScope.userLongitude = position.coords.longitude;
          if (workOrders.length > 0) {
            for (var i = 0; i < workOrders.length; i++) {
              if (workOrders[i].Account != null) {
                if (workOrders[i].Account.BillingAddress != null) {
                  var acc_address = workOrders[i].Account.BillingAddress;
                  var addressStr = '';
                  if (acc_address.street != null) {
                    addressStr = addressStr + acc_address.street + ",+";
                  }
                  if (acc_address.city != null) {
                    addressStr = addressStr + acc_address.city + ",+";
                  }
                  if (acc_address.state != null) {
                    addressStr = addressStr + acc_address.state + ",+";
                  }
                  if (acc_address.country != null) {
                    addressStr = addressStr + acc_address.country;
                  }
                  var reqURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + addressStr;
                  $http({
                    method: 'GET',
                    url: reqURL
                  }).then(function(locationdata) {
                    var response = locationdata.data.results[0].geometry.location;
                    var location = {};
                    location.Latitude = response.lat;
                    location.Longitude = response.lng;
                    location.Address = locationdata.data.results[0].formatted_address;
                    location.Distance = distance($rootScope.userLatitude, $rootScope.userLongitude, response.lat, response.lng);
                    //$rootScope.locations.push(location);
                    locations.push(location);
                    if (i == workOrders.length) {
                      $rootScope.locations = locations.sort(GetSortOrder("Distance"));
                      //console.log("locations outside for::",$rootScope.locations);
                    }
                  });
                } else {
                  var alertPopup = $ionicPopup.alert({
                    title: 'Warning!',
                    template: 'Missing address of Work Order ' + workOrders[i].WorkOrderNumber,
                  });
                }

              } else {
                var alertPopup = $ionicPopup.alert({
                  title: 'Warning!',
                  template: 'Missing account of Work Order ' + workOrders[i].WorkOrderNumber,
                });
              }


            }

            $state.go('multimap')
          }
        }, function(error) {
          var alertPopup = $ionicPopup.alert({
            title: 'Warning!',
            template: 'Please enable location',
          });
        });
      };

      $ionicPlatform.registerBackButtonAction(function() {
        $rootScope.isNotLogin = false;
        navigator.app.exitApp();
      }, 100);


    }
  ])

  .controller('MultimapCtrl', ['$scope', '$rootScope', '$state', '$http', '$ionicPopup',
    function($scope, $rootScope, $state, $http, $ionicPopup) {
      $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = true;
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
        console.log("$rootScope.locations:::::", $rootScope.locations);
        var geocoder;
        var directionsDisplay;
        var directionsService = new google.maps.DirectionsService();

        directionsDisplay = new google.maps.DirectionsRenderer();
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 12,
            center: new google.maps.LatLng($rootScope.userLatitude, $rootScope.userLongitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP
          },
          function(error) {
            console.log(error);
            var alertPopup = $ionicPopup.alert({
              title: 'Warning!',
              template: 'Please enable location',
            });
          });

        directionsDisplay.setMap(map);

        var infowindow = new google.maps.InfoWindow();
        var marker, i;
        var request = {
          travelMode: google.maps.TravelMode.DRIVING,
        };
        var image = 'img/user.png';
        var dimage = 'img/destination.png';
        marker = new google.maps.Marker({
          position: new google.maps.LatLng($rootScope.userLatitude, $rootScope.userLongitude),
          map: map,
          animation: google.maps.Animation.DROP,
          icon: image
        }, function(error) {
          console.log(error);
          var alertPopup = $ionicPopup.alert({
            title: 'Warning!',
            template: 'Please enable location',
          });
        });

        request.origin = marker.getPosition();
        var address = '';
        var reqURL = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + $rootScope.userLatitude + ',' + $rootScope.userLongitude + '&sensor=true';
        $http({
          method: 'GET',
          url: reqURL
        }).then(function(addressData) {
          address = addressData.data.results[0].formatted_address;
        }, function(err) {
          console.log('error:', err);
        }).then(function() {
          google.maps.event.addListener(marker, 'click', (function(marker) {
            return function() {
              infowindow.setContent(address);
              infowindow.open(map, marker);
            }
          })(marker));
          if ($rootScope.locations.length > 0) {
            for (i = 0; i < $rootScope.locations.length; i++) {
              marker = new google.maps.Marker({
                position: new google.maps.LatLng($rootScope.locations[i].Latitude, $rootScope.locations[i].Longitude),
                map: map,
                icon: dimage
              });

              google.maps.event.addListener(marker, 'click', (function(marker, i) {
                return function() {
                  infowindow.setContent($rootScope.locations[i].Address);
                  infowindow.open(map, marker);
                }
              })(marker, i));
              //if (i == 0 ) request.destination = marker.getPosition();
              if (i == $rootScope.locations.length - 1) request.destination = marker.getPosition();
              else {
                if (!request.waypoints) request.waypoints = [];
                request.waypoints.push({
                  location: marker.getPosition(),
                  stopover: true
                });
              }
            }
            directionsService.route(request, function(result, status) {
              if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result);
              }
            });
          }
        });
      });

      $scope.backToWO = function() {
        $state.go('tabsController.myWorkOrders');
      }
    }
  ])

  .controller('myCalendarCtrl', ['$scope', '$stateParams', '$compile', '$timeout', '$state', '$rootScope', 'force', '$cordovaGeolocation', '$ionicSideMenuDelegate', '$ionicPopup', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
    // You can include any angular dependencies as parameters for this function
    // TIP: Access Route Parameters for your page via $stateParams.parameterName
    function($scope, $stateParams, $compile, $timeout, $state, $rootScope, force, $cordovaGeolocation, $ionicSideMenuDelegate, $ionicPopup) {
      $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = true;
          $ionicSideMenuDelegate.canDragContent(false);
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
      });
      var someEvents = [];
      $scope.WorkOrders = [];
      $scope.eventsF = function(start, end, timezone, callback) {
        var events = [];
        for (var i = 0; i < $scope.WorkOrders.length; i++) {
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
        if (uiCalendarConfig.calendars[calendar]) {
          uiCalendarConfig.calendars[calendar].fullCalendar('render');
        }
      };

      /* Render Tooltip */
      $scope.eventRender = function(event, element, view) {
        element.attr({
          'tooltip': event.title,
          'tooltip-append-to-body': true
        });
        $compile(element)($scope);
      };
      $scope.onEventClick = function(date, jsEvent, view) {
        //console.log(date.title + ' was clicked ', date);
        $rootScope.currentWorkOrder = undefined;
        $rootScope.currentWorkOrder = date.id;
        $state.go('workOrderDetails');
      };
      /* config object */
      $scope.uiConfig = {
        calendar: {
          height: 400,
          editable: true,
          header: {
            left: 'month,basicWeek,agendaDay',
            center: 'title',
            right: 'prev,next'
          },
          defaultDate: new Date(),
          defaultView: 'agendaDay',
          eventRender: $scope.eventRender,
          eventClick: $scope.onEventClick
        }
      };
      var date = new Date();
      var d = date.getDate();
      var m = date.getMonth();
      var y = date.getFullYear();
      $scope.eventSources = [someEvents, $scope.eventsF];
      force.query("select Id, Name, Profile.Name from User where Id = '" + $rootScope.user.Id + "'").then(function(Profiles) {
        //console.log("Profiles in calender::::::", Profiles.records[0]);
        $rootScope.profile = Profiles.records[0].Profile.Name;
        //console.log("pname:::::", $rootScope.profile);

        if ($rootScope.profile == 'System Administrator') {
          force.query("select Id, WorkOrderNumber, TotalPrice, Owner.Name, GrandTotal, EndDate, StartDate, Contact.Name, Priority, Status from WorkOrder where Approval_Status__c = 'Approved'").then(function(WorkOrders) {
            if (WorkOrders.records.length > 0) {
              $scope.WorkOrders = WorkOrders.records;
              angular.forEach($scope.WorkOrders, function(workOrder) {
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
            }
          });

        } else {
          //console.log("In else part::::", $rootScope.user.Id);
          $scope.WorkOrders = [];
          $scope.WorkOrderIds = "";
          force.query("select Id, Work_Order__c  from Service_Resource__c where User__c = '" + $rootScope.user.Id + "'").then(function(serviceResource) {
            $scope.serviceResources = serviceResource.records;
            if ($scope.serviceResources.length > 0) {
              for (var i = 0; i < $scope.serviceResources.length; i++) {
                if ($scope.WorkOrderIds == "") {
                  $scope.WorkOrderIds = "'" + $scope.serviceResources[i].Work_Order__c + "'";
                } else {
                  $scope.WorkOrderIds += ",'" + $scope.serviceResources[i].Work_Order__c + "'";
                }
              }
              //console.log("WorkOrder Ids::", $scope.WorkOrderIds);
              force.query("select Id, WorkOrderNumber, TotalPrice, Owner.Name, GrandTotal, EndDate, StartDate, Contact.Name, Priority, Status from WorkOrder where Id in (" + $scope.WorkOrderIds + ") and Approval_Status__c = 'Approved'").then(function(WorkOrders) {
                if (WorkOrders.records.length > 0) {
                  $scope.WorkOrders = WorkOrders.records;
                  angular.forEach($scope.WorkOrders, function(workOrder) {
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
                }
              });
            }
          });

        }
      });
      $scope.position = {};
      $scope.address = '';
      navigator.geolocation.getCurrentPosition(function(position) {

        Latitude = position.coords.latitude;
        Longitude = position.coords.longitude;
        $scope.position = {
          lat: Latitude,
          long: Longitude
        };
        var geocoder = new google.maps.Geocoder();
        //console.log(geocoder);
        var latlng = new google.maps.LatLng(Latitude, Longitude);
        var request = {
          latLng: latlng
        };
        geocoder.geocode(request, function(data, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (data[0] != null) {
              //console.log("address is: " + data[0].formatted_address);
              $scope.address = data[0].formatted_address;
              $scope.$digest();
            } else {
              //console.log("No address available");
            }
          }
        });

        //console.log(Latitude, Longitude);
      }, function(error) {
        console.log(error);
      }, {
        enableHighAccuracy: true
      }, function(error) {
        console.log(error);
        var alertPopup = $ionicPopup.alert({
          title: 'Warning!',
          template: 'Please enable location',
        });
      });

    }
  ])

  .controller('workOrderDetailsCtrl', ['$scope', '$ionicModal', '$stateParams', '$rootScope', 'force', '$http', '$ionicPopup', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
    // You can include any angular dependencies as parameters for this function
    // TIP: Access Route Parameters for your page via $stateParams.parameterName
    function($scope, $ionicModal, $stateParams, $rootScope, force, $http, $ionicPopup, $state) {
      $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = false;
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
      });
      $rootScope.workHistoryToUpdate = '';
      var canvas = '';
      $scope.createWorkOrderHistory = function(updateFields, inProgress) {
        force.create("Work_Order_History__c", updateFields).then(function(workHistory) {
          console.log("workHistory created!", workHistory);
          if (workHistory.id)
            force.update('WorkOrder', {
              Id: $rootScope.currentWorkOrder,
              Status: inProgress
            }).then(function() {
                $scope.fetchRecord();
                var updatePopup = $ionicPopup.alert({
                  title: 'Success!',
                  template: 'WorkOrder has been updated!!',
                });
                updatePopup.then(function(res) {
                  $("#description").val('');
                });
              },
              function(error) {
                console.log(error);

              });
        }, function(error) {
          console.log(error);
        });
      };
      $scope.workHistoryId = '';
      var flag = false;
      $scope.updateWorkOrderHistory = function(updateFields, inProgress) {
        force.query("select Id from Work_Order_History__c where Work_Order__c = '" + $rootScope.currentWorkOrder + "' and  User__c = '" + $rootScope.user.Id + "'").then(
          function(wh) {
            if (wh.records.length > 0) {
              for (var i = 0; i < wh.records.length; i++) {
                if (wh.records[i].Id = $rootScope.workHistoryToUpdate) {
                  $scope.workHistoryId = wh.records[i].Id;
                  flag = true;
                }
              }
              if (flag)
                force.update('Work_Order_History__c', updateFields).then(function() {
                    console.log("workHistory Created!");
                    force.update('WorkOrder', {
                      Id: $rootScope.currentWorkOrder,
                      Status: inProgress
                    }).then(function() {
                        var updatePopup = $ionicPopup.alert({
                          title: 'Success!',
                          template: 'WorkOrder has been updated!!',
                        }).then(function(res) {
                          $("#description").val('');
                          $scope.modal.show();
                          var canvas = document.getElementById('signatureCanvas');
                          $rootScope.signaturePad = new SignaturePad(canvas);
                        })
                      },
                      function(error) {
                        console.log(error);

                      });

                  },
                  function(error) {
                    console.log(error);
                  });
              else
                flag = false;
            }
          });
      };

      $scope.diff = 0;
      $rootScope.woAddress = '';
      $scope.checkLocation = function(workOrderId, inProgress, updateFields, checkForPunch) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var currentLatitude = position.coords.latitude;
          var currentLongitude = position.coords.longitude;
          force.query("select Id, WorkOrder.Account.BillingAddress from WorkOrder where Id = '" + workOrderId + "'").then(
            function(data) {
              if (data.records.length > 0) {
                if (data.records[0].Account != null) {
                  if (data.records[0].Account.BillingAddress != null) {
                    var acc_address = data.records[0].Account.BillingAddress;
                    var addressStr = '';
                    if (acc_address.street != null) {
                      addressStr = addressStr + acc_address.street + ",+";
                    }
                    if (acc_address.city != null) {
                      addressStr = addressStr + acc_address.city + ",+";
                    }
                    if (acc_address.state != null) {
                      addressStr = addressStr + acc_address.state + ",+";
                    }
                    if (acc_address.country != null) {
                      addressStr = addressStr + acc_address.country;
                    }
                    var reqURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + addressStr;
                    $http({
                      method: 'GET',
                      url: reqURL
                    }).then(function(locationdata) {
                      var response = locationdata.data.results[0].geometry.location;
                      $scope.baLatitude = response.lat;
                      $scope.baLongitude = response.lng;
                      $scope.diff = distance(currentLatitude, currentLongitude, $scope.baLatitude, $scope.baLongitude);
                      if ($scope.diff < 50) {
                        if (inProgress && inProgress != $scope.workOrder.Status) {
                          if (checkForPunch == 'Punch In') {
                            $scope.createWorkOrderHistory(updateFields, inProgress);
                          } else if (checkForPunch == 'Punch Out') {
                            $scope.updateWorkOrderHistory(updateFields, inProgress);
                          }

                        } else {
                          var alertPopup = $ionicPopup.alert({
                            title: 'Warning!',
                            template: 'Please choose a new status.',
                          });
                        }

                      } else {
                        var alertPopup = $ionicPopup.alert({
                          title: 'Warning!',
                          template: 'Please visit the place.',
                        });
                      }
                    });
                  } else {
                    var alertPopup = $ionicPopup.alert({
                      title: 'Warning!',
                      template: 'Missing address of Work Order ' + data.records[0].WorkOrderNumber,
                    });
                  }
                } else {
                  var alertPopup = $ionicPopup.alert({
                    title: 'Warning!',
                    template: 'Missing account of Work Order ' + data.records[0].WorkOrderNumber,
                  });
                }
              }
            });
        }, function(error) {
          console.log(error);
          var alertPopup = $ionicPopup.alert({
            title: 'Warning!',
            template: 'Please enable location',
          });
        });
      };



      $scope.errorMessage = "";
      $scope.description = '';
      $scope.fetchRecord = function() {
        force.retrieve('WorkOrder', $rootScope.currentWorkOrder, 'Id, WorkOrderNumber, Subject, Work_Order_Type__c, Account.Name, Account.BillingAddress, Description, EndDate, StartDate, Priority, Status').then(function(workOrder) {
          $scope.workOrder = workOrder;
          $scope.status = $scope.workOrder.Status;
          if ($scope.workOrder.Account != null) {
            if ($scope.workOrder.Account.BillingAddress != null) {
              $rootScope.woAddress = $scope.workOrder.Account.BillingAddress;
            }
            else{
              var alertPopup = $ionicPopup.alert({
                title: 'Warning!',
                template: 'Missing address of Work Order ' + $scope.workOrder.WorkOrderNumber,
              });
            }
          }
          else{
            var alertPopup = $ionicPopup.alert({
              title: 'Warning!',
              template: 'Missing account of Work Order ' + $scope.workOrder.WorkOrderNumber,
            });
          }

          //console.log("startDateFormat",$scope.workOrder.StartDate);
          //console.log("new date ISO",new Date().toISOString());
          //console.log("new date",new Date());
        });
        $scope.errorMessage = "";
      };
      $scope.$on('$ionicView.enter', function() {
        $scope.fetchRecord();
      });



      //Status picklist
      $scope.statusOptions = [{
          name: 'In Progress',
          value: 'In Progress'
        },
        {
          name: 'Completed',
          value: 'Completed'
        },
        {
          name: 'Blocked',
          value: 'Blocked'
        },
        {
          name: 'Closed',
          value: 'Closed'
        }
      ];

      $scope.getStatus = function(woStatus, startDate) {
        if (new Date() > new Date(startDate)) {} else {}
        $scope.newStatus = woStatus;
      }


      $scope.showGMap = function(address) {
        $state.go('map');
      };

      $scope.punchIn = function(description) {
        force.query("select Id,IsActive__c from Work_Order_History__c where Work_Order__c = '" + $rootScope.currentWorkOrder + "' and  User__c = '" + $rootScope.user.Id + "' and  IsActive__c = true").then(
          function(wh) {
            if (wh.records.length > 0) {
              var alertPopup = $ionicPopup.alert({
                title: 'Warning!',
                template: 'Please make sure you have punched out.'
              });
            } else {
              $scope.punchInFields = {
                Comment__c: description,
                Punch_In_Time__c: new Date().toISOString(),
                IsActive__c: true,
                Work_Order__c: $rootScope.currentWorkOrder,
                User__c: $rootScope.user.Id
              };
              $scope.checkLocation($rootScope.currentWorkOrder, $scope.newStatus, $scope.punchInFields, 'Punch In');
            }
          });

      };

      $ionicModal.fromTemplateUrl('templates/userdetailsWithSign.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.modal = modal;
      });



      $scope.clearCanvas = function() {
        $rootScope.signaturePad.clear();
      };

      $scope.saveCanvas = function(userPhone) {
        console.log("$rootScope.canvas", canvas);
        if (canvas != null)
          console.log("$rootScope.signaturePad", $rootScope.signaturePad);
        if ($rootScope.signaturePad) {
          var sigImg = $rootScope.signaturePad.toDataURL();
          if (sigImg.length > 0)
            $scope.signature = sigImg.split(',').pop();
          console.log("$scope.signature", $scope.signature.length);
          if (userPhone) {
            if ($scope.signature.length > 0) {
              var attachment = {};
              attachment.Name = "signature - " + $rootScope.user.Name + "-" + new Date().toISOString() + ".jpg";
              attachment.Body = $scope.signature;
              attachment.ParentId = $scope.workHistoryId;
              console.log("attachment", attachment);
              force.create("Attachment", attachment).then(function(attachedFile) {
                console.log("Attachment Created!");
                if (attachedFile.id)
                  force.update('Work_Order_History__c', {
                    Id: $scope.workHistoryId,
                    Phone__c: userPhone
                  }).then(function() {
                      console.log("Phone Updated");
                      var updatePopup = $ionicPopup.alert({
                        title: 'Success!',
                        template: 'WorkOrder History has been updated!!',
                      });
                      updatePopup.then(function(res) {
                        $("#mobile").val('');
                        $scope.modal.hide();
                      })
                    },
                    function(error) {
                      console.log(error);
                    });

              }, function(error) {
                console.log(error);

              });
            } else {
              var alertPopup = $ionicPopup.alert({
                title: 'Warning!',
                template: 'Please make sure you have signed.',
              });
            }
          } else {
            var alertPopup = $ionicPopup.alert({
              title: 'Warning!',
              template: 'Please make sure you have entered phone.',
            });
          }
        }
      };

      $scope.punchOut = function(description) {
        $scope.punchOutFields = {};
        force.query("select Id,IsActive__c from Work_Order_History__c where Work_Order__c = '" + $rootScope.currentWorkOrder + "' and  User__c = '" + $rootScope.user.Id + "' and  IsActive__c = true").then(
          function(wh) {
            if (wh.records.length > 0) {
              $rootScope.workHistoryToUpdate = wh.records[0].Id;
              $scope.punchOutFields = {
                Id: $rootScope.workHistoryToUpdate,
                Comment__c: description,
                Punch_Out_Time__c: new Date().toISOString(),
                IsActive__c: false,
                User__c: $rootScope.user.Id
              };
              $scope.checkLocation($rootScope.currentWorkOrder, $scope.newStatus, $scope.punchOutFields, 'Punch Out');
            } else {
              var alertPopup = $ionicPopup.alert({
                title: 'Warning!',
                template: 'Please make sure you have punched in.'
              });
            }
          });
      };

      $scope.closeModal = function() {
        $scope.modal.hide();
      };

      $scope.backToWO = function() {
        $rootScope.isNotLogin = true;
        $state.go('tabsController.myWorkOrders');
      };

    }
  ])

  .controller('menuCtrl', ['$scope', '$rootScope', 'force', '$stateParams', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
    // You can include any angular dependencies as parameters for this function
    // TIP: Access Route Parameters for your page via $stateParams.parameterName
    function($scope, $rootScope, force, $stateParams, $state) {

      $scope.logout = function() {
        force.logout();
        $rootScope.isNotLogin = false;
        $state.go('login');
        $rootScope.user = {};
      };
      $scope.showWorkOrders = function(woType) {
        $rootScope.getWorkOrder(woType);
        if ($rootScope.user) {
          $rootScope.isNotLogin = true;
          $state.go('tabsController.myWorkOrders', {
            reload: true
          });
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };

        console.log("hello", woType);
      };

      $scope.showCalendar = function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = true;
          $state.go('tabsController.myCalendar', {
            reload: true
          });
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
      };
      $scope.showMap = function() {
        $state.go('map');
      };
      $scope.help = function() {
        $state.go('help');
      }

    }
  ])

  .controller('HelpCtrl', ['$scope', '$rootScope', '$state',
    function($scope, $rootScope, $state) {
      $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = true;
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
      });
      $scope.navigateToFaq = function() {
        $state.go('faq');
      }
    }
  ])
  .controller('FaqCtrl', ['$scope', '$rootScope', '$state',
    function($scope, $rootScope, $state) {
      $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = false;
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
      });
      $scope.faqs = [{
          question: "Why do we need Field Service Lightning Mobile App?",
          answer: "The Field Service Lightning mobile app is an all-in-one tool for field service technicians on the go. This enterprise-class mobile experience leverages Salesforce in a lightweight design optimized for a modern mobile workforce."
        },
        {
          question: "Which editions of Salesforce have Field Service Lightning features?",
          answer: "Field Service Lightning features are available in Enterprise, Performance, Unlimited, and Developer Editions."
        },
      ];

      $scope.toggleFaq = function(faq) {
        if ($scope.isFaqShown(faq)) {
          $scope.shownFaq = null;
        } else {
          $scope.shownFaq = faq;
        }
      };

      $scope.isFaqShown = function(faq) {
        return $scope.shownFaq === faq;
      };

      $scope.backTohelp = function() {
        $rootScope.isNotLogin = true;
        $state.go('help');
      }
    }
  ])

  .controller('mapCtrl', ['$scope', '$http', '$rootScope', '$state', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
    // You can include any angular dependencies as parameters for this function
    // TIP: Access Route Parameters for your page via $stateParams.parameterName
    function($scope, $http, $rootScope, $state, $stateParams) {

      $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user) {
          $rootScope.isNotLogin = false;
        } else {
          $rootScope.isNotLogin = false;
          $state.go('login');
        };
        var currentLatitude;
        var currentLongitude;
        var woLocation = '';
        var locations = [];

        if ($rootScope.woAddress.street != null) {
          woLocation = woLocation + $rootScope.woAddress.street + ",";
        }
        if ($rootScope.woAddress.city != null) {
          woLocation = woLocation + $rootScope.woAddress.city + ",";
        }
        if ($rootScope.woAddress.state != null) {
          woLocation = woLocation + $rootScope.woAddress.state + ",";
        }
        if ($rootScope.woAddress.country != null) {
          woLocation = woLocation + $rootScope.woAddress.country;
        }

        navigator.geolocation.getCurrentPosition(function(position) {
          currentLatitude = position.coords.latitude;
          currentLongitude = position.coords.longitude;
          console.log("woLocation----",woLocation);
          if(woLocation != null){
          var reqURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + woLocation;
          $http({
            method: 'GET',
            url: reqURL
          }).then(function(locationdata) {
            var response = locationdata.data.results[0].geometry.location;
            var geoLocationOfWO = {};
            geoLocationOfWO.Latitude = response.lat;
            geoLocationOfWO.Longitude = response.lng;
            geoLocationOfWO.Address = locationdata.data.results[0].formatted_address;
            locations.push(geoLocationOfWO);
          }).then(function() {
            var geocoder;
            var directionsDisplay;
            var directionsService = new google.maps.DirectionsService();

            directionsDisplay = new google.maps.DirectionsRenderer();
            var map = new google.maps.Map(document.getElementById('mapIndividual'), {
                zoom: 12,
                center: new google.maps.LatLng(currentLatitude, currentLongitude),
                mapTypeId: google.maps.MapTypeId.ROADMAP
              },
              function(error) {
                console.log(error);
                var alertPopup = $ionicPopup.alert({
                  title: 'Warning!',
                  template: 'Please enable location',
                });
              });

            directionsDisplay.setMap(map);

            var infowindow = new google.maps.InfoWindow();
            var marker, i;
            var request = {
              travelMode: google.maps.TravelMode.DRIVING,
            };
            var image = 'img/user.png';
            var dimage = 'img/destination.png';
            marker = new google.maps.Marker({
              position: new google.maps.LatLng(currentLatitude, currentLongitude),
              map: map,
              animation: google.maps.Animation.DROP,
              icon: image
            }, function(error) {
              console.log(error);
              var alertPopup = $ionicPopup.alert({
                title: 'Warning!',
                template: 'Please enable location',
              });
            });

            request.origin = marker.getPosition();
            var address = '';
            var reqURL = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + currentLatitude + ',' + currentLongitude + '&sensor=true';
            $http({
              method: 'GET',
              url: reqURL
            }).then(function(addressData) {
              address = addressData.data.results[0].formatted_address;
            }, function(err) {
              console.log('error:', err);
            }).then(function() {
              google.maps.event.addListener(marker, 'click', (function(marker) {
                return function() {
                  infowindow.setContent(address);
                  infowindow.open(map, marker);
                }
              })(marker));
              if (locations.length > 0) {
                for (i = 0; i < locations.length; i++) {
                  marker = new google.maps.Marker({
                    position: new google.maps.LatLng(locations[i].Latitude, locations[i].Longitude),
                    map: map,
                    icon: dimage
                  });

                  google.maps.event.addListener(marker, 'click', (function(marker, i) {
                    return function() {
                      infowindow.setContent(locations[i].Address);
                      infowindow.open(map, marker);
                    }
                  })(marker, i));
                  //if (i == 0 ) request.destination = marker.getPosition();
                  if (i == locations.length - 1) request.destination = marker.getPosition();
                  else {
                    if (!request.waypoints) request.waypoints = [];
                    request.waypoints.push({
                      location: marker.getPosition(),
                      stopover: true
                    });
                  }
                }
                directionsService.route(request, function(result, status) {
                  if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(result);
                  }
                });
              }
            });
          })

        }
        else {
          var alertPopup = $ionicPopup.alert({
            title: 'Warning!',
            template: "Work order's address is blank.",
          });
        }

        });

      });


      $scope.backToWODetails = function() {
        $state.go('workOrderDetails');
      };

    }
  ])

  .controller('loginCtrl', ['$scope', '$ionicLoading', '$stateParams', '$state', '$ionicPopover', '$rootScope', 'force', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
    // You can include any angular dependencies as parameters for this function
    // TIP: Access Route Parameters for your page via $stateParams.parameterName
    function($scope, $ionicLoading, $stateParams, $state, $ionicPopover, $rootScope, force) {
      $rootScope.isNotLogin = false;
      $scope.environment = [{
          text: 'Sandbox',
          loginURL: 'https://test.salesforce.com',
          value: 'Sandbox'
        },
        {
          text: 'Production',
          loginURL: 'https://login.salesforce.com',
          value: 'Production'
        }
      ];
      $scope.myEnvironment = 'Production';
      //$scope.myEnvironment = 'Sandbox';
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
      $scope.switchEnvironment = function(selectionValue) {
        if (selectionValue == 'Production') {
          force.init({
            loginURL: 'https://login.salesforce.com'
          });
          $scope.myEnvironment = 'Production';
        } else {
          force.init({
            loginURL: 'https://test.salesforce.com'
          });
          $scope.myEnvironment = 'Sandbox';
        }
      };
      $scope.login = function(username, password) {
        if (username && password) {
          $ionicLoading.show({
            template: '<ion-spinner icon="android"></ion-spinner>'
          });
          force.restLogin(username, password).then(function() {

            if (force.isAuthenticated()) {
              //$rootScope.user.Id = force.getUserId();
              $rootScope.user.username = username;
              //console.log('User: ', $rootScope.user);
              force.retrieve('User', $rootScope.user.Id, 'Name').then(function(User) {
                //console.log("User Data::", User);
                $rootScope.user.Name = User.Name;
                $rootScope.isNotLogin = true;
                $state.go('tabsController.myWorkOrders');
                $ionicLoading.hide();
              });

            } else {
              $ionicLoading.hide();
              $rootScope.isNotLogin = false;
              $scope.error.message = 'Bad username or password.';
            }
          }, function(err) {
            $ionicLoading.hide();
            $scope.error.message = err.error_description;
          });

        } else {
          $ionicLoading.hide();
          $rootScope.isNotLogin = false;
          $scope.error.message = 'Bad username or password.';
        }
      };

    }
  ])

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km (change this constant to get miles)
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return Math.round(d * 1000);
};
