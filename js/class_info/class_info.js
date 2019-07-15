define('class_info/class_info', ['bit_editor/bit_editor',
    'class_editor/class_editor',
    'new_user_dialog/new_user_dialog', 
    'serial_number_dialog/serial_number_dialog',
    'users/users',
    'permission', 'services',
    'utils',
    'zb_sync_button/zb_sync_button'], function() {

  return angular.module('ClassInfoModule', ['BitEditorModule',
    'ClassEditorModule',
    'NewUserDialogModule',
    'SerialNumberDialogModule',
    'UsersModule',
    'PermissionModule', 'ServicesModule',
    'UtilsModule', 'ZBSyncButtonModule'])
        .directive('classInfo', function($rootScope, perm, rpc, 
            utils) {
      return {
        scope: {
          classId: '='
        },
        restrict: 'E',
        link: function($scope) {
          $scope.isNewClass = function() {
            return $scope.classId === 1;
          };
          $scope.reload = function(classId) {
            if (!classId) return; 
            rpc.get_users(null, classId).then(function(response) {
              if (!(response.data instanceof String)) {
                $scope.users = response.data;
              }
            });
          };
          $scope.$watch('classId', function(classId) {
            $scope.reload(classId);
          });
          $scope.showNewUserDialog = function() {
            document.getElementById('new-user-dlg').open();
          };
          $scope.showEmailDialog = function() {
        	    rpc.get_classes($scope.classId).then(function(response) {
        	    	  var classInfo = response.data[$scope.classId];
                  classInfo.users = angular.copy($scope.users);
                  classInfo.user_count = utils.keys(classInfo.users).length;
        	    	  utils.showEmailDialog([classInfo]);
        	    });
          };

          $scope.graduate = function() {

            rpc.get_classes($scope.classId).then(function(response) {
            
            var classInfo= response.data[$scope.classId];
            classInfo.users = angular.copy($scope.users);
            classInfo.user_count = utils.keys(classInfo.users).length;

            var brfclsname=['','jc','rxl','jx','jt','mf','wl','nf','gdh','tc','yj','xx','xj'];
            var pref_graduate = 'g.';
            if(String(classInfo.start_year).length == 4 )
            {
              pref_graduate += String(classInfo.start_year).slice(-2) +'.';
            }
            else
              return;

            pref_graduate = pref_graduate + String(brfclsname[classInfo.department_id])+'.';

            var date = new Date();
            var year = date.getFullYear();
            if ((year-classInfo.start_year) != 4)
            {
              confirm('�ð༶���໹�������꣬������ִ�б�ҵ������лл��');
              return;
            }

            if(classInfo.graduated == 1)
            {
              confirm('�ð༶״̬ �Ѿ��� ��ҵ�������ظ������лл��');
              return;
            }

            if (!confirm('\n��ȷ���Ƿ��޸� �ð༶״̬Ϊ �ѱ�ҵ��\n ���ȷ��ǰ��ȷ�ϰ༶������ѧԱ����������ҵ��\n �ð༶����ѧԱ��email��ַ������ǰ׺'+pref_graduate)) return;

            classInfo.graduated = 1;
            rpc.update_class(classInfo).then(function(response) {
              if (response.data.updated) {
                var id = classInfo.id || response.data.updated;
                $rootScope.$broadcast('class-graduated', id);
                scope.reload(id);
              } else {
                scope.error = response.data.error;
              }
            });

            for (var index in classInfo.users) {
              classInfo.users[index].email = pref_graduate + classInfo.users[index].email;
              rpc.update_user(classInfo.users[index]).then(function(response) {
                if (!response.data.updated) {
                  scope.error = response.data.error;
                }
              });
            }

        });

          $rootScope.$broadcast('class-graduated', $scope.classid);
          scope.reload($scope.classid);
        }             

        },
        templateUrl : 'js/class_info/class_info.html?tag=201810062245'
      };
    });
});
