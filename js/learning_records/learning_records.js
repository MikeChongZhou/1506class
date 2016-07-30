define('learning_records/learning_records', [
    'navigate_bar/navigate_bar', 'services', 'utils',
    'zb_sync_button/zb_sync_button'], function() {
  return angular.module('LearningRecordsModule', ['NavigateBarModule',
      'ServicesModule',
      'UtilsModule',
      'ZBSyncButtonModule'])
    .directive('learningRecords',
        function(rpc, utils) {
          return {
            scope: {
              attendence: '@',
              classId: '='
            },
            link: function($scope) {
              $scope.attendOptions = ['缺席', '出席', '请假'];
              $scope.vacation = function(schedule) {
                return !parseInt(schedule.course_id); 
              };

              $scope.$watch('classId', function() {
                $scope.reload();
              });
              
              $scope.reload = function(term) {
                rpc.get_schedules($scope.classId, term || 0, 'class')
                    .then(function(response) {
                  var group = utils.first(response.data.groups);
                  if (!group) return;

                  $scope.term = group.term;
                  $scope.schedule_groups = response.data.groups;
                  $scope.users = response.data.users;
                });
              };
              
              $scope.reportTask = function(user, course_id) {
                var record = user.records[course_id];
                record.student_id = user.id;
                record.course_id = course_id;
                rpc.report_schedule_task(record);
              };

              $scope.navigate = function(direction) {
                var term = $scope.term;
                switch (direction) {
                case 0:
                case 2:
                  term = 0;
                  break;
                case 1:
                case -1:
                  term = $scope.term + direction;
                  break;
                case -2:
                  term = 1;
                  break;
                }
                $scope.reload(term);
              };
            },
            templateUrl : 'js/learning_records/learning_records.html'
          };
        });
});
