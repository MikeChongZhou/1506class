import 'dart:collection';

import 'package:angular/angular.dart';
import 'package:angular_components/material_icon/material_icon.dart';
import 'package:angular_router/angular_router.dart';
import 'package:v2/model/class_info.dart';
import 'package:v2/routing.dart';
import 'package:v2/services/class_service.dart';

@Component(
  selector: 'class-list',
  directives: [
    coreDirectives,
    MaterialIconComponent,
  ],
  templateUrl: 'class_list.html',
  styleUrls: ['class_list.css'],
)
class ClassListComponent {
  final Router _router;

  final grades = SplayTreeMap<int, List<ClassInfo>>();

  final _expanded = Set<int>();

  ClassListComponent(this._router, ClassService classService) {
    _init(classService);
  }

  void _init(ClassService classService) async {
    var classes = await classService.getClasses();
    for (var classInfo in classes.values) {
      grades.putIfAbsent(classInfo.start_year, () => []).add(classInfo);
    }
    if (_router.current != null) {
      _expandOnRouteChange(classes, _router.current);
    }
  }

  void _expandOnRouteChange(Map<int, ClassInfo> classes, RouterState state) {
    var id = int.tryParse(state.parameters['id']);
    var classInfo = classes[id];
    if (classInfo != null && !isExpanded(classInfo.start_year)) {
      toggle(classInfo.start_year);
    }
  }

  bool isExpanded(int year) => _expanded.contains(year);

  void toggle(int year) => _expanded.add(year) || _expanded.remove(year);

  void open(int classId) {
    _router.navigate(Routing.getClassRouting(classId));
  }

  bool isSelected(int id) {
    if (_router.current?.parameters == null) return false;
    return int.tryParse(_router.current.parameters['id'] ?? '') == id;
  }
}
