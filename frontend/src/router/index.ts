import { createRouter, createWebHistory } from 'vue-router';

import Home from '../views/Customer/Home.vue';
import Cart from '../views/Customer/Cart.vue';
import Wishlist from '../views/Customer/Wishlist.vue';
import ProductDetail from '../views/Customer/ProductDetail.vue';
import Products from '../views/Customer/Products.vue';
import Collection from '../views/Customer/Collection.vue';
import Deals from '../views/Customer/Deals.vue';
import Checkout from '../views/Customer/Checkout.vue';
import OrderHistory from '../views/Customer/OrderHistory.vue';
import Profile from '../views/Customer/Profile.vue';
import Login from '../views/Auth/Login.vue';
import Register from '../views/Auth/Register.vue';
import Dashboard from '../views/Admin/Dashboard.vue';
import AdminProducts from '../views/Admin/Products.vue';
import AdminCategories from '../views/Admin/Categories.vue';
import AdminOrders from '../views/Admin/Orders.vue';
import AdminUsers from '../views/Admin/Users.vue';

const routes = [
  { path: '/', component: Home, name: 'Home' },
  { path: '/products', component: Products, name: 'Products' },
  { path: '/collection', component: Collection, name: 'Collection' },
  { path: '/deals', component: Deals, name: 'Deals' },
  { path: '/products/:id', component: ProductDetail, name: 'product-detail' },
  { path: '/cart', component: Cart, name: 'Cart' },
  { path: '/checkout', component: Checkout, name: 'Checkout' },
  { path: '/wishlist', component: Wishlist, name: 'Wishlist', alias: '/profile/wishlist' },
  { path: '/orders', component: OrderHistory, name: 'Orders' },
  { path: '/profile', component: Profile, name: 'Profile' },
  { path: '/login', component: Login, name: 'Login' },
  { path: '/register', component: Register, name: 'Register' },
  { path: '/admin/dashboard', component: Dashboard, name: 'Dashboard' },
  { path: '/admin/products', component: AdminProducts, name: 'AdminProducts' },
  { path: '/admin/categories', component: AdminCategories, name: 'AdminCategories' },
  { path: '/admin/orders', component: AdminOrders, name: 'AdminOrders' },
  { path: '/admin/users', component: AdminUsers, name: 'AdminUsers' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
