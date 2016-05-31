// http://weblogs.asp.net/dwahlin/archive/2013/09/18/building-an-angularjs-modal-service.aspx
angular
    .module('incluso.public.login', [])
    .controller('publicLoginController', [
        '$q',
        '$scope',
        '$location',
        '$routeParams',
        '$timeout',
        '$rootScope',
        '$http',
        '$anchorScroll',
        '$modal',
        'IntervalFactory',
        'SignalRFactory',
        function ($q, $scope, $location, $routeParams, $timeout, $rootScope, $http, $anchorScroll, $modal, IntervalFactory, SignalRFactory) {
            _timeout = $timeout;
            _httpFactory = $http;
            $scope.scrollToTop();
            $rootScope.showToolbar = false;
            $rootScope.showFooter = false;
            $rootScope.showFooterRocks = false;
            $rootScope.showStage1Footer = false;
            $rootScope.showStage2Footer = false;
            $rootScope.showStage3Footer = false;
            /* ViewModel */
            $scope.userCredentialsModel = {
                username: "",
                password: "",
                rememberCredentials: false,
                modelState: {
                    isValid: null,
                    errorMessages: []
                }
            };

            $scope.currentVersion = getcurrentVersion();
            
            $scope.currentUserModel = {
                token: "",
                userId: ""
            };

            /* Watchers */
            $scope.$watch("userCredentialsModel.modelState.errorMessages", function (newValue, oldValue) {
                $scope.userCredentialsModel.modelState.isValid = (newValue.length === 0);
            });
            
            IntervalFactory.CancelUserNotificationWeeklyInterval();
            
            function validateModel(){                
                var errors = [];
                
                var passwordPolicy = "Contraseña inválida";
                var usernamePolicy = "Nombre de usuario inválido"; 
                
                if(!$scope.loginForm.password.$valid){ errors.push(passwordPolicy); }
                if(!$scope.loginForm.userName.$valid){ errors.push(usernamePolicy); }
                $scope.userCredentialsModel.modelState.errorMessages = errors;
                return (errors.length === 0);
            }

            function loadQuizesAssets(userId, userToken) {
                $scope.$emit('ShowPreloader');
                            moodleFactory.Services.GetAsyncActivityQuizInfo($scope.coursemoduleid, userId, userToken, function() {}, function() {}, true);
                    }

            $scope.loadCredentials = function () {

                var txtCredentials = localStorage.getItem("Credentials");
                var txtCurrentUser = localStorage.getItem("CurrentUser");
                var userCredentials = null;
                var currentUser = null;

                //loading...
                if (txtCredentials) {
                    userCredentials = JSON.parse(txtCredentials);
                    
                    if(userCredentials.rememberCredentials) {
                        //Preload username and password input fields...
                        $scope.userCredentialsModel.username = userCredentials.username;
                        $scope.userCredentialsModel.password = userCredentials.password;
                        $scope.userCredentialsModel.rememberCredentials = userCredentials.rememberCredentials;   
                    }
                }

                if (txtCurrentUser) {
                    currentUser = JSON.parse(txtCurrentUser);
                    $scope.currentUserModel.token = currentUser.token;
                    $scope.currentUserModel.userId = currentUser.userId;
                }

                //autologin
                if (currentUser && currentUser.token && currentUser.token != "") {
                    
                    $timeout(function () {
                        $scope.$emit('ShowPreloader');
                        
                        $scope.validateConnection(function () {
                            $scope.$emit('HidePreloader');
                            
                            if(txtCredentials) {
                                $scope.login();   
                            }
                            
                        }, function () {
                            
                            $rootScope.OAUTH_ENABLED = false;
                            
                            /* para auto iniciar sesión en offline es necesario que se haya cargado por lo menos una vez toda la información */
                            if(localStorage.getItem("leaderboard") && localStorage.getItem("Perfil/" + $scope.currentUserModel.userId)) {
                                $timeout(function(){
                                    $scope.$emit('HidePreloader');
                                    _loadedDrupalResources = true;
                                    $location.path('/ProgramaDashboard');
                                }, 1);   
                            } else {
                                $timeout(function(){
                                    $scope.$emit('HidePreloader');
                                }, 1);
                            }
                        });
                    }, 500);

                } else {
                    $scope.$emit('HidePreloader');
                }
            };

            $scope.login = function (username, password) {
                $scope.$emit('ShowPreloader');
                $scope.userCredentialsModel.modelState.isValid = true;
                $scope.userCredentialsModel.modelState.errorMessages = [];
                $scope.validateConnection(function () {
                    loginConnectedCallback();
                }, offlineCallback);
            };

            $scope.navigateToRegister = function (username, password) {
                $scope.validateConnection(function () {
                    $timeout(function() {
                        $location.path('/Register');
                    }, 500);
                }, offlineCallback);
            };

            $scope.navigateToRecoverPassword = function (username, password) {
                $scope.validateConnection(function () {
                    $timeout(function() {
                        $location.path('/RecoverPassword'); 
                    }, 500);
                }, offlineCallback);
            };

            
            
            function loginConnectedCallback() {
                // reflect loading state at UI
                
                if(validateModel()) {
                    
                    $http(
                    {
                        method: 'POST',
                        url: API_RESOURCE.format("authentication"),
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        data: $.param({
                            username: $scope.userCredentialsModel.username.toString().toLowerCase(),
                            password: $scope.userCredentialsModel.password
                        })
                    }
                    ).success(function (data, status, headers, config) {

                        localStorage.removeItem("offlineConnection");
                        //save token for further requests and autologin
                        $scope.currentUserModel = data;
                        $scope.currentUserModel.userId = data.id;

                        _setLocalStorageJsonItem("CurrentUser", $scope.currentUserModel);
                        _setId(data.id);

                        _loadDrupalResources();
                                                                        
                        $timeout(
                            function () {
                                loginCordova();
                            }, 1000);

                        $rootScope.OAUTH_ENABLED = false;

                        //Run queue
                        moodleFactory.Services.ExecuteQueue(function () {
                            //Preparing for syncAll.
                            //succesful credentials
                            moodleFactory.Services.GetAsyncUserCourse(_getItem("userId"), function() {

                                var course = moodleFactory.Services.GetCacheJson("course");
                                moodleFactory.Services.GetAsyncUserPostCounter(data.token, course.courseid, function () {
                                    
                                    IntervalFactory.StartUserNotificationWeeklyInterval();

                                    //Load Quizzes assets
                                    loadQuizesAssets(data.id, data.token);
                                    //GetExternalAppData();

                                    $timeout(
                                    function () {
                                        $scope.$emit('HidePreloader');
                                        $location.path('/ProgramaDashboard');
                                    }, 1000);

                                }, function () {
                                    offlineCallback();
                                }, true);

                            }, function() {
                                offlineCallback();
                            });
                        });

                        _setLocalStorageJsonItem("Credentials", $scope.userCredentialsModel);

                    }).error(function (data, status, headers, config) {
                        $scope.userCredentialsModel.modelState.isValid = false;
                        var errorMessage = "";
                        if(data && data.messageerror) {
                            errorMessage = window.atob(data.messageerror);  
                        } else{
                            errorMessage = "Se necesita estar conectado a Internet para continuar";
                        }

                        $scope.userCredentialsModel.modelState.errorMessages = [errorMessage];
                        $scope.$emit('HidePreloader');
                        $scope.$emit('scrollTop');
                        $scope.isLogginIn = false;
                        clearLocalStorage();
                    });
                } else {
                    $timeout(function(){
                        $scope.$emit('HidePreloader');
                        $scope.$emit('scrollTop');
                    }, 1);
                }
            }

            $scope.loginWithFacebook = function () {
                $scope.$emit('ShowPreloader');

                $timeout(function(){
                    $scope.validateConnection(loginWithFacebookConnectedCallback, offlineCallback);
                }, 500);

            };

            
            function loginCordova() {
                var currentUser = JSON.parse(localStorage.getItem("CurrentUser"));
                if (currentUser && currentUser.token) {
                    var objectToken = {
                        moodleAPI: API_RESOURCE.format(''),
                        moodleToken: currentUser.token
                    };
                
                    cordova.exec(function () {
                        console.log("success");
                        }, function () {
                            },"CallToAndroid", "login", [objectToken]);
                 }
            }
            
            function loginWithFacebookConnectedCallback() {
                //scope.$emit('ShowPreloader');
                //$location.path('/ProgramaDashboard');                
                var name = API_RESOURCE.format("");
                name = name.substring(0, name.length - 1);
                $scope.userCredentialsModel.modelState.isValid = true;
                $scope.userCredentialsModel.modelState.errorMessages = [];

                if (window.mobilecheck()) {
                    cordova.exec(FacebookLoginSuccess, FacebookLoginFailure, "SayHelloPlugin", "connectWithFacebook", [name]);
                }
            }

            function FacebookLoginSuccess(data) {
                //$scope.$emit('ShowPreloader');
                var userFacebook = JSON.parse(data);

                _loadDrupalResources();
                $rootScope.OAUTH_ENABLED = true;

                //save token for further requests and autologin
                $scope.currentUserModel = userFacebook;
                $scope.currentUserModel.token = userFacebook.token;
                $scope.currentUserModel.userId = userFacebook.id;

                _setLocalStorageJsonItem("CurrentUser", $scope.currentUserModel);                

                _setId(userFacebook.id);

                //Run queue
                moodleFactory.Services.ExecuteQueue(function () {
                    //Preparing for syncAll...

                    //succesful credentials
                    moodleFactory.Services.GetAsyncUserCourse(_getItem("userId"), function() {
                            
                            //Came back from redirecting...                        
                            var course = moodleFactory.Services.GetCacheJson("course");
                            moodleFactory.Services.GetAsyncUserPostCounter(data.token, course.courseid, function () {
                            }, function () {
                            }, false);
                        
                            IntervalFactory.StartUserNotificationWeeklyInterval();

                            //Load Quizzes assets
                            loadQuizesAssets(userFacebook.id, userFacebook.token);
                            //GetExternalAppData();

                            $timeout(
                                function () {
                                    if (userFacebook.is_new == true) {
                                        $location.path('/Tutorial');
                                    } else {
                                        $location.path('/ProgramaDashboard');
                                    }

                                }, 1000);

                            
                        }, function() {} );
                });

                if ($scope.userCredentialsModel.rememberCredentials) {
                    _setLocalStorageJsonItem("Credentials", $scope.userCredentialsModel);
                } else {
                    localStorage.removeItem("Credentials");
                }
            }

            function FacebookLoginFailure(data) {
                $scope.$emit('HidePreloader');
                $scope.userCredentialsModel.modelState.isValid = false;
                var errorMessage = window.atob(data.messageerror);

                $timeout(function () {
                    $scope.userCredentialsModel.modelState.errorMessages = [errorMessage];
                }, 1000);
                $scope.$emit('scrollTop');
            }

            function offlineCallback() {
                $timeout(function(){
                    $scope.userCredentialsModel.modelState.errorMessages = ["Se necesita estar conectado a Internet para continuar"];
                    $scope.$emit('scrollTop');
                    $scope.$emit('HidePreloader');
                }, 1);
            }
            /*
            var GetExternalAppData = function () {
                var user = $scope.currentUserModel.userId;
                var token = $scope.currentUserModel.token;
                moodleFactory.Services.GetAsyncAvatar(user, token, function () {}, function () {}, true);
                moodleFactory.Services.GetAsyncForumDiscussions(85, token, function () {}, function () {}, true);
                moodleFactory.Services.GetAsyncForumDiscussions(91, token, function () {}, function () {}, true);
                moodleFactory.Services.GetAsyncMultipleChallengeInfo(token, function(){}, function(){}, true);
                var courseModuleIds = [{"id": 1039, "userInfo": true}, {"id": 2012, "userInfo": false}, {"id": 2017,"userInfo": true}, 
                                        {"id": 3302, "userInfo": false}, {"id": 3402, "userInfo": true}];
                for (var i = 0; i < courseModuleIds.length; i++) {
                    var courseModule = courseModuleIds[i];
                    var parentActivity = getActivityByActivity_identifier(courseModule.id);
                    if (parentActivity && parentActivity.activities && parentActivity.activities.length > 0) {
                        for (var j = 0; j < parentActivity.activities.length; j++) {
                            var activity = parentActivity.activities[j];
                            moodleFactory.Services.GetAsyncActivity(activity.coursemoduleid, token, function() {}, function() {}, true);
                            if (courseModule.userInfo) {
                                if (courseModule.id != 1039 || (courseModule.id == 1039 && activity.activityname.toLowerCase().indexOf("resultados") >= 0)) {
                                    moodleFactory.Services.GetAsyncActivity(activity.coursemoduleid + "?userid=" + user, token, function() {}, function() {}, true);
                                }
                            }
                        }
                    }
                }
            };
            */
                        
            
            if(localStorage.getItem("offlineConnection") == "offline") {
                $timeout(function(){
                    $scope.userCredentialsModel.modelState.errorMessages = ["Se necesita estar conectado a Internet para continuar"];
                    $scope.$emit('HidePreloader');
                    $scope.$emit('scrollTop');
                    localStorage.removeItem("offlineConnection");
                }, 2000);
            } else {
                $scope.loadCredentials();    
            }

        }]);
