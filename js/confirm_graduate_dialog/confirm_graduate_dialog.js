angular.module('ConfirmGraduateDialogModule', [
  'ClassesModule',
  'ServicesModule',
  'UtilsModule',
]).directive('confirmGraduateDialog', function (rpc, utils) {
  return {
    scope: {
      classInfo: '='
    },
    link: function (scope) {
      scope.toggleSelection = function () {
        utils.forEach(scope.classInfo.users, function (user) {
          user.selected = scope.allChecked;
        });
      };

      function markClassGraduate() {
        if (!scope.classInfo.graduated) return utils.truePromise();

        rpc.update_class(scope.classInfo).then(function (response) {
          return parseInt(response.data.updated);
        });
      }
      function renameEmail(user) {
        return function () {
          return rpc.clone_user(user.id, user.newEmail, user.newClassId).then(function (response) {
            if (parseInt(response.data.updated)) {
              user.email = user.newEmail;
              return true;
            }
          });
        };
      }
      scope.graduate = function () {
        var selectedUsers = utils.where(scope.classInfo.users,
          function (user) { return user.selected; });
        var requests = utils.map(selectedUsers, renameEmail);
        requests.push(markClassGraduate);
        utils.requestOneByOne(requests);
      };

      scope.setClassId = function(user, index) {
        while (index > 0) {
          var id = scope.classInfo.users[--index].newClassId;
          if (id != scope.classInfo.id) {
            user.newClassId = id;
            break;
          }
        }
      };
    },
    templateUrl: 'js/confirm_graduate_dialog/confirm_graduate_dialog.html?tag=20190717'
  };
});
