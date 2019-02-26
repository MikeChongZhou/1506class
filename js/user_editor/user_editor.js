define('user_editor/user_editor',
    ['services', 'utils',
     'address_editor/address_editor',
     'bit_editor/bit_editor', 'classes/classes',
     'districts/districts',
     'permission_editor/permission_editor',
     'permission',
     'time/time',
     'user_input/user_input'
    ], function() {
  return angular.module('UserEditorModule', ['ServicesModule',
      'AddressEditorModule',
      'BitEditorModule', 'ClassesModule',
      'DistrictsModule',
      'PermissionEditorModule',
      'PermissionModule', 
      'TimeModule',
      'UserInputModule',
      'UtilsModule']).directive('userEditor',
          function($rootScope, perm, rpc, utils) {
    return {
      scope: {
        classMates: '=',
        user: '='
      },
      link: function($scope) {
        for (var key in utils) {
          if (key.endsWith('Labels')) {
            $scope[key] = utils[key];
          }
        }
        $scope.channels = utils.keys(utils.channelLabels);
        $scope.getDisplayLabel = function(key) {
          return $scope.user && utils.getDisplayLabel($scope.user, key);
        };

        $scope.permissions = perm.lowerPermissions();
        $scope.isSysAdmin = function() {
          return perm.isSysAdmin();
        };
        $scope.isAdmin = function() {
          return perm.isAdmin();
        };
        $scope.isYearLeader = function() {
          return perm.isYearLeader();
        };

        $scope.$watch('user', function(user) {
          $scope.editing = null;
          if ($scope.user && !$scope.user.classInfo) {
            getClassInfo();
          }
          if (user && !user.staff) {
            user.staff = {};
            rpc.get_staff(user.id).then(function(response) {
              user.staff = response.data[0] || user.staff;
              user.staff.organization = parseInt(user.staff.organization) || null;
              user.staff.manager = parseInt(user.staff.manager) || null;
            });
          }
          if (!$scope.orgLabels) {
            rpc.get_organizations().then(function(response) {
              $scope.organizations = utils.keys(response.data);
              $scope.orgLabels = {};
              for (var id in response.data) {
                $scope.orgLabels[id] = response.data[id].name;
              }
            });
          }
        });

        $scope.refreshStaffLabels = function(staff) {
          if (!staff.manager) return utils.truePromise();

          staff.manager_name = window.userInputCache[staff.manager];
          staff.manager_name = staff.manager_name.split('-')[0];
          if (staff.manager_name) {
            return utils.truePromise();
          } else {
            rpc.getUserLabel(staff.manager).then(function(response) {
              staff.manager_name = window.userInputCache[staff.manager]
                  = response.data.label;
              staff.manager_name = staff.manager_name.split('-')[0];
              return true;
            });
          }
        }

        function getClassInfo() {
          var classId = $scope.user.classId;
          return rpc.get_classes(classId).then(function(response) {
            return $scope.user.classInfo =
              response.data[classId] || response.data['' + classId];
          });
        }
        
        /// Clears all learning record by deleting the user and cloning a new 
        /// one.
        function clearLearningRecord() {
          return rpc.clone_user($scope.user.id).then(function(response) {
            if (!response.data.updated) return false;
            return $scope.user.id = response.data.updated;
          });
        }

        /// Checks whether the user's learning records need to be cleared.
        function checkClassChange() {
          var classInfo = $scope.user.classInfo;
          var previousInfo = $scope.originalUser.classInfo;
          if (parseInt(previousInfo.department_id) == 1 &&
              parseInt(classInfo.department_id) != 1) {
            return utils.truePromise();
          }
          if (classInfo.department_id != previousInfo.department_id ||
              classInfo.start_year != previousInfo.start_year) {
            if (confirm('需要清除{0}的所有学修记录吗？'.format($scope.user.name))) { 
              return clearLearningRecord();
            }
          }
          return utils.truePromise();
        }
        
        $scope.$watch('editing', function() {
          if (!$scope.editing) return;
          document.querySelector('div.user-info-editor').scrollIntoView();
          $scope.originalUser = utils.mix_in({}, $scope.user);
          $scope.error = null;
        });

        $scope.edit = function(editing) {
          $scope.editing = editing;
        };

        function saveStaffInfo(staff) {
          staff.user = $scope.user.id;
          function fillManagerName() {
            return $scope.refreshStaffLabels(staff);
          }
          function updateStaff() {
            return rpc.update_staff(staff).then(function(response) {
              var id = parseInt(response.data.updated);
              if (id) {
                $scope.editing = null;
                staff.id = staff.id || id;
              } else {
                $scope.error = response.data.error;
              }
              return true;
            });
          }
          utils.requestOneByOne([fillManagerName, updateStaff]);
        }

        $scope.save = function(editing) {
          var user = $scope.user;
          editing = editing || $scope.editing || '';
          if (editing.startsWith('staff.')) {
            return saveStaffInfo(user.staff);
          }

          var data = {id: user.id};
          switch (editing) {
          case 'address':
            data.street = user.street;
            data.city = user.city;
            data.state = user.state;
            data.country = user.country;
            data.zip = user.zip;
            break;
          case 'password':
            if (user.password != user.confirm) return;
          default:
            data[editing] = user[editing];
            break;
          }

          function updateUser() {
            return rpc.update_user(data).then(function(response) {
              if (response.data.updated && editing == 'classId') {
                $rootScope.$broadcast('class-updated', user.classId);
                return true;
              }
              
              if (response.data.updated) {
                $scope.editing = null;
              } else {
                utils.mix_in($scope.user, $scope.originalUser);
                $scope.user.confirm = null;
                $scope.error = response.data.error;
              }
              return false;
            });
          }
          
          utils.requestOneByOne([updateUser, getClassInfo]);
        };
        
        $scope.admining = window.location.href.indexOf('admin.html') > 0;
        
        $scope.getPermissionLabel = function(permission) {
          var label = perm.permissions[permission];
          if (label) return label;
          
          var perms = utils.keys(perm.permissions);
          for (var i = perms.length - 1; i >= 0; i--) {
            var p = perms[i];
            if ((p & permission) == p) {
              return perm.permissions[p];
            }
          }
        };

        $scope.deleteStaff = function() {
          if (!$scope.user.staff || !$scope.user.staff.id ||
              !confirm('请确认“{0}”退出发心'.format($scope.user.name))) {
            return;
          }
          rpc.delete_staff($scope.user.staff.id).then(function(response) {
            if (parseInt(response.data.deleted)) {
              $scope.user.staff = {};
            }
          });
        };
      },

      templateUrl : 'js/user_editor/user_editor.html?tag=201902251235'
    };
  });
});
