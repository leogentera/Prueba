angular
    .module('incluso.program.privacyNotice', [])
    .controller('PrivacyNoticeController', [
        '$q',
        '$scope',
        '$location',
        '$routeParams',
        '$timeout',
        '$rootScope',
        '$http',
        '$modal',
        function ($q, $scope, $location, $routeParams, $timeout, $rootScope, $http, $modal) {
            $scope.$emit('ShowPreloader'); //show preloader
            $scope.setToolbar($location.$$path,"Incluso");
            $rootScope.showFooter = true;
            $rootScope.showFooterRocks = false;
            $rootScope.showStage1Footer = false;
            $rootScope.showStage2Footer = false;
            $rootScope.showStage3Footer = false;
            $scope.back = function () {
                $location.path('/ProgramaDashboard');
            }
            
            $scope.contentResources = {};
            
            function getContentResources(activityIdentifierId) {
                drupalFactory.Services.GetContent(activityIdentifierId, function (data, key) {
                    
                    $scope.contentResources = data.node;
                    $scope.$emit('HidePreloader'); //hide preloader
                    
                    }, function () { $scope.$emit('HidePreloader'); }, true);
            }

            getContentResources("PrivacyNotice");
}]);
