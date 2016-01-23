define(function() {
	return angular.module('EditableLabelModule', [])
		.directive('editableLabel',
				function() {
					return {
					  scope: {
              onChange: '&',
					    label: '@',
					    type: '@',
					    value: '='
					  },
					  link: function(scope) {
					    scope.convertValue = function(toLocal) {
					      if (toLocal) {
					        if (scope.type == 'datetime') {
					          scope.localValue =
					            new Date(scope.value + ' UTC').toLocaleString();
					        } else {
					          scope.localValue = scope.value;
					        }
					      } else {
					        if (scope.type == 'datetime') {
					          scope.value =
					            new Date(scope.localValue).toUTCString()
					                .replace(' GMT', '')
					        } else {
					          scope.value = scope.localValue;
					        }
					      }
					    };

					    scope.convertValue(true);
					    
					    scope.editor = {
					      value: scope.localValue
					    };
					    scope.commit = function() {
					      scope.editing = false;
					      scope.localValue = scope.editor.value;
	              scope.convertValue(false);
					      if (scope.onChange) {
					        setTimeout(function() {
					          scope.$apply();
	                  scope.onChange();
					        }, 0);
					      }
					    };
					    scope.edit = function() {
					      scope.editing = true;
                scope.editor.value = scope.localValue;
					    };
					    scope.cancel = function() {
					      scope.editing = false;
                scope.editor.value = scope.localValue;
					    };
					    scope.keyPressed = function(event) {
					      if (event.keyCode == 13) {
					        scope.commit();
					        event.preventDefault();
					      } else if (event.keyCode == 27) {
					        scope.cancel();
					        event.preventDefault();
					      }
					    };
					  },
						templateUrl : 'js/editable_label/editable_label.html'
					};
				});
});
