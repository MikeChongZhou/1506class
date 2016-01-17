define(function() {

  return angular.module('PermissionModule', []).factory('perm',
      function() {
    return {
      user: null,
      ROLES: {
        ANONYMOUS: 0,
        STUDENT: 0x7,
        LEADER: 0xF,
        TEACHER: 0x3F,
        INSPECTION: 0x55,
        ADMIN: 0xFF
      },
      permissions: {
        0xFF: '管理员',  //4: 11111111  rw all data
        0x55: '学院督查', //4: 01010101
        0x3F: '辅导员', //3: 111111    rw class year data
        0xF: '组长',    //2: 1111     rw class data
        0x7: '学员',    //2: 0111       rw own data, r class data
        0x0: '所有人'   //0: 
      },
      isAdmin: function() {
        return this.user.permission > this.ROLES.STUDENT;
      },
      canRead: function(classInfo) {
        if (classInfo.teacher_id == this.user.id) return true;
        return this.user.permission >> (classInfo.perm_level*2);
      },
      canWrite: function(classInfo) {
        if (classInfo.teacher_id == this.user.id) return true;
        return (this.user.permission >> (classInfo.perm_level*2)) & 0x2;
      },
      level: function(permission) {
        var result = 0;
        for (;permission > 0; result++) {
          permission = (permission >> 2);
        }
        
        return result;
      }
    };
  });
});
