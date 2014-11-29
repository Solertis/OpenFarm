openFarmApp.directive('ofLifestage', [
  function ofLifestage(){
    return {
      restrict: 'A',
      require: '?ngModel',
      controller: ['$scope', '$element', '$attrs',
       function ($scope, $element, $attrs){
        console.log('controlling a life stage');
      }]
    };
}]);

openFarmApp.directive('stageButtons', [
  function stageButtons(){
    return {
      restrict: 'A',
      require: '?ngModel',
      scope: true,
      controller: ['$scope', '$element', '$attrs',
       function ($scope, $element, $attrs){
        // console.log($scope.)
        $scope.abledText = $attrs.abledText || 'Continue';
        $scope.disabledText = 
          $attrs.disabledText || 'You can\'t continue yet.';
        $scope.cancelText = $attrs.cancelText || 'Cancel.';
        $scope.cancelUrl = $attrs.cancelUrl || '/';
        $scope.backText = $attrs.backText || undefined;
      }],
      template:
        '<div class="button-wrapper row">' + 
          '<div class="columns large-12">' + 
            '<a class="button small secondary left"' + 
              ' name="back"' + 
              ' href="{{ cancelUrl }}"' + 
              ' ng-click="cancel(cancelUrl)">{{ cancelText }}</a>' + 
            '<input class="button small secondary left"' + 
              ' ng-if="backText"' +
              ' name="back"' + 
              ' type="submit"' + 
              ' value="{{ backText }}"' + 
              ' ng-click="previousStep()">' + 
            '<input class="button small right"' + 
              ' name="commit"' + 
              ' type="submit"' + 
              ' value="{{ newGuide.stagesActiveCount > 0 ? disabledText : abledText }}"' + 
              ' ng-disabled="!(newGuide.stagesActiveCount > 0)"' + 
              ' ng-click="nextStep()"/>' + 
          '</div>' + 
        '</div>'
    };
}]);

openFarmApp.controller('newGuideCtrl', ['$scope', '$http',
  function newGuideCtrl($scope, $http) {
  $scope.alerts = [];
  $scope.crops = [];
  $scope.step = 2;
  $scope.crop_not_found = false;
  $scope.addresses = [];
  $scope.stages = [];

  $scope.newGuide = {
    name: '',
    crop: undefined,
    overview: '',
    stagesActiveCount: 0,
    practices: {
      'organic': false,
      'permaculture': false,
      'conventional': false,
      'hydroponic': false
    }
  };

  $http.get('/api/stage_options/')
    .success(function(response, status){
      $scope.stages = response.stage_options;
      $scope.newGuide.stages = $scope.stages
        .map(function(item){
          item.selected = false;
          return item;
        });
    })
    .error(function(response, code){
      $scope.alerts.push({
        msg: code + ' error. We had trouble fetching all stage options.',
        type: 'warning'
      });
    });


  $scope.$watch('newGuide.stages', function(){
    $scope.newGuide.stagesActiveCount = 0;
    if ($scope.newGuide.stages){
      $scope.newGuide.stages
        .forEach(function(item){
          $scope.newGuide.stagesActiveCount += item.selected ? 1 : 0;
        });  
    }
  }, true);

  if (getUrlVar("crop_id")){
    $http.get('/api/crops/' + getUrlVar("crop_id"))
      .success(function(r){
        $scope.newGuide.crop = r.crop;
        $scope.query = r.crop.name;
      })
      .error(function(r, e){
        $scope.alerts.push({
          msg: e,
          type: 'alert'
        });
        console.log(e);
      });

    // $scope.default_crop = $location.search().crop_id;
  }



  //Typeahead search for crops
  $scope.search = function () {
    // be nice and only hit the server if
    // length >= 3
    if ($scope.query.length >= 3){
      $http({
        url: '/api/crops',
        method: "GET",
        params: {
          query: $scope.query
        }
      }).success(function (response) {
        if (response.crops.length){
          $scope.crops = response.crops;
        } else {
          $scope.crop_not_found = true;
        }
      }).error(function (response, code) {
        $scope.alerts.push({
          msg: code + ' error. Could not retrieve data from server. Please try again later.',
          type: 'warning'
        });
      });
    }
  };

  //Gets fired when user selects dropdown.
  $scope.cropSelected = function ($item, $model, $label) {
    $scope.newGuide.crop = $item;
    $scope.crop_not_found = false;
    $scope.newGuide.crop.description = '';
  };

  $scope.createCrop = function(){
    window.location.href = '/crops/new/?name=' + $scope.query;
  };

  $scope.nextStep = function(){
    console.log($scope.newGuide);
    $scope.step += 1;
  };

  $scope.previousStep = function(){
    $scope.step -= 1;
  };

  $scope.submitForm = function () {
    var practices = [];
    angular.forEach($scope.newGuide.practices, function(value, key){
      if (value){
        practices.push(key);
      }
    }, practices);
    var params = {
      name: $scope.newGuide.name,
      crop_id: $scope.newGuide.crop._id,
      overview: $scope.newGuide.overview || null,
      location: $scope.newGuide.location || null,
      featured_image: $scope.newGuide.featured_image || null,
      practices: practices
    };
    $http.post('/api/guides/', params)
      .success(function (r) {
        // console.log(r);
        window.location.href = "/guides/" + r.guide._id + "/edit/";
      })
      .error(function (r) {
        $scope.alerts.push({
          msg: r.error,
          type: 'alert'
        });
        console.log(r.error);
      });
  };

  // Any function returning a promise object can be used to load values asynchronously

  $scope.cancel = function(path){
    window.location.href = path || '/';
  };
}]);

