define('users/users', ['bit_editor/bit_editor',
    'importers', 'permission', 'services',
    'districts/districts',
    'user_editor/user_editor',
    'utils'], function() {

  return angular.module('UsersModule', ['BitEditorModule',
    'ClassLabelModule',
    'DistrictsModule',
    'ImportersModule',
    'PermissionModule', 'ServicesModule',
    'UserEditorModule', 'UtilsModule'])
        .directive('users', function($rootScope, importers, perm, rpc, utils) {
      return {
        scope: {
          users: '=',
          classId: '=',
          showMoreActions: '@',
          showSerialButton: '@',
          onDelete: '&'
        },
        restrict: 'E',
        link: function($scope) {
          $scope.entrances = ['本站', '微信', 'zbfw'];
          $scope.isNewClass = function() {
            return $scope.classId === 1;
          };
          $scope.batchChange = {district: null};
          $scope.$watch('batchChange.district', (district) => {
            var message = ('您确定要移动{0}位用户的地区吗？' +
                '该操作不能撤销。').format($scope.userCount());
            if (!district || !confirm(message)) return;

            $scope.showActions = false;
            var updated = 0;
            var requests = utils.map($scope.users, (user) => (() => {
              var data = {id: user.id, district: district};
              return rpc.update_user(data).then((response) => {
                if (response.data.updated) {
                  updated++;
                  user.district = district;
                }
                return true;
              });
            }));
            utils.requestOneByOne(requests).then(() => {
              var toast = utils.showInfo('成功修改{0}位用户'.format(updated));
              toast.style.top = '0';
            });
          });

          $scope.$watch('users', function(users) {
            $scope.isNotEmpty = !utils.isEmpty($scope.users);
            $scope.userNames = {};
            for (var id in $scope.users) {
              var user = $scope.users[id];
              $scope.userNames[user.id] = user.name;
              utils.setCountryLabels(user);
            }
            $scope.editingUser = $scope.editingUser &&
                utils.firstElement($scope.users, 'id', $scope.editingUser.id);
            if ($scope.exportedUrl) {
              window.URL.revokeObjectURL($scope.exportedUrl);
              $scope.exportedUrl = null;
            }
          });
          $scope.isSysAdmin = function() {
            return perm.isSysAdmin();
          };
          $scope.isAdmin = function(user) {
            return user.permission > perm.ROLES.STUDENT;
          };
          $scope.isDistrictInspector = function(user) {
            return perm.isDistrictInspector();
          };
          $scope.showInfo = function(user, index) {
            $scope.editingUser = user;
            $scope.selectedTop = index * 32;
          };
          $scope.$on('editing-user-changed', function(event, editingUser) {
            $scope.editingUser = editingUser;
          });
          $scope.remove = function(user) {
            var message = '请确认删除用户"{0}"({1}).'.format(user.name, 
                user.email);
            if (!confirm(message)) return;

            rpc.remove_user(user.id).then(function(response) {
              if (response.data.deleted) $scope.onDelete();
            });
          };
          $scope.selected = function(user) {
            return $scope.editingUser && $scope.editingUser.id === user.id;
          };
          $scope.updateEnroll = function(user) {
            rpc.update_user({id: user.id, enroll_tasks: user.enroll_tasks});
          };
          $scope.userCount = function() {
            return $scope.users && utils.keys($scope.users).length;
          };
          $scope.exportUsers = function() {
            importers.userImporter.exportUsers($scope.users,
                $scope.exportedUrl).then(function(url) {
                  $scope.exportedUrl = url;
                });
          };
          $scope.showSerialNumberDlg = function() {
            document.querySelector('#serial-number-dlg').open();
          };
        },
        templateUrl : 'js/users/users.html?tag=201905032307'
      };
    });
});
