define('order_app', [
    'app_bar/app_bar',
    'item_list/item_list',
    'shopping_cart/shopping_cart',
    'services',
    'permission',
    'utils'],
    function() {

  angular.module('AppModule', [
      'AppBarModule',
      'ItemListModule',
      'ShoppingCartModule',
      'ServicesModule',
      'PermissionModule',
      'UtilsModule',
      ])
      .directive('body', function(rpc, perm, utils) {
        return {
          link: function(scope) {
            scope.pageLoaded = [];
            
            scope.cart = {
              size: 0,
              subTotal: 0.0,
              items: {},
              add: function(item) {
                var existing = this.items[item.id];
                if (existing) {
                  existing.count++;
                } else {
                  item.count = 1;
                  item.price = parseFloat(item.price);
                  this.items[item.id] = item;
                }
                this.update();
                scope.selectTab(1);
              },
              remove: function(id) {
                delete this.items[id];
                this.update();
              },
              update: function() {
                this.size = 0;
                this.subTotal = 0.0;
                for (var id in this.items) {
                  var item = this.items[id];
                  this.size += item.count;
                  this.subTotal += item.price * item.count;
                }
              },
              checkOut: function() {
                var user = scope.user;
                var order = {
                  user_id: user.id,
                  sub_total: this.subTotal,
                  email: user.email,
                  phone: user.phone,
                  street: user.street,
                  city: user.city,
                  state: user.state,
                  country: user.country,
                  zip: user.zip,
                  items: []
                };
                for (var id in this.items) {
                  var item = this.items[id];
                  order.items.push({
                    item_id: item.id,
                    price: item.price,
                    count: item.count
                  });
                }
                var cart = this;
                rpc.update_order(order).then(function(response) {
                  if (response.data.updated) {
                    cart.items = {};
                    cart.update();
                    scope.selectTab(1);
                  }
                });
              }
            };

            rpc.get_user().then(function(user) {
              perm.user = user;
              scope.user = user;
            });

            var pages = document.querySelector('iron-pages');
            var tabs = document.querySelector('paper-tabs');
       
            tabs.addEventListener('iron-select', function() { 
              scope.pageLoaded[pages.selected = tabs.selected] = true;
              setTimeout(function() {
                scope.$apply();
              }, 0);
            });
            
            scope.selectTab = function(index) {
              tabs.selected = index;
            };
          }
        };
      });

  angular.element(document.body).ready(function() {
    angular.bootstrap(document.body, ['AppModule']);
  });
});

require(['order_app']);
