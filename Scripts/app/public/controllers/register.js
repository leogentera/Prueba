// http://weblogs.asp.net/dwahlin/archive/2013/09/18/building-an-angularjs-modal-service.aspx
angular
    .module('incluso.public.register', [])
    .controller('publicRegisterController', [
        '$q',
        '$scope',
        '$location',
        '$routeParams',
        '$timeout',
        '$rootScope',
        '$http',
        '$anchorScroll',
        '$modal',
        function ($q, $scope, $location, $routeParams, $timeout, $rootScope, $http, $anchorScroll, $modal) {

            _timeout = $timeout;
            _httpFactory = $http;
            var dpValue;
            $scope.$emit('scrollTop');

            /* ViewModel */
            $scope.registerModel = {
                username: "",
                firstname: "",
                lastname: "",
                mothername: "",
                birthday: "",
                gender: "",
                country: "",
                city: "",
                email: "",
                password: "",
                confirmPassword: "",
                secretQuestion: "",
                secretAnswer: "",
                termsAndConditions: false,
                modelState: {
                    isValid: null,
                    errorMessages: []
                }
            };

            $scope.currentUserModel = {
                token: "",
                userId: ""
            };


            /* Helpers */
            var isConfirmedPasswordValid = false;
            $scope.currentPage = 1;
            $scope.isRegistered = false;
            $rootScope.showToolbar = false;
            $rootScope.showFooter = false;
            $rootScope.showFooterRocks = false;
            $rootScope.showStage1Footer = false;
            $rootScope.showStage2Footer = false;
            $rootScope.showStage3Footer = false;
            $scope.genderItems = _getCatalogValuesBy("gender");
            $scope.countryItems = _getCatalogValuesBy("country");
            $scope.cityItems = $scope.stateItems = _getCatalogValuesBy("citiesCatalog");
            $scope.securityquestionItems = _getCatalogValuesBy("secretquestion");
            $scope.showPlaceHolder = true;

            $scope.validateConnection(function () {
            }, offlineCallback);

            $scope.$emit('HidePreloader');

            /* Watchers */
            $scope.$watch("registerModel.confirmPassword", function (newValue, oldValue) {
                isConfirmedPasswordValid = (newValue === $scope.registerModel.password);
            });
            $scope.$watch("registerModel.password", function (newValue, oldValue) {
                isConfirmedPasswordValid = (newValue === $scope.registerModel.confirmPassword);
            });
            $scope.$watch("registerModel.modelState.errorMessages", function (newValue, oldValue) {
                $scope.registerModel.modelState.isValid = (newValue.length === 0);
            });

            $scope.register = function () {
                $scope.validateConnection(registerConnectedCallback, offlineCallback);
            };

            function registerConnectedCallback() {
                //Register.
                localStorage.removeItem("Credentials");

                if (validateModel()) {
                    $scope.$emit('ShowPreloader');
                    registerUser();
                } else {
                    $scope.$emit('scrollTop');
                }
            }

            function offlineCallback() {
                $timeout(function () {
                    $scope.registerModel.modelState.errorMessages = ["Se necesita estar conectado a Internet para continuar"];
                    $scope.$emit('scrollTop');
                }, 1000);
            }

            $scope.autologin = function (data) {
                _loadDrupalResources();
                //save token for further requests and autologin
                $scope.currentUserModel = data;
                $scope.currentUserModel.token = data.token;
                $scope.currentUserModel.userId = data.id;

                _setLocalStorageJsonItem("CurrentUser", $scope.currentUserModel);
                _setLocalStorageJsonItem("Credentials", {
                    username: $scope.registerModel.username,
                    password: $scope.registerModel.password,
                    rememberCredentials: true
                });
                _setId(data.id);

                moodleFactory.Services.PostGeolocation(-1);

                moodleFactory.Services.GetAsyncUserCourse(_getItem("userId"), function () {
                    var course = moodleFactory.Services.GetCacheJson("course");
                    moodleFactory.Services.GetAsyncUserPostCounter(data.token, course.courseid, function () {

                        //Load Quizzes assets ----------------------------------------------------------------------
                        var quizIdentifiers = [1001, 1005, 1006, 1007, 1009, 2001, 2007, 2016, 2023, 3101, 3601];
                        var i;
                        var parentActivity;
                        var childActivity = null;

                        for (i = 0; i < quizIdentifiers.length; i++) {

                            parentActivity = getActivityByActivity_identifier(quizIdentifiers[i]);

                            if (parentActivity != null) {

                                if (parentActivity.activities) {//The activity HAS a "child" activity

                                    childActivity = parentActivity.activities[0];
                                    $scope.coursemoduleid = childActivity.coursemoduleid;
                                    $scope.activityname = childActivity.activityname;
                                    $scope.activity_status = childActivity.status;

                                } else {//The activity has no "child" activity
                                    $scope.coursemoduleid = parentActivity.coursemoduleid;
                                    $scope.activityname = parentActivity.activityname;
                                    $scope.activity_status = parentActivity.status;
                                }

                                if ($scope.activity_status === 1) {//If the activity is currently finished
                                    // GET request; example: http://incluso.definityfirst.com/RestfulAPI/public/activity/150?userid=656
                                    moodleFactory.Services.GetAsyncActivityQuizInfo($scope.coursemoduleid, data.id, data.token, function() {}, function() {}, true);

                                } else {
                                    moodleFactory.Services.GetAsyncActivityQuizInfo($scope.coursemoduleid, -1, data.token, function() {}, function() {}, true);
                                }

                            } else {
                                $location.path('/');
                            }
                        }

                        var user = $scope.currentUserModel.userId;
                        var token = $scope.currentUserModel.token;
                        moodleFactory.Services.GetAsyncAvatar(user, token, function () {}, function () {}, true);
                        moodleFactory.Services.GetAsyncForumDiscussions(85, token, function () {}, function () {}, true);
                        moodleFactory.Services.GetAsyncForumDiscussions(91, token, function () {}, function () {}, true);
                        var courseModuleIds = [{"id": 1039, "userInfo": true}, {"id": 2012, "userInfo": false}, 
                            {"id": 2017,"userInfo": true }, {"id": 3302, "userInfo": false}, {"id": 3402, "userInfo": true}];
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
                        //-----------------------------------------------------------------------------------------------

                    }, function () {
                        
                        $scope.$emit('HidePreloader');
                        localStorage.setItem("offlineConnection", "offline");
                        $location.path('/');
                        
                    }, true);

                    try {
                        $scope.$emit('HidePreloader');
                        $location.path('/Tutorial');
                    } catch (e) {
                        $location.path('/ProgramaDashboard');
                    }

                }, function () {

                    $scope.$emit('HidePreloader');
                    localStorage.setItem("offlineConnection", "offline");
                    $location.path('/');
                    
                }, true);
            };

            $scope.login = function () {
                $location.path('/');
            };

            $scope.navigateToPage = function (pageNumber) {
                $scope.currentPage = pageNumber;
                $scope.$emit('scrollTop');
            };

            $scope.showPlaceHolderBirthday = function () {
                var bd = $("input[name='birthday']").val();
                if (bd) {
                    $scope.showPlaceHolder = false;
                } else {
                    $scope.showPlaceHolder = true;
                }
            };

            function change(time) {
                var r = time.match(/^\s*([0-9]+)\s*-\s*([0-9]+)\s*-\s*([0-9]+)(.*)$/);
                return r[2] + "-" + r[3] + "-" + r[1] + r[4];
            }

            $scope.datePickerClick = function () {
                if (window.mobilecheck()) {
                    cordova.exec(SuccessDatePicker, FailureDatePicker, "CallToAndroid", "datepicker", [$("input[name='birthday']").val()]);
                }
            };

            function SuccessDatePicker(data) {
                $("input[name='birthday']").val(data);
            }

            function FailureDatePicker(data) {
            }

            var registerUser = function () {

                $http({
                    method: 'POST',
                    url: API_RESOURCE.format("user"),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    data: $.param({
                        username: $scope.registerModel.username.toString().toLowerCase(),
                        firstname: $scope.registerModel.firstname,
                        lastname: $scope.registerModel.lastname,
                        mothername: $scope.registerModel.mothername,
                        password: $scope.registerModel.password,
                        email: $scope.registerModel.email,
                        city: $scope.registerModel.city,
                        country: $scope.registerModel.country,
                        secretanswer: $scope.registerModel.secretAnswer.toString().toLowerCase(),
                        secretquestion: $scope.registerModel.secretQuestion,
                        birthday: dpValue,
                        gender: $scope.registerModel.gender,
                        autologin: true
                    })
                }).success(function (data, status, headers, config) {

                    $scope.isRegistered = true;

                    //Successfully register and logged in.
                    $scope.$emit('scrollTop');

                    $scope.autologin(data);

                }).error(function (data, status, headers, config) {
                    var errorMessage;

                    if ((data != null && data.messageerror != null)) {
                        errorMessage = window.atob(data.messageerror);
                    } else {
                        errorMessage = "Problema con la red; asegúrate de tener Internet e intenta de nuevo.";
                    }

                    $scope.registerModel.modelState.errorMessages = [errorMessage];

                    $scope.$emit('HidePreloader');
                    $scope.$emit('scrollTop');
                });
            };

            function calculate_age() {
                var birth_day = dpValue.substring(0, 2);
                var birth_month = dpValue.substring(3, 5);
                var birth_year = dpValue.substring(6, 10);
                dpValue = birth_day + '/' + birth_month + '/' + birth_year;
                var today_date = new Date();
                var today_year = today_date.getFullYear();
                var today_month = today_date.getMonth();
                var today_day = today_date.getDate();

                var age = today_year - birth_year;

                if (today_month < (parseInt(birth_month, 10) - 1)) {
                    age--;
                }

                if ( ((parseInt(birth_month, 10) - 1) == today_month) && (today_day < parseInt(birth_day, 10))) {
                    age--;
                }

                return age;
            }


            function validateModel() {
                var errors = [];
                var datePickerValue = $("input[name=birthday]").val();
                dpValue = datePickerValue;
                var age = datePickerValue == "" ? age = 0 : calculate_age();
                var patternPassword = /^(?=.*[a-zñ])(?=.*[A-ZÑ])(?=.*\d)(?=.*[_\W])[\S]{8,}$/g;

                var passwordPolicy = "debe contener al menos 8 caracteres, incluir un caracter especial, una letra mayúscula, una minúscula y un número.";
                var usernamePolicy = "El nombre de usuario puede contener los siguientes caracteres: guión bajo (_), guión (-), punto(.) y arroba(@). El nombre de usuario no debe contener espacios.";

                if ( !patternPassword.test($scope.registerModel.password) ) {
                    errors.push("Formato de contraseña incorrecto. La contraseña " + passwordPolicy);
                } else {
                    if (!isConfirmedPasswordValid) {
                        errors.push("Las contraseñas capturadas no coinciden.");
                    }
                }

                if (!$scope.registerForm.userName.$valid) {
                    errors.push("Formato de usuario incorrecto. " + usernamePolicy);
                }
                if (!$scope.registerForm.firstName.$valid) {
                    errors.push("Formato de nombre incorrecto.");
                }
                if (!$scope.registerForm.lastName.$valid) {
                    errors.push("Formato de apellido paterno incorrecto.");
                }
                if (!$scope.registerForm.motherName.$valid) {
                    errors.push("Formato de apellido materno incorrecto.");
                }
                if (!$scope.registerModel.gender) {
                    errors.push("Género inválido.");
                }
                if (!$scope.registerModel.country) {
                    errors.push("País inválido.");
                }
                if (!$scope.registerModel.city) {
                    errors.push("Estado inválido.");
                }
                if (!$scope.registerForm.email.$valid) {//$error.pattern || $scope.registerForm.email.$error.required) {
                    errors.push("Formato de correo incorrecto.");
                }
                if (!$scope.registerModel.secretQuestion) {
                    errors.push("Pregunta secreta inválida.");
                }
                if (!$scope.registerForm.secretAnswer.$valid) {
                    errors.push("Respuesta secreta inválida.");
                }
                if (!$scope.registerModel.termsAndConditions) {
                    errors.push("Debe aceptar los términos y condiciones.");
                }
                if (isNaN(age) || age < 13) {
                    errors.push("Debes ser mayor de 13 años para poder registrarte.");
                }
                $timeout(function(){
                    $scope.registerModel.modelState.errorMessages = errors;
                }, 1);

                return (errors.length === 0);
            }

            /* open terms and conditions modal */
            $scope.openModal = function (size) {
                var modalInstance = $modal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'termsAndConditionsModal.html',
                    controller: 'termsAndConditionsController',
                    size: size,
                    windowClass: 'modal-theme-default terms-and-conditions',
                    backdrop: 'static'
                });
            };


            $scope.openModalUsername = function (size) {
                var modalInstance = $modal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'usernameInfoModal.html',
                    controller: 'termsAndConditionsController',
                    size: size,
                    windowClass: 'modal-theme-default terms-and-conditions',
                    backdrop: 'static'
                });
            };
            $scope.openModalPassword = function (size) {
                var modalInstance = $modal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'passwordInfoModal.html',
                    controller: 'termsAndConditionsController',
                    size: size,
                    windowClass: 'modal-theme-default terms-and-conditions',
                    backdrop: 'static'
                });
            };


            var waitForCatalogsLoaded = setInterval(waitForCatalogsLoadedTimer, 1500);

            function waitForCatalogsLoadedTimer() {

                if (_catalogsLoaded != null) {
                    clearInterval(waitForCatalogsLoaded);
                    $scope.genderItems = _getCatalogValuesBy("gender");
                    $scope.countryItems = _getCatalogValuesBy("country");
                    $scope.cityItems = $scope.stateItems = _getCatalogValuesBy("citiesCatalog");
                    $scope.securityquestionItems = _getCatalogValuesBy("secretquestion");
                    $scope.$apply();
                }
            }

        }])

    .controller('termsAndConditionsController', function ($scope, $modalInstance) {

        drupalFactory.Services.GetContent("TermsAndConditions", function (data, key) {
            $scope.contentTandC = data.node;
        }, function () {
        }, false);

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };


    });
