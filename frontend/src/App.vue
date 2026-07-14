<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store } from './store';
import { 
  LayoutDashboard, Package, Layers, ShoppingBag, Users, Heart, Settings, LogOut,
  Search, User as UserIcon, ShoppingCart, Bell, CheckCircle, AlertCircle, Menu, X
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  await store.init();
});

const layoutType = computed(() => {
  if (route.path === '/login' || route.path === '/register') return 'login';
  if (route.path.startsWith('/admin')) return 'admin';
  if (route.path.startsWith('/profile') || route.path === '/wishlist' || route.path === '/orders') return 'customer-profile';
  return 'customer';
});

const currentUser = computed(() => store.user.value);
const cartCount = computed(() => store.cartCount.value);
const alert = computed(() => store.alert.value);
const sidebarOpen = ref(false);

const handleLogout = async () => {
  await store.logout();
  router.push('/login');
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const searchQuery = ref('');
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/products', query: { search: searchQuery.value } });
  }
};
const handleSearchKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') handleSearch();
};
</script>

<template>
  <div class="min-h-screen flex flex-col font-body bg-neutral-50 text-neutral-900">
    
    <!-- ── Toast Alerts ── -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-4 opacity-0"
    >
      <div v-if="alert" :class="[
        'fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg font-medium text-white text-sm',
        alert.type === 'success' ? 'bg-secondary-500' : alert.type === 'error' ? 'bg-red-500' : 'bg-primary-600'
      ]">
        <CheckCircle v-if="alert.type === 'success'" :size="18" />
        <AlertCircle v-else-if="alert.type === 'error'" :size="18" />
        <Bell v-else :size="18" />
        <span>{{ alert.message }}</span>
      </div>
    </Transition>

    <!-- ═══════════════════════════════════════════
         ADMIN LAYOUT
    ═══════════════════════════════════════════ -->
    <template v-if="layoutType === 'admin'">
      <!-- Mobile hamburger -->
      <button class="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-white border border-neutral-200 rounded-lg shadow-sm flex items-center justify-center text-neutral-700" @click="toggleSidebar">
        <Menu :size="20" />
      </button>

      <!-- Mobile overlay -->
      <div v-if="sidebarOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" @click="sidebarOpen = false"></div>

      <!-- ── Admin Sidebar ── -->
      <aside :class="[
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]">
        <!-- Brand -->
        <div class="h-16 px-5 flex items-center justify-between border-b border-neutral-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <span class="text-white font-bold text-sm font-mono">MS</span>
            </div>
            <div>
              <div class="font-bold text-sm text-neutral-900 leading-none">Admin</div>
              <div class="font-mono text-[10px] text-neutral-400 mt-0.5">E-Commerce</div>
            </div>
          </div>
          <button class="lg:hidden icon-btn w-7 h-7" @click="sidebarOpen = false"><X :size="14" /></button>
        </div>

        <!-- Nav -->
        <nav class="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 pt-3 pb-2">Main Menu</p>

          <router-link to="/admin/dashboard" @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium text-sm transition-all"
            active-class="bg-primary-50 text-primary-700 font-semibold">
            <LayoutDashboard :size="17" /><span>Dashboard</span>
          </router-link>

          <router-link to="/admin/products" @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium text-sm transition-all"
            active-class="bg-primary-50 text-primary-700 font-semibold">
            <Package :size="17" /><span>Products</span>
          </router-link>

          <router-link to="/admin/categories" @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium text-sm transition-all"
            active-class="bg-primary-50 text-primary-700 font-semibold">
            <Layers :size="17" /><span>Categories</span>
          </router-link>

          <router-link to="/admin/orders" @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium text-sm transition-all"
            active-class="bg-primary-50 text-primary-700 font-semibold">
            <ShoppingBag :size="17" /><span>Orders</span>
          </router-link>

          <router-link to="/admin/users" @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium text-sm transition-all"
            active-class="bg-primary-50 text-primary-700 font-semibold">
            <Users :size="17" /><span>Users</span>
          </router-link>
        </nav>

        <!-- User footer -->
        <div class="p-3 border-t border-neutral-100">
          <div v-if="currentUser" class="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 mb-2">
            <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {{ currentUser.name?.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-neutral-900 truncate">{{ currentUser.name }}</div>
              <div class="font-mono text-[10px] text-neutral-400 truncate">{{ currentUser.email }}</div>
            </div>
          </div>
          <button class="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 text-sm font-medium transition-all">
            <Settings :size="16" /><span>Settings</span>
          </button>
          <button @click="handleLogout" class="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 text-sm font-medium transition-all">
            <LogOut :size="16" /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- ── Admin Main Area ── -->
      <div class="lg:ml-64 flex flex-col min-h-screen">
        <!-- Admin Top Bar -->
        <header class="sticky top-0 z-30 bg-white border-b border-neutral-200 h-16 flex items-center px-6 gap-4">
          <div class="lg:hidden w-8"></div> 
          <div class="ml-auto flex items-center gap-2">
            <span class="label-primary text-[10px] font-mono hidden sm:inline-flex">Admin</span>
            <div v-if="currentUser" class="flex items-center gap-2 text-sm text-neutral-600">
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                {{ currentUser.name?.charAt(0).toUpperCase() }}
              </div>
              <span class="font-medium hidden sm:block">{{ currentUser.name }}</span>
            </div>
            <button @click="handleLogout" class="icon-btn hover:bg-red-50 hover:text-red-600" title="Logout">
              <LogOut :size="16" />
            </button>
          </div>
        </header>

        <!-- Admin Page Content -->
        <main class="flex-1 p-6 md:p-8 bg-neutral-50">
          <div class="max-w-7xl mx-auto animate-fade-in-up">
            <router-view />
          </div>
        </main>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════
         CUSTOMER / AUTH LAYOUT
    ═══════════════════════════════════════════ -->
    <template v-else>
      <!-- ── Customer Navbar ── -->
      <header v-if="layoutType !== 'login'" class="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div class="w-full max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex justify-between items-center">
          
          <div class="flex items-center gap-10">
            <router-link to="/" class="flex items-center gap-2">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm shadow-primary-600/30">
                <span class="text-white font-bold text-sm font-mono">MS</span>
              </div>
              <span class="font-bold text-neutral-900 text-lg tracking-tight">E-Commerce</span>
            </router-link>
            
            <nav class="hidden md:flex items-center gap-6">
              <router-link to="/products" class="nav-link" active-class="nav-link-active">Shop</router-link>
              <router-link to="/collection" class="nav-link" active-class="nav-link-active">Collections</router-link>
              <router-link to="/deals" class="nav-link" active-class="nav-link-active">
                Deals
                <span class="ml-1 label-tertiary text-[9px] py-0.5 px-1.5 align-middle">HOT</span>
              </router-link>
            </nav>
          </div>
          
          <div class="flex items-center gap-3">
            <template v-if="!currentUser">
              <div class="flex items-center gap-2">
                <button class="icon-btn"><Heart :size="18" /></button>
                <button class="icon-btn"><ShoppingCart :size="18" /></button>
                <router-link to="/login" class="btn-outlined py-2 px-4 text-xs">Sign In</router-link>
                <router-link to="/register" class="btn-primary py-2 px-4 text-xs">Register</router-link>
              </div>
            </template>
            
            <template v-else>
              <div class="flex items-center gap-2">
                <router-link to="/wishlist" class="icon-btn" title="Wishlist">
                  <Heart :size="18" :class="{ 'fill-red-500 text-red-500': store.wishlist.value.length > 0 }" />
                </router-link>
                <router-link to="/cart" class="relative icon-btn" title="Cart">
                  <ShoppingCart :size="18" />
                  <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-primary-600 text-white font-bold text-[9px] h-4 w-4 rounded-full flex items-center justify-center font-mono">{{ cartCount }}</span>
                </router-link>
                <router-link to="/profile" class="icon-btn" title="Profile">
                  <UserIcon :size="18" />
                </router-link>
                <button @click="handleLogout" class="icon-btn hover:bg-red-50 hover:text-red-600" title="Logout">
                  <LogOut :size="16" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 flex flex-col w-full">
        <router-view v-slot="{ Component }">
          <transition enter-active-class="transition duration-400 ease-out" enter-from-class="opacity-0 translate-y-3" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </template>

  </div>
</template>

<style>
.nav-link.router-link-active { font-weight: 700; color: #0f172a; }
.nav-link.router-link-active::after { width: 100%; }
</style>
