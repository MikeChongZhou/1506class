define('book_list_details/book_list_details', 
    ['services', 'utils'], function() {
  return angular.module('BookListDetailsModule', [
      'ServicesModule',
      'UtilsModule']).directive('bookListDetails', function(rpc, utils) {
    return {
      scope: {
        classInfo: '='
      },
      link: function(scope) {
        scope.$watch('classInfo', function(classInfo) {
          if (classInfo) {
            reload(classInfo);
          }
        });
        
        function reload(classInfo) {
          scope.savedInfo = angular.copy(classInfo);
          utils.requestOneByOne([getDepartments, getCategories, getBookList,
              getDepartmentBooks]);
        };
        
        scope.isDirty = function() {
          return !angular.equals(scope.classInfo, scope.savedInfo);
        };
        scope.removeItem = function(id) {
          delete scope.classInfo.bookIds[id];
        };
        scope.save = function() {
          var classInfo = scope.classInfo;
          if (!classInfo.term) {
            alert('请指定订书学期.');
            return;
          }

          var data = {
            department_id: classInfo.department_id,
            term: scope.classInfo.term,
            books: utils.map(classInfo.books, function(book) {return book.id;})
          };
          rpc.update_book_list(classInfo).then(function(response) {
            if (response.data.updated) {
              scope.savedInfo = angular.copy(classInfo);
            }
          });
        };
        scope.remove = function() {
          var term = scope.classInfo.term;
          var depId = scope.classInfo.department_id;
          rpc.remove_book_list(depId, term).then(function(response) {
            if (response.data.deleted) {
              reload(scope.classInfo);
            }
          });
        };
        scope.cancel = function() {
          scope.classInfo = angular.copy(scope.savedInfo);
        };
        scope.toggleBook = function(item) {
          var books = scope.classInfo.books;
          if (books[item.id]) {
            delete books[item.id];
          } else {
            books[item.id] = item;
          }
        };

        function getDepartments() {
          return rpc.get_departments().then(function(response) {
            return scope.departments = response.data;
          });
        }
        function getCategories() {
          return rpc.get_item_categories(99).then(function(response) {
            return scope.categories = response.data;
          });
        }
        function getDepartmentBooks() {
          var dep = scope.departments[scope.classInfo.department_id];
          return rpc.get_items(null, parseInt(dep.level)).then(function(response) {
            if (utils.isEmpty(scope.bookIds)) {
              scope.classInfo.bookIds = utils.keys(response.data);
            }
            return scope.items = response.data;
          });
        }
        function getBookList() {
          var term = scope.classInfo.term;
          var depId = scope.classInfo.department_id;
          return rpc.get_book_list(depId, term).then(function(response) {
            scope.classInfo.editing = !utils.isEmpty(response.data);
            return scope.classInfo.bookIds = response.data;
          });
        }
      },
      templateUrl : 'js/book_list_details/book_list_details.html?tag=201706062300'
    };
  });
});
