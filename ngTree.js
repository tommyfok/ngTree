var ngTreeTpl = ''
+'<li class="ngTree" ng-repeat="child in parent" ng-class="{hasChild: child.children.length, opened: child.ngTreeShow}">'
+'  <a ng-bind="child.text" ng-click="clickItem(child)"></a>'
+'  <ul ng-show="child.ngTreeShow" ng-if="child.children.length" ng-include="\'ngTreeTpl\'" ng-init="parent=child.children"></ul>'
+'</li>';

var ngTreeStyle = '<style>.ngTree{-webkit-user-select:none}.ngTree>a{padding-left:13px}.ngTree.hasChild{position:relative}.ngTree.hasChild>a{font-weight:bold}.ngTree.hasChild:before{content:"";width:0;height:0;left:0;top:10px;border:5px solid transparent;border-left-color:#aaa;position:absolute}.ngTree.hasChild.opened:before{border-left-color:transparent;border-top-color:#aaa;left:-3px;top:13px}.ngTree,.ngTree li{cursor:pointer;list-style:none;line-height:30px}.ngTree ul{padding:0;margin:0 2px;padding-left:7px;border-left:1px dotted #ddd}</style>';

if (!document.getElementById('ngTreeTpl')) {
  var ngTreeTplScript = document.createElement('script');
  ngTreeTplScript.id = 'ngTreeTpl';
  ngTreeTplScript.type= 'text/ng-template';
  ngTreeTplScript.innerHTML = ngTreeTpl;
  document.body.appendChild(ngTreeTplScript);
}

angular.module('ngTree', [])
.directive('ngTree', function () {
  return {
    restrict: 'AE',
    require: ['?ngModel'],
    scope: {
      parent: '=ngTree',
      onclick: '=ngTreeClick'
    },
    template: ngTreeTpl + ngTreeStyle,
    link: function (scope, elem) {
      elem.addClass('ngTree');
      scope.clickItem = function (item) {
        if (item.children) {
          item.ngTreeShow = !item.ngTreeShow;
        } else {
          if (angular.isFunction(scope.onclick)) {
            scope.onclick(item, scope.parent);
          }
        }
      }
    }
  };
});
