import 'dart:convert';
import 'dart:html';

import 'package:v2/model/base_entity.dart';

/// Returns the Apache url (:80) instead of webdev (:8080) url
/// to server php scripts, in local environment.
String getPHPUrl(String url) => window.location.hostname == 'localhost'
    ? 'http://localhost/1506class/$url'
    : '/$url';

Future<String> httpGetString(String url) =>
    HttpRequest.getString(getPHPUrl(url), withCredentials: true);

Future<dynamic> httpGetObject(String url) async =>
    jsonDecode(await httpGetString(url));

void login() {
  var index = window.location.pathname.lastIndexOf("/") + 1;
  var filename = window.location.pathname.substring(index);
  var url = 'login.html?redirect=$filename${window.location.search}&tag=2019';
  window.open(Uri.encodeFull(getPHPUrl(url)), '_self');
}

Future<dynamic> httpPostObject(String url, BaseEntity obj,
    {Map<String, String> extraData = const {}}) async {
  var map = obj.toMap()..addAll(extraData);
  for (var key in map.keys.toList()) {
    if (map[key] == null) {
      map.remove(key);
    }
  }
  var request = await HttpRequest.postFormData(getPHPUrl(url), map,
      withCredentials: true, responseType: 'json');
  return request.response;
}
