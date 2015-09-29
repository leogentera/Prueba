angular
    .module('incluso.programa.chatcontroller', [])
    .controller('programaChatController', [
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
            $scope.$emit('ShowPreloader'); 
            _timeout = $timeout;
            _httpFactory = $http;
            var _usercourse = JSON.parse(localStorage.getItem('usercourse'));
            var _startedActivityCabinaDeSoporte = JSON.parse(localStorage.getItem("startedActivityCabinaDeSoporte"));
            _setLocalStorageItem('chatRead', "true");
            var userId = localStorage.getItem('userId');            
            var messagesToRead = _getItem("currentStage") * 2;
            $scope.senderId = userId;
            $scope.messages = JSON.parse(localStorage.getItem('userChat'));
            $scope.currentMessage = "";
            $scope.setToolbar($location.$$path,"Cabina de Soporte");
            $rootScope.showFooter = false; 
            $rootScope.showFooterRocks = false;
            $rootScope.showStage1Footer = false;
            $rootScope.showStage2Footer = false;
            $rootScope.showStage3Footer = false; 
            var interval = -1;
            if ($location.hash() == 'top') {
            $scope.scrollToTop('anchor-bottom'); // VERY Important: setting anchor hash value for first time to allow scroll to bottom
                $anchorScroll();
            } 
            else 
            {
                moodleFactory.Services.GetUserChat(userId, getUserRefreshChatCallback, errorCallback);             
                interval = setInterval(getMessages,60000);                    
                console.log('creating interval:' + interval);
            }



            function getUserRefreshChatCallback() {
            $scope.$emit('HidePreloader'); //hide preloader
                $scope.messages = JSON.parse(localStorage.getItem('userChat'));
                validateCabinaDeSoporte();

                setTimeout(function() {
                    $anchorScroll();
                }, 1000);                
            }


            function validateCabinaDeSoporte(){                
                //$scope.scrollToTop('anchor-bottom');                       
                var finishCabinaSoporte = localStorage.getItem('finishCabinaSoporte');
                if(!finishCabinaSoporte){
                    if(_startedActivityCabinaDeSoporte) {
                    var isStarted = _startedActivityCabinaDeSoporte;
                    var currentActivity = _getActivityByCourseModuleId(_startedActivityCabinaDeSoporte.$data.moduleid, _usercourse);    

                        if (!currentActivity.status) {
                            var rawDate = isStarted.$data.datestarted.split(/:|\s|:/);
                            var dateStarted = new Date(rawDate[0], rawDate[1] - 1, rawDate[2], rawDate[3], rawDate[4], rawDate[5]);
                            var latestMessages =  _.filter($scope.messages, function(msg) { 
                                return (new Date(msg.messagedate)) > dateStarted && msg.messagesenderid != $scope.senderId;
                            });

                            if (latestMessages.length >= 2) { 
                                localStorage.removeItem("startedActivityCabinaDeSoporte");   
                                _setLocalStorageItem('finishCabinaSoporte', 'true');
                            }
                        }   
                    }                
                }
            }            

            function getMessages(){
                var existingInterval = localStorage.getItem('Interval');
                 if($location.$$path != "/Chat"){
                    //Necesitamos volver a poner en marcha el refresh de notificaciones del chat
                    if(!existingInterval){       
                    clearInterval(interval);
                        interval = setInterval(getUserChat,180000);          
                        _setLocalStorageItem('Interval', interval);
                    }                    
                 }
                 else{
                     //Si ya existe un intervalo hay que borrarlo                    
                    if(existingInterval){
                        clearInterval(parseInt(existingInterval));
                        ClearLocalStorage("Interval");
                    }                

                moodleFactory.Services.GetUserChat(userId,getUserRefreshChatCallback, errorCallback, true);                                                                                            
            }
            }   
            
            $scope.back = function () {
                var userCurrentStage = localStorage.getItem("currentStage");              
                $location.path('/ZonaDeVuelo/Dashboard/' + userCurrentStage + '/4');
            };

            $scope.sendMessage = function() {
                if($scope.currentMessage.trim() != ""){                    
                    triggerAndroidKeyboardHide();
 
                    var newMessage = {
                    messagetext: $scope.currentMessage,
                    messagesenderid: $scope.senderId,                    
                    messagedate: new Date()
                    };
                
                    /* time out to avoid android lag on fully hiding keyboard */
                    $timeout(function() {
                        $scope.messages.push(newMessage);
                        $scope.currentMessage = "";
                        var newMessages = JSON.stringify($scope.messages);                
                        _setLocalStorageItem('userChat',newMessages);
                        $anchorScroll();
                                                       
                        moodleFactory.Services.PutUserChat($scope.senderId, newMessage, getUserChatCallback, errorCallback);
                    }, 1000);
                }                
            };
            
            function getUserChat() {     
                       
                moodleFactory.Services.GetUserChat(_getItem("userId"),function() {                    
                    var chat = JSON.parse(localStorage.getItem('userChat'));
                    var userId = localStorage.getItem("userId");
                    var messagesFlow = [];
                    var messagesInterchange = 0;
                    var messagesToRead = _getItem("currentStage") * 2;
                    
                    var chatAmount = _.countBy(chat,function(messages){
                            messagesFlow.push(messages.messagesenderid != userId);
                            return messages.messagesenderid != userId;
                        });

                    _.each(messagesFlow, function(m, i){
                        if(i > 0 && m && m != messagesFlow[i - 1]){
                            messagesInterchange++;
                        }
                    });

                    if (messagesInterchange >= messagesToRead) {
                        _setLocalStorageItem("finishCabinaSoporte", "true");
                        localStorage.getItem('finishCabinaSoporte')
                    }
                                                    
                    if (chatAmount.true != localStorage.getItem('chatAmountRead')) {
                        _setLocalStorageItem('chatRead',"false");
                    }

                    _setLocalStorageItem('chatAmountRead',chatAmount.true);
                }, errorCallback, true);                
            }
            
            function getUserChatCallback() {
                //too late, we already did the scroll
//                $anchorScroll();
            }
            
            function errorCallback() { 
  //              $anchorScroll();
            }

            function triggerAndroidKeyboardHide() {
                angular.element('#chatMessages').trigger('tap');
                $anchorScroll();
            }
        }
    ]);