angular
    .module('incluso.programa.dashboard.etapa', [])
    .controller('programaEtapaController', [
        '$q',
        '$scope',
        '$location',
        '$routeParams',
        '$timeout',
        '$rootScope',
        '$http',
        '$modal',
        function ($q, $scope, $location, $routeParams, $timeout, $rootScope, $http, $modal) {
            /* $routeParams.stageId */
            _httpFactory = $http;
            $scope.Math = window.Math;
            $scope.$emit('ShowPreloader'); //show preloader
            $rootScope.navbarBlue = true;
            $rootScope.showToolbar = true;
            $rootScope.showFooter = true;
            $rootScope.showFooterRocks = false;
            $scope.scrollToTop();
            $scope.$emit('HidePreloader'); //hide preloader

            var closingStageModal = localStorage.getItem('closeStageModal');
            if (closingStageModal == 'true') {
                openStageModal();
                localStorage.setItem('closeStageModal', 'false');
            }        
            
            $scope.activitiesCompletedInCurrentStage = [];
            $scope.isCollapsed = false;

            var activitiesURLs = [
                ["/ZonaDeVuelo/ExploracionInicial/zv_exploracionInicial"],
                ["/ZonaDeVuelo/CuartoDeRecursos/FuenteDeEnergia/zv_cuartoderecursos_fuentedeenergia"],
                ["/ZonaDeVuelo/Conocete/FuenteDeEnergia/zv_conocete_fuentedeenergia", "/ZonaDeVuelo/Conocete/RetoMultiple/zv_conocete_retomultiple", "/ZonaDeVuelo/Conocete/PuntoDeEncuentro/Topicos/64", "/ZonaDeVuelo/Conocete/ZonaDeContacto"],
                ["/ZonaDeVuelo/MisSuenos/FuenteDeEnergia/zv_missuenos_fuentedeenergia", "/ZonaDeVuelo/MisSuenos/MisGustos/zv_missuenos_misgustos", "/ZonaDeVuelo/MisSuenos/MisCualidades/zv_missuenos_miscualidades", "/ZonaDeVuelo/MisSuenos/Suena/zv_missuenos_suena", "/ZonaDeVuelo/MisSuenos/PuntosDeEncuentro/Topicos/zv_missuenos_puntosdeencuentro"],
                ["/ZonaDeVuelo/CabinaDeSoporte/zv_cabinadesoporte_chat"],
                ["/ZonaDeVuelo/ExploracionFinal/zv_exploracionfinal"]];

            $scope.goToUrl = function (challenge, activity) {
                $location.path(activitiesURLs[challenge][activity]);
            };

            $scope.model = JSON.parse(localStorage.getItem("usercourse"));
            $scope.idEtapa = 0; //We are in Stage 1
            $scope.nombreEtapaActual = $scope.model.stages[$scope.idEtapa].sectionname;

            var totalDeEtapas = $scope.model.stages.length; //Total amount of stages
            var totalDeRetos = 0; //Total number of challenges, along all possible stages
            var totalDeActividades = 0; //Total number of activities, along all challenges in all stages
            var i, j, k; //Getting total number of challenges along all stages (1, 2 y 3)

            for (i = 0; i < totalDeEtapas; i++) {
                totalDeRetos += $scope.model.stages[i].challenges.length;
            }

            // Count of whole activities along all Stages
            for (i = 0; i < totalDeEtapas; i++) {
                var numOfChallenges = $scope.model.stages[i].challenges.length;

                for (j = 0; j < numOfChallenges; j++) {
                    totalDeActividades += $scope.model.stages[i].challenges[j].activities.length;
                }
            }

            var avanceEnEtapaActual = 0;
            var totalActividadesEnEtapaActual = 0; //Attainment of user in the current Stage
            var retosEnEtapaActual = $scope.model.stages[$scope.idEtapa].challenges.length;

            for (j = 0; j < retosEnEtapaActual; j++) {
                var numActividadesParcial = $scope.model.stages[$scope.idEtapa].challenges[j].activities.length;

                for (k = 0; k < numActividadesParcial; k++) {
                    avanceEnEtapaActual += $scope.model.stages[$scope.idEtapa].challenges[j].activities[k].status;
                    totalActividadesEnEtapaActual++;
                }
            }

            $scope.avanceEnEtapaActual = Math.ceil(avanceEnEtapaActual * 100 / totalActividadesEnEtapaActual);
            $scope.retosIconos = {
                "Exploración Inicial": "assets/images/challenges/stage-1/img-evaluacion inicial.svg",
                "Cuarto de recursos": "assets/images/challenges/stage-1/img-cuarto-recursos.svg",
                "Conócete": "assets/images/challenges/stage-1/img-conocete.svg",
                "Mis sueños": "assets/images/challenges/stage-1/img-mis-suenos.svg",
                "Cabina de soporte": "assets/images/challenges/stage-1/img-cabina-soporte.svg",
                "Exploración final": "assets/images/challenges/stage-1/img-evaluacion final.svg"
            };

            $scope.playVideo = function (videoAddress, videoName) {
                playVideo(videoAddress, videoName);
            };

            $scope.startActivity = function (activity) {
                var currentUser = JSON.parse(localStorage.getItem("CurrentUser"));
                // Temporary
                activity = {
                    groupid:"10_-1_ActivityManager",
                    parentsection:1,
                    section:10,
                    sectionname:"Cabina de soporte",
                    activityname:"Cabina de soporte",
                    activity_type:"ActivityManager",
                    activityintro:"",
                    coursemoduleid:68,
                    points:400,
                    activity_identifier:"1002",
                    courseid:4,
                    status:0,
                    firsttime:0,
                    last_status_update:null,
                    optional:0,
                    activities:[]
                };

                var data = {
                    userId: currentUser.userId,
                    datestarted: "",
                    moduleid: activity.coursemoduleid,
                    updatetype: 1
                };

                moodleFactory.Services.PutStartActivity(data, activity, currentUser.token function () {
                    setTimeout(function() { 
                        var modalInstance = $modal.open({
                            animation: $scope.animationsEnabled,
                            templateUrl: 'cabinaSoporteMsj.html',
                            controller: function ($scope, $modalInstance) {
                                $scope.cancel = function () {
                                    $modalInstance.dismiss('cancel');
                                };
                            },
                            size: size,
                            windowClass: 'user-help-modal'
                        });

                        console.log("modal open");
                    }, 500);
                });
            }
        
            function openStageModal(){
                    console.log("opening");
                    //setTimeout(function(){ 
                    var modalInstance = $modal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'ClosingStage.html',
                        controller: 'closingStageController',
                        //size: size,
                        windowClass: 'closing-stage-modal user-help-modal'
                    });
                    console.log("modal open closing");
                    //}, 1000);
                }
        }])
        .controller('closingStageController', function ($scope, $modalInstance) {
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        });
