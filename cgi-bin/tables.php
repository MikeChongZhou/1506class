<?php
include_once 'datatype.php';
include_once 'connection.php';

define("CLASS_GROUP_BIT_OFFSET", 24);

$medoo = get_medoo();


function get_class_groups() {
	global $medoo;

	return $medoo->select('class_groups', '*');
}

function get_classes($class_id) {
	global $medoo;
	
	$classes = array();
	$result = $medoo->select('classes', '*', $class_id ? ["id" => $class_id] : null);

	foreach ($result as $clazz) {
		$info = new ClassInfo();
		$info->id = $clazz['id'];
		$info->name = $clazz['name'];
		$info->teacherId = $clazz['teacher_id'];
		$info->startDate = $clazz['start_date'];
		$info->endDate = $clazz['end_date'];
		
		$classes[$info->id] = $info;
	}
	
	return $classes;
}

function get_courses($class_id) {
	global $medoo;

	$sql = sprintf("SELECT * FROM courses where (course_group_id >> %d) = %d",
		CLASS_GROUP_BIT_OFFSET, $class_id >> CLASS_GROUP_BIT_OFFSET);
	$result = $medoo->query($sql)->fetchAll();
	
	if (empty($result)) {
		return $result;
	}
	
	$courses = array();
	foreach ($result as $course) {
		$courses[$course["id"]] = $course;
	}
	
	return $courses;
}

function get_users($email) {
	global $medoo;

	$result = null;
	if (empty($email)) {
		$result = $medoo->select("users", "*");
	} else {
		$result = $medoo->select('users', '*', ["email" => $email]);
	}

	$classes = get_classes(null);
	$users = array();
	
	foreach ($result as $index => $row) {
		$user = new User($row);
		$user->className = $classes[$user->classId]->name;

		$users[$index] = $user;
	}
	
	return $users;
}

function get_last_task_record($user_id, $task_id) {
	global $medoo;
	
	$sql = sprintf("SELECT count, ts FROM task_records WHERE 
		student_id=%d AND task_id=%d ORDER BY ts DESC LIMIT 1;",
		$user_id, $task_id);
	$result = $medoo->query($sql)->fetchAll();
	
	return empty($result) ? null : current($result); 
}

function task_sum($user_id, $task_id) {
	global $medoo;
	
	$sql = sprintf("SELECT sum(count) FROM task_records WHERE student_id=%d AND task_id=%d;",
		$user_id, $task_id);
	$sum = current(current($medoo->query($sql)->fetchAll()));
	return $sum == null ? 0 : $sum;
}

function get_tasks($class_id) {
	global $medoo;

 	$sql = sprintf("SELECT * FROM tasks WHERE (id >> %d) = %d;",
 		CLASS_GROUP_BIT_OFFSET, $class_id >> CLASS_GROUP_BIT_OFFSET);
 	return $medoo->query($sql)->fetchAll();
}

function report_task($user_id, $task_id, $count) {
	global $medoo;
	
	$medoo->insert("task_records", [
		"student_id" => $user_id, 
		"task_id" => $task_id, 
		"count" => $count]);
}

function convert_schedule_record($source, $string_to_int) {
	$target = array();
	
	foreach (["attended", "video", "text"] as $task) {
		if (isset($source[$task])) {
			if ($string_to_int) {
				$target[$task] = $source[$task] == "true" ? 1 : 0;
			} else {
				$target[$task] = $source[$task] == 1 ? true : false;
			}
		}
	}
	
	return $target;
}

function report_schedule_task($user_id, $schedule) {
	global $medoo;
		
	$datas = convert_schedule_record($schedule, true);
	
	$where = ["schedule_id" => $schedule["id"], "student_id" => $user_id];
	$rows = $medoo->update("schedule_records", $datas, $where);
	
	if ($rows == 0) {
		$datas["student_id"] = $user_id;
		$datas["schedule_id"] = $schedule["id"];
		$rows = $medoo->insert("schedule_records", $datas, $where);
	}
	
	return $rows;
}

function get_schedule_records($user_id) {
	global $medoo;

	$records = $medoo->select("schedule_records", "*", ["student_id" => $user_id]);
	
	$result = array();
	foreach ($records as $record) {
		$result[$record["schedule_id"]] = $record;
	}
	
	return $result;
}

function mixin($target, $source) {
	foreach ($source as $key => $value) {
		if ($value != null) {
			$target[$key] = $value;
		}
	}
	
	return $target;
}

function keyed_by_id($rows) {
	$result = array();
	
	foreach ($rows as $row) {
		$result[$row['id']] = $row;
	}
	
	return $result;
}

function get_schedules_for_group($group, $schedule_records) {
	global $medoo;

	$schedules = keyed_by_id($medoo->select("schedules", "*", ["group_id" => $group["id"]]));
	$courses = $medoo->select("courses", "*", ["group_id" => $group["course_group"]]);

	$index = 0;
	$a_week = date_interval_create_from_date_string("7 days");
	$start_time = new DateTime();
	$start_time->setTimestamp(strtotime($group["start_time"]));
	
	foreach ($schedules as $schedule_id => $schedule) {
		$schedule["dt"] = $start_time->format("Y-m-d H:i");
		$start_time = $start_time->add($a_week);
		if ($schedule["open"] == 0) {
			$schedule["course_name"] = "放假";
		} else {
			$schedule["course_name"] = $courses[$index++]["name"];
		}
		
		$schedules[$schedule_id] = $schedule;
	}

	if ($schedule_records) {
		foreach ($schedule_records as $record) {
			$schedule_id = $record["schedule_id"];
			$schedule = $schedules[$schedule_id];
			$schedules[$schedule_id] = mixin($schedule, convert_schedule_record($record, false));
		}
	}
	
	return $schedules;
}

function get_schedules($user, $with_records) {
	global $medoo;

	date_default_timezone_set('America/Los_Angeles');
	
	$schedule_groups = keyed_by_id($medoo->select("schedule_groups", "*", ["class_id" => $user->classId]));
	$schedule_records = $with_records ? get_schedule_records($user->id) : null;
	
	foreach ($schedule_groups as $group_id => $group) {
		$group["schedules"] = get_schedules_for_group($group, $schedule_records);
		$schedule_groups[$group_id] = $group;
	}
	
	return $schedule_groups;
}
?>
