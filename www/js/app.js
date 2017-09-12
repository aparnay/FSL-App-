// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.routes','uiGmapgoogle-maps','googlemaps.init','ionic.native','ui.calendar','ui.bootstrap',])

.config(function($ionicConfigProvider, $sceDelegateProvider){


  $sceDelegateProvider.resourceUrlWhitelist([ 'self','*://www.youtube.com/**', '*://player.vimeo.com/video/**']);

})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

/*
  This directive is used to disable the "drag to open" functionality of the Side-Menu
  when you are dragging a Slider component.
*/
.directive('disableSideMenuDrag', ['$ionicSideMenuDelegate', '$rootScope', function($ionicSideMenuDelegate, $rootScope) {
    return {
        restrict: "A",
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

            function stopDrag(){
              $ionicSideMenuDelegate.canDragContent(false);
            }

            function allowDrag(){
              $ionicSideMenuDelegate.canDragContent(true);
            }

            $rootScope.$on('$ionicSlides.slideChangeEnd', allowDrag);
            $element.on('touchstart', stopDrag);
            $element.on('touchend', allowDrag);
            $element.on('mousedown', stopDrag);
            $element.on('mouseup', allowDrag);

        }]
    };
}])

/*
  This directive is used to open regular and dynamic href links inside of inappbrowser.
*/
.directive('hrefInappbrowser', function() {
  return {
    restrict: 'A',
    replace: false,
    transclude: false,
    link: function(scope, element, attrs) {
      var href = attrs['hrefInappbrowser'];

      attrs.$observe('hrefInappbrowser', function(val){
        href = val;
      });

      element.bind('click', function (event) {

        window.open(href, '_system', 'location=yes');

        event.preventDefault();
        event.stopPropagation();

      });
    }
  };
})

.factory('force', function($rootScope, $q, $window, $http) {
        //var appSecret;
        // The login URL for the OAuth process
        // To override default, pass loginURL in init(props)
        var loginURL = 'https://login.salesforce.com',

            // The Connected App client Id. Default app id provided - Not for production use.
            // This application supports http://localhost:8200/oauthcallback.html as a valid callback URL
            // To override default, pass appId in init(props)
            appId = '3MVG9ZL0ppGP5UrCcq346ogp_hPDEbVkwxh9EvQXBnRwpuFj.j2pmYbo.V4cUNMtxhNEcxFq24bPsIMeTCPYQ',

            // The force.com API version to use.
            // To override default, pass apiVersion in init(props)
            apiVersion = 'v37.0',

            // Keep track of OAuth data (access_token, refresh_token, and instance_url)
            oauth,

            // By default we store fbtoken in sessionStorage. This can be overridden in init()
            tokenStore = {},

            // if page URL is http://localhost:3000/myapp/index.html, context is /myapp
            context = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")),

            // if page URL is http://localhost:3000/myapp/index.html, serverURL is http://localhost:3000
            serverURL = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''),

            // if page URL is http://localhost:3000/myapp/index.html, baseURL is http://localhost:3000/myapp
            baseURL = serverURL + context,

            // Only required when using REST APIs in an app hosted on your own server to avoid cross domain policy issues
            // To override default, pass proxyURL in init(props)
            proxyURL = baseURL,

            // if page URL is http://localhost:3000/myapp/index.html, oauthCallbackURL is http://localhost:3000/myapp/oauthcallback.html
            // To override default, pass oauthCallbackURL in init(props)
            oauthCallbackURL = baseURL + '/oauthcallback.html',

            // Because the OAuth login spans multiple processes, we need to keep the login success and error handlers as a variables
            // inside the module instead of keeping them local within the login function.
            deferredLogin,

            // Reference to the Salesforce OAuth plugin
            oauthPlugin,

            // Whether or not to use a CORS proxy. Defaults to false if app running in Cordova or in a VF page
            // Can be overriden in init()
            useProxy = false;

        /*
         * Determines the request base URL.
         */
        function getRequestBaseURL() {

            var url;


            if (useProxy) {
                url = proxyURL;
            } else if (oauth.instance_url) {
                url = oauth.instance_url;
                //console.log("Used oauth");
            } else {
                url = serverURL;
            }

            // dev friendly API: Remove trailing '/' if any so url + path concat always works
            if (url.slice(-1) === '/') {
                url = url.slice(0, -1);
            }
            //console.log(oauth,url);
            return url;
        }

        function parseQueryString(queryString) {
            var qs = decodeURIComponent(queryString),
                obj = {},
                params = qs.split('&');
            params.forEach(function(param) {
                var splitter = param.split('=');
                obj[splitter[0]] = splitter[1];
            });
            return obj;
        }

        function parseUrl(url) {
            var match = url.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([^?#]*)(\?[^#]*|)(#.*|)$/);
            return match && {
                protocol: match[1],
                host: match[2],
                hostname: match[3],
                port: match[4],
                path: match[5],
                params: parseQueryString(match[6]),
                hash: match[7]
            };
        }

        function toQueryString(obj) {
            var parts = [],
                i;
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
                }
            }
            return parts.join("&");
        }


        function refreshTokenWithPlugin(deferred) {
            oauthPlugin.authenticate(
                function(response) {
                    oauth.access_token = response.accessToken;
                    tokenStore.forceOAuth = JSON.stringify(oauth);
                    deferred.resolve();
                },
                function() {
                    console.log('Error refreshing oauth access token using the oauth plugin');
                    deferred.reject();
                });
        }

        function refreshTokenWithHTTPRequest(deferred) {
            var params = {
                    'grant_type': 'refresh_token',
                    'refresh_token': oauth.refresh_token,
                    'client_id': appId
                },

                headers = {},

                url = useProxy ? proxyURL : loginURL;

            // dev friendly API: Remove trailing '/' if any so url + path concat always works
            if (url.slice(-1) === '/') {
                url = url.slice(0, -1);
            }

            url = url + '/services/oauth2/token?' + toQueryString(params);

            if (!useProxy) {
                headers["Target-URL"] = loginURL;
            }

            $http({
                    headers: headers,
                    method: 'POST',
                    url: url,
                    params: params
                })
                .success(function(data, status, headers, config) {
                    console.log('Token refreshed');
                    oauth.access_token = data.access_token;
                    tokenStore.forceOAuth = JSON.stringify(oauth);
                    deferred.resolve();
                })
                .error(function(data, status, headers, config) {
                    console.log('Error while trying to refresh token');
                    deferred.reject();
                });
        }

        function refreshToken() {
            var deferred = $q.defer();
            if (oauthPlugin) {
                refreshTokenWithPlugin(deferred);
            } else {
                refreshTokenWithHTTPRequest(deferred);
            }
            return deferred.promise;
        }

        /**
         * Initialize ForceNG
         * @param params
         *  appId (optional)
         *  loginURL (optional)
         *  proxyURL (optional)
         *  oauthCallbackURL (optional)
         *  apiVersion (optional)
         *  accessToken (optional)
         *  instanceURL (optional)
         *  refreshToken (optional)
         */
        function init(params) {
            // if ($localStorage.cache) {
            // appSecret = JSON.parse(localStorage.cache);
            // }

            if (params) {
                appId = params.appId || appId;
                apiVersion = params.apiVersion || apiVersion;
                loginURL = params.loginURL || loginURL;
                oauthCallbackURL = params.oauthCallbackURL || oauthCallbackURL;
                proxyURL = params.proxyURL || proxyURL;
                useProxy = params.useProxy === undefined ? useProxy : params.useProxy;

                if (params.accessToken) {
                    if (!oauth) oauth = {};
                    oauth.access_token = params.accessToken;
                }

                if (params.instanceURL) {
                    if (!oauth) oauth = {};
                    oauth.instance_url = params.instanceURL;
                }

                if (params.refreshToken) {
                    if (!oauth) oauth = {};
                    oauth.refresh_token = params.refreshToken;
                }
            }

            console.log("loginURL: " + loginURL);
        }

        /**
         * Discard the OAuth access_token. Use this function to test the refresh token workflow.
         */
        function discardToken() {
            delete oauth.access_token;
            tokenStore.forceOAuth = JSON.stringify(oauth);
        }

        /**
         * Called internally either by oauthcallback.html (when the app is running the browser)
         * @param url - The oauthCallbackURL called by Salesforce at the end of the OAuth workflow. Includes the access_token in the querystring
         */
        function oauthCallback(url) {

            // Parse the OAuth data received from Salesforce
            var queryString,
                obj;

            if (url.indexOf("access_token=") > 0) {
                queryString = url.substr(url.indexOf('#') + 1);
                obj = parseQueryString(queryString);
                oauth = obj;
                tokenStore['forceOAuth'] = JSON.stringify(oauth);
                if (deferredLogin) deferredLogin.resolve();
            } else if (url.indexOf("error=") > 0) {
                queryString = decodeURIComponent(url.substring(url.indexOf('?') + 1));
                obj = parseQueryString(queryString);
                if (deferredLogin) deferredLogin.reject(obj);
            } else {
                if (deferredLogin) deferredLogin.reject({
                    status: 'access_denied'
                });
            }
        }

        /**
         * Login to Salesforce using OAuth. If running in a Browser, the OAuth workflow happens in a a popup window.
         */
        function login() {
            deferredLogin = $q.defer();
            if (window.cordova) {
                loginWithPlugin();
            } else {
                loginWithBrowser();
            }
            return deferredLogin.promise;
        }

        function loginWithPlugin() {
            document.addEventListener("deviceready", function() {
                oauthPlugin = cordova.require("com.salesforce.plugin.oauth");
                if (!oauthPlugin) {
                    console.error('Salesforce Mobile SDK OAuth plugin not available');
                    if (deferredLogin) deferredLogin.reject({
                        status: 'Salesforce Mobile SDK OAuth plugin not available'
                    });
                    return;
                }
                oauthPlugin.getAuthCredentials(
                    function(creds) {
                        // Initialize ForceJS
                        init({
                            accessToken: creds.accessToken,
                            instanceURL: creds.instanceUrl,
                            refreshToken: creds.refreshToken
                        });
                        if (deferredLogin) deferredLogin.resolve();
                    },
                    function(error) {
                        console.log(error);
                        if (deferredLogin) deferredLogin.reject(error);
                    }
                );
            }, false);
        }

        function loginWithBrowser() {
            console.log('loginURL: ' + loginURL);
            console.log('oauthCallbackURL: ' + oauthCallbackURL);

            var loginWindowURL = loginURL + '/services/oauth2/authorize?client_id=' + appId + '&redirect_uri=' + oauthCallbackURL + '&response_type=token';
            window.open(loginWindowURL, '_blank', 'location=no');
        }

        /**
         * Gets the user's ID (if logged in)
         * @returns {string} | undefined
         */
        function getUserId() {
            return $rootScope.user.Id;
        }

        /**
         * Check the login status
         * @returns {boolean}
         */
        function isAuthenticated() {
            return (oauth && oauth.access_token) ? true : false;
        }


        /**
         Login using Salesforce REST API
         */
        function restLogin(username, password) {

            var deferred = $q.defer();
//'client_id': '3MVG9sSN_PMn8tjSq9cba5N9CvUvW8m3Kh9pCsDvxbK1E9sskCQ.rX8QukgitPjmibXnupGzHCurT1_6VUBbK',
                //'client_secret': '7454340941501464886',
            var params = {
                'grant_type': 'password',
                'client_id': '3MVG9lcxCTdG2VbtXoCMqm9aHX_iTTQSNAZbP9KhKzYxZqzm9LYV90PJYGBYjMYMsnB4QpI7JP2.DVIDh2WK4',
                'client_secret': '2381674366952774119',
                'username': username,
                'password': password
            };

            $http({
                    method: 'POST',
                    url: loginURL+'/services/oauth2/token',
                    params: params
                })
                .success(function(data, status, headers, config) {

                    $rootScope.auth = data;
                    oauth = data;
                    $rootScope.user.Id = data.id.split('/').pop();
                    console.log(data);
                    tokenStore.forceOAuth = JSON.stringify(oauth);


                    init({
                        accessToken: data.accessToken,
                        instanceURL: data.instanceUrl,
                        refreshToken: data.refreshToken
                    });
                    deferred.resolve(data);
                })
                .error(function(data, status, headers, config) {
                    deferred.reject(data);
                });

            return deferred.promise;
        }

        function queryMore(url) {
            console.log("Executed Once with url", url);
            return request({
                path: url
            });
        }

        function tokenAuthentication(data) {
            var auth = {};
            auth.access_token = data.accessToken;
            auth.instance_url = data.instanceURL;
            auth.token_type = "Bearer";
            $rootScope.auth = auth;
            tokenStore.forceOAuth = JSON.stringify(oauth);
            init({
                accessToken: data.accessToken,
                instanceURL: data.instanceURL,
                refreshToken: data.refreshToken
            });
        }

        /**
         Logout
         */
        function logout() {
            // var deferred = $q.defer();
            // $http({
            // method: 'POST',
            // url: url,
            // headers: {
            // "access_token": appSecret.accessToken
            // }
            // }).then(function (data) {
            // appSecret = null;
            // delete localStorage.cache;
            // //$window.sessionStorage["userInfo"] = null;
            // deferred.resolve(data);
            // }, function (error) {
            // deferred.reject(error);
            // });
            $rootScope.auth = {};
            oauth = {};
            tokenStore.forceOAuth = JSON.stringify(oauth);

            //return deferred.promise;

            //delete localStorage.cache;
        }

        /** to get the secret store **/
        function getSecret() {
            //return (appSecret) ? true : false;
            return appSecret;
        }

        /**
         * Lets you make any Salesforce REST API request.
         * @param obj - Request configuration object. Can include:
         *  method:  HTTP method: GET, POST, etc. Optional - Default is 'GET'
         *  path:    path in to the Salesforce endpoint - Required
         *  params:  queryString parameters as a map - Optional
         *  data:  JSON object to send in the request body - Optional
         */
        function request(obj) {

            var method = obj.method || 'GET',
                headers = {},
                url = getRequestBaseURL(),
                deferred = $q.defer();

            if (!oauth || (!oauth.access_token && !oauth.refresh_token)) {
                deferred.reject('No access token. Login and try again.');
                return deferred.promise;
            }

            // dev friendly API: Add leading '/' if missing so url + path concat always works
            if (obj.path.charAt(0) !== '/') {
                obj.path = '/' + obj.path;
            }

            url = url + obj.path;

            headers["Authorization"] = "Bearer " + oauth.access_token;
            if (obj.contentType) {
                headers["Content-Type"] = obj.contentType;
            }
            if (useProxy) {
                headers["Target-URL"] = oauth.instance_url;
            }

            $http({
                    headers: headers,
                    method: method,
                    url: url,
                    params: obj.params,
                    data: obj.data
                })
                .success(function(data, status, headers, config) {
                    deferred.resolve(data);
                    console.log(data);
                })
                .error(function(data, status, headers, config) {
                    if (status === 401 && oauth.refresh_token) {
                        refreshToken()
                            .success(function() {
                                // Try again with the new token
                                request(obj);
                            })
                            .error(function() {
                                console.error(data);
                                deferred.reject(data);
                            });
                    } else {
                        console.error(data);
                        deferred.reject(data);
                    }

                });

            return deferred.promise;
        }

        /**
         * Execute SOQL query
         * @param soql
         * @returns {*}
         */
        function query(soql) {
            var defer = $q.defer();
            var chained = $q.when();
            var queryData = {};
            var myQuery = request({
                path: '/services/data/' + apiVersion + '/query',
                params: {
                    q: soql
                }
            });
            myQuery.then(function(data) {
                queryData = angular.copy(data);
                if (queryData.totalSize == queryData.records.length) {
                    defer.resolve(queryData);
                } else {
                  function more() {
                      return chained = chained.then(function() {
                          var redefer = $q.defer();
                          if(queryData.nextRecordsUrl)
                          queryMore(queryData.nextRecordsUrl.slice(1)).then(function(moreData) {
                              done = moreData.done;
                              for (var i = 0; i < moreData.records.length; i++) {
                                  queryData.records.push(moreData.records[i]);
                              }
                              if (queryData.totalSize == queryData.records.length) {
                                  redefer.resolve();
                                  defer.resolve(queryData);
                              } else {
                                  queryData.nextRecordsUrl = moreData.nextRecordsUrl;
                                  more();
                              }
                              redefer.resolve();
                          });
                          return redefer.promise;
                      });
                  }
                  more();
                }
            });

            return defer.promise;

        }

        /**
         * Retrieve a record based on its Id
         * @param objectName
         * @param id
         * @param fields
         * @returns {*}
         */
        function retrieve(objectName, id, fields) {

            return request({
                path: '/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + id,
                params: fields ? {
                    fields: fields
                } : undefined
            });

        }

        /**
         * Create a record
         * @param objectName
         * @param data
         * @returns {*}
         */
        function create(objectName, data) {

            return request({
                method: 'POST',
                contentType: 'application/json',
                path: '/services/data/' + apiVersion + '/sobjects/' + objectName + '/',
                data: data
            });

        }

        /**
         * Update a record
         * @param objectName
         * @param data
         * @returns {*}
         */
        function update(objectName, data) {

            var id = data.Id,
                fields = angular.copy(data);

            delete fields.attributes;
            delete fields.Id;

            return request({
                method: 'POST',
                contentType: 'application/json',
                path: '/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + id,
                params: {
                    '_HttpMethod': 'PATCH'
                },
                data: fields
            });

        }

        /**
         * Delete a record
         * @param objectName
         * @param id
         * @returns {*}
         */
        function del(objectName, id) {

            return request({
                method: 'DELETE',
                path: '/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + id
            });

        }

        /**
         * Upsert a record
         * @param objectName
         * @param externalIdField
         * @param externalId
         * @param data
         * @returns {*}
         */
        function upsert(objectName, externalIdField, externalId, data) {

            return request({
                method: 'PATCH',
                contentType: 'application/json',
                path: '/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + externalIdField + '/' + externalId,
                data: data
            });

        }

        /**
         * Convenience function to invoke APEX REST endpoints
         * @param pathOrParams
         * @param successHandler
         * @param errorHandler
         */
        function apexrest(pathOrParams) {

            var params;

            if (pathOrParams.substring) {
                params = {
                    path: pathOrParams
                };
            } else {
                params = pathOrParams;

                if (params.path.charAt(0) !== "/") {
                    params.path = "/" + params.path;
                }

                if (params.path.substr(0, 18) !== "/services/apexrest") {
                    params.path = "/services/apexrest" + params.path;
                }
            }

            return request(params);
        }

        /**
         * Convenience function to invoke the Chatter API
         * @param params
         * @param successHandler
         * @param errorHandler
         */
        function chatter(params) {

            var base = "/services/data/" + apiVersion + "/chatter";

            if (!params || !params.path) {
                errorHandler("You must specify a path for the request");
                return;
            }

            if (params.path.charAt(0) !== "/") {
                params.path = "/" + params.path;
            }

            params.path = base + params.path;

            return request(params);

        }


        function portalChatter(params) {

            var base = "/services/data/v38.0/connect/communities/0DB7000000007hLGAQ/";

            if (!params || !params.path) {
                errorHandler("You must specify a path for the request");
                return;
            }

            if (params.path.charAt(0) !== "/") {
                params.path = "/" + params.path;
            }

            params.path = base + params.path;

            return request(params);

        }

        // The public API
        return {
            init: init,
            login: login,
            isAuthenticated: isAuthenticated,
            request: request,
            query: query,
            create: create,
            update: update,
            del: del,
            upsert: upsert,
            retrieve: retrieve,
            apexrest: apexrest,
            chatter: chatter,
            parseUrl: parseUrl,
            queryMore: queryMore,
            getUserId: getUserId,
            discardToken: discardToken,
            oauthCallback: oauthCallback,
            restLogin: restLogin,
            logout: logout,
            loginWithBrowser: loginWithBrowser,
            getSecret: getSecret,
            tokenAuthentication: tokenAuthentication,
            portalChatter: portalChatter
        };

    });

// Global function called back by the OAuth login dialog
function oauthCallback(url) {
    var injector = angular.element(document.body).injector();
    injector.invoke(function(force) {
        force.oauthCallback(url);
    });
}
