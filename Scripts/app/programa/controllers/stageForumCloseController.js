angular
    .module('incluso.stage.forumclosecontroller', [])
    .controller('stageForumCloseController', [
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
            _httpFactory = $http;
            _timeout = $timeout;

            var userCourse = JSON.parse(localStorage.getItem('usercourse'));
            var parentActivity = getActivityByActivity_identifier($routeParams.activityId, userCourse);
            var activityFromTree;

            if (parentActivity.activities && parentActivity.activities.length) {
                activityFromTree = parentActivity.activities[0];
            } else {
                activityFromTree = parentActivity;
            }

            $scope.activityPoints = activityFromTree.points;
            $scope.activityname = activityFromTree.activityname;
            $scope.like_status = 1;
            $scope.currentActivity = JSON.parse(moodleFactory.Services.GetCacheObject("forum/" + $scope.moodleId));

            $scope.$emit('HidePreloader');

            var endForumActivity = function(moodleid) {
                console.log('Closing time: ' + moodleid);
                $scope.$emit('ShowPreloader');
                var activities = parentActivity.activities;

                parentActivity.status = 1;
                if (activities) {
                    for(var i = 0; i < activities.length; i++) {
                        activities[i].status = 1;
                    }
                }
                _setLocalStorageJsonItem('usercourse', userCourse);

                console.log('Finishing activity...');
                var like_status = $scope.like_status;

                var userToken = JSON.parse(localStorage.getItem('CurrentUser')).token;
                var userId = localStorage.getItem('userId');

                var data = {
                    userid: userId,
                    like_status: like_status
                };

                var userCurrentStage = localStorage.getItem("currentStage");
                console.log("childs");
                console.log(activities);
                
                var finishChildCounter = 0;
                if (activities){
                    for(var i = 0; i < activities.length; i++) {
                        if ($routeParams.moodleId == 147 || $routeParams.moodleId == 148) {
                            
                            if (activities[i].coursemoduleid == $routeParams.moodleId) {
                                moodleFactory.Services.PutEndActivity(activities[i].coursemoduleid, data, activities[i], userToken, function() {
                                    
                                    console.log("end parent activity: segundo if");
                                    endParentActivity();
                                });
                            }
                            
                        }else {
                            moodleFactory.Services.PutEndActivity(activities[i].coursemoduleid, data, activities[i], userToken, function() {
                                finishChildCounter++;
                                
                                if (finishChildCounter == activities.length) {
                                    console.log("end parent activity: else - if");
                                    endParentActivity();
                                }
                            });
                        }
                    }
                }else{
                    console.log("end parent activity: else");
                    endParentActivity();
                }
               
               function endParentActivity() {
               
                    console.log("parent");
                    console.log(parentActivity.coursemoduleid);
                    moodleFactory.Services.PutEndActivity(parentActivity.coursemoduleid, data, parentActivity, userToken,
                      function(response){
                            var profile = JSON.parse(localStorage.getItem("profile/" + moodleFactory.Services.GetCacheObject("userId")));
                            var model = {
                                userId: userId,
                                stars: activityFromTree.points,
                                instance: parentActivity.coursemoduleid,
                                instanceType: 0,
                                date: new Date()
                            };
                            
                            console.log("asignar estrellas por termino de actividad");
                            moodleFactory.Services.PutStars(model, profile, userToken, function() {
                              updateActivityStatus($routeParams.activityId);
                              _updateRewardStatus();
  
                                profile.stars = Number(profile.stars) + Number(activityFromTree.points);
                                _setLocalStorageJsonItem("profile/" + moodleFactory.Services.GetCacheObject("userId"),profile);
                                $routeParams.activityId == 1049? moodleid =$routeParams.moodleId : moodleid = getMoodleIdFromTreeActivity($routeParams.activityId);
                                $scope.activity = JSON.parse(moodleFactory.Services.GetCacheObject("forum/" + moodleid ));
                                var extraPointsCounter = getForumsExtraPointsCounter();
                                var currentDiscussionCounter = _.find(extraPointsCounter, function(discussion){ return discussion.forumId == $scope.activity.forumid; });
                                var extraPoints = currentDiscussionCounter? currentDiscussionCounter.extra_replies_counter : 0;
                                extraPoints *= 50;
                                
                                if (extraPoints != 0) {
                                    updateUserForumStars($routeParams.activityId, extraPoints);
                                }
  
                                $scope.$emit('HidePreloader');
                                var activityId = Number($routeParams.activityId);
  
                                if(activityId == 1010 || activityId == 1049 || activityId == 1008 ){
                                    $location.path('/ZonaDeVuelo/Dashboard/' + userCurrentStage + '/' + getChallengeByActivity_identifier(activityId, userCourse));
                                } else if(activityId == 2030 || activityId == 2026){
                                    $location.path('/ZonaDeNavegacion/Dashboard/' + userCurrentStage + '/' + getChallengeByActivity_identifier(activityId, userCourse));
                                } else if(activityId == 3304 || activityId == 3404){
                                    $location.path('/ZonaDeAterrizaje/Dashboard/' + userCurrentStage + '/' + getChallengeByActivity_identifier(activityId, userCourse));
                                }
  
                            }, errorCallback);
                      },
                      function(){
                          var activityId = Number($routeParams.activityId);
                          if(activityId == 1010 || activityId == 1049 || activityId == 1008 ){
                              $location.path('/ZonaDeVuelo/Dashboard/' + userCurrentStage + '/' + getChallengeByActivity_identifier(activityId, userCourse));
                          } else if(activityId == 2030 || activityId == 2026){
                              $location.path('/ZonaDeNavegacion/Dashboard/' + userCurrentStage + '/' + getChallengeByActivity_identifier(activityId, userCourse));
                          } else if(activityId == 3304 || activityId == 3404){
                              $location.path('/ZonaDeAterrizaje/Dashboard/' + userCurrentStage + '/' + getChallengeByActivity_identifier(activityId, userCourse));
                          }
                      });
                }

            };


            $scope.finishActivity = function () {
                var moodleId = getMoodleIdFromTreeActivity($routeParams.activityId);
                endForumActivity(moodleId);
            }

            var getForumsExtraPointsCounter = function() {
                var userId = moodleFactory.Services.GetCacheObject("userId");
                var forumExtraPointsCounter = JSON.parse( localStorage.getItem('extraPointsForums/'+ userId));
                return forumExtraPointsCounter;
            };



        }]).controller('tutorialController', function ($scope, $modalInstance) {
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        });   