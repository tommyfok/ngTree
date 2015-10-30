var ngTreeTpl = ''
+'<li class="tree-node" ng-repeat="child in parent" ng-class="liClass(child,$index == parent.length - 1)">'
	+'<i class="tree-icon tree-ocl" ng-click="open(child,$index == parent.length - 1)"></i>'
	+'<a href="#" class="tree-anchor" ng-class="{\'tree-checked\': child.checked, \'tree-hover\': child.hovered}" ng-click="select(child,parent)" ng-mouseenter="mouseenter(child)" ng-mouseleave="mouseleave(child)">'
		+'<i ng-if="conf.hasCheckbox" class="tree-icon tree-checkbox" ng-class="{\'tree-mixin\': child.mixin}"></i>'
		+'{{child.text}}'
	+'</a>'
	+'<ul ng-show="child.opened" ng-if="child.child && child.child.length" ng-include="\'ngTreeTpl\'" ng-init="parent=child.child"></ul>'
+'</li>';

if (!document.getElementById('ngTreeTpl')) {
	var ngTreeTplScript = document.createElement('script');
	ngTreeTplScript.id = 'ngTreeTpl';
	ngTreeTplScript.type= 'text/ng-template';
	ngTreeTplScript.innerHTML = ngTreeTpl;
	document.body.appendChild(ngTreeTplScript);
}

angular.module('ngTree', [])
.directive('ngTree', function() {
	return {
		restrict: 'AE',
		scope: {
			data: '=ngTree',
			onclick: '=ngTreeClick',
			conf: '=ngTreeConfig',
			inst: '=ngTreeInstance'
		},
		template: ngTreeTpl,
		link: function(scope, elem) {
			scope.inst = scope.inst || {};

			elem.addClass('tree-container');

			scope.$watchCollection('data', function() {
				scope.parent = dataProcess(angular.copy(scope.data));
			});

			//平面化的数据结构 to 树形数据结构

			function dataProcess(data) {
				var arrs = [];

				angular.forEach(data, function(o, i) {
					var id = o.id;

					angular.forEach(data, function(m, j) {
						if (id == m.parent) {
							if (!o.child) {
								o.child = [];
							}
							o.child.push(m);
						}
					});
					if (o.parent == '#') {
						arrs.push(o);
					}
				});

				data = null;

				return arrs;
			};

			//树形数据结构 to 平面化的数据结构

			function reversionData(data) {
				var arrs = [];

				(function(d) {
					var r = arguments.callee;
					angular.forEach(d, function(o, i) {
						var child = o.child
						if (child && child.length) {
							delete o.child;
							arrs.push(o);
							r(child);
						} else {
							arrs.push(o);
						}
					});
				})(data);

				return arrs;
			}

			scope.currentSelected = null;

			scope.select = function(item, items) {
				//单选
				if (!scope.conf.hasCheckbox) {
					//重置之前选中的节点
					if (scope.currentSelected) {
						scope.currentSelected.checked = false;
					}

					scope.currentSelected = item;
					item.checked = true;
				}
				//多选
				else {
					item.checked = !item.checked;
					item.mixin = false;

					//处理子节点状态
					var _data = changeChildStatus(item);

					//处理父节点状态
					changeParentStatus(item, _data);

				}

				//点击节点的回调
				if (angular.isFunction(scope.onclick)) {
					scope.onclick(item, scope.parent);
				}
			};

			function changeChildStatus(item) {
				var data = reversionData(scope.parent);
				(function(id, checked) {
					var r = arguments.callee;
					angular.forEach(data, function(o, i) {
						if (id == o.parent) {
							o.checked = checked;
							r(o.id, checked);
						}
					});
				})(item.id, item.checked);

				return data;
			}

			function changeParentStatus(item, data) {
				if (item.parent == '#') {
					scope.data = data;
					return;
				}
				var checked = item.checked;

				//先收集父节点
				var parents = [];
				(function(parentId) {
					var r = arguments.callee;
					angular.forEach(data, function(o, i) {
						if (parentId == o.id) {
							parents.push(o);
							r(o.parent);
						}
					});
				})(item.parent);

				var mixin = false;
				//再看看父节点下的子节点的checked情况
				angular.forEach(parents, function(o, i) {
					var id = o.id;
					var _checked = [];
					angular.forEach(data, function(m, j) {
						if (id == m.parent) {
							_checked.push(m.checked || false);
						}
					});

					var _checkedStr = _checked.join('');

					if (/true/.test(_checkedStr) && /false/.test(_checkedStr)) {
						o.mixin = true;
						o.checked = false;
					} else {
						o.mixin = false;
						o.checked = checked;
					}
				});

				scope.data = data;
			}

			scope.mouseenter = function(item) {
				item.hovered = true;
			};

			scope.mouseleave = function(item) {
				item.hovered = false;
			};

			scope.open = function(item, isLast) {
				var parentClass = scope.liClass(item, isLast);
				if (/leaf/.test(parentClass)) {
					return;
				}
				item.opened = /closed/.test(parentClass);
			};

			scope.liClass = function(item, isLast) {
				var className = '';
				if (item.child && item.child.length) {
					if (item.opened) {
						className = 'tree-open';
					} else {
						className = 'tree-closed';
					}
				} else {
					className = 'tree-leaf';
				}

				if (isLast) {
					className += ' tree-last'
				}

				return className;
			}

			//面向业务的方法
			//
			//
			scope.inst = {
				//新增节点
				addNode: function(node) {
					var data = reversionData(scope.parent);
					data.push(node);

					scope.data = data;
				},

				//删除节点
				removeNode: function(nodeId) {
					var data = reversionData(scope.parent);
					var ids = [];

					(function(id, isr) {
						var r = arguments.callee;
						angular.forEach(data, function(o, i) {
							if (o.id == id && !isr) {
								ids.push(i);
							} else if (o.parent == id) {
								ids.push(i);
								r(o.id, true);
							}
						});
					})(nodeId);

					angular.forEach(ids, function(v, i) {
						data.splice(v - i, 1);
					});

					scope.data = data;
				},

				//获取选中的节点
				getSelected: function() {
					if (!scope.conf.hasCheckbox) {
						return scope.currentSelected;
					}

					var data = reversionData(angular.copy(scope.parent));
					var arrs = [];
					angular.forEach(data, function(o, i) {
						if (o.checked) {
							arrs.push(o);
						}
					});

					return arrs;
				}
			};
		}
	};
});
