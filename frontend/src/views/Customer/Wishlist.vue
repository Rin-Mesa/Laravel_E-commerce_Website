<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { store } from '../../store';
import { api } from '../../services/api';
import { ShoppingCart, Trash2, ShoppingBag, Heart, LogOut, User } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);

const fetchWishlist = async () => {
  loading.value = true;
  try {
    await store.fetchWishlist();
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
};

onMounted(fetchWishlist);

const wishlist = computed(() => store.wishlist.value);
const currentUser = computed(() => store.user.value);

const initials = computed(() => {
  const name = currentUser.value?.name || 'U';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
});

const handleAddToCart = async (productId: number) => {
  await store.addToCart(productId, 1);
};

const handleRemoveFromWishlist = async (wishlistId: number) => {
  loading.value = true;
  try {
    await api.removeFromWishlist(wishlistId);
    await store.fetchWishlist();
    store.setAlert('Removed from wishlist', 'success');
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to remove item', 'error');
  } finally {
    loading.value = false;
  }
};

const handleMoveAllToCart = async () => {
  if (wishlist.value.length === 0) return;
  loading.value = true;
  try {
    for (const item of wishlist.value) {
      if (item.product_id) await api.addToCart(item.product_id, 1);
    }
    for (const item of wishlist.value) {
      await api.removeFromWishlist(item.id);
    }
    await Promise.all([store.fetchCart(), store.fetchWishlist()]);
    store.setAlert('Moved all items to cart', 'success');
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to move items', 'error');
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  await store.logout();
  router.push('/login');
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
</script>

<template>
  <div class="w-full bg-neutral-50 min-h-screen">
    <div class="max-w-[1100px] mx-auto px-4 md:px-8 py-8 md:py-12">

      <div class="mb-8">
        <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Account</p>
        <h1 class="text-2xl md:text-3xl font-bold text-neutral-900">My Wishlist</h1>
      </div>

      <!-- Hero Banner -->
      <div class="relative bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 rounded-2xl p-6 md:p-8 mb-8 overflow-hidden">
        <div class="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-12 -left-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none"></div>
        <div class="absolute top-1/2 right-1/4 w-32 h-32 bg-secondary-500/10 rounded-full blur-xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div class="relative shrink-0">
            <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
              <span class="text-white font-bold text-2xl font-mono">{{ initials }}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-white truncate">{{ currentUser?.name || 'User' }}</h2>
            <p class="text-rose-200 text-sm mt-0.5 truncate">{{ currentUser?.email || '' }}</p>
            <div class="flex items-center gap-3 mt-3 flex-wrap">
              <span class="bg-white/15 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-wider">
                {{ wishlist.length }} saved {{ wishlist.length === 1 ? 'item' : 'items' }}
              </span>
              <span class="bg-secondary-500/20 text-secondary-200 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-secondary-400/30 uppercase tracking-wider">
                {{ currentUser?.role || 'customer' }}
              </span>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut :size="15" />
            Logout
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && wishlist.length === 0" class="flex flex-col items-center py-24 gap-4 text-neutral-400">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="text-sm">Loading your saved items...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="wishlist.length === 0" class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-16 text-center">
        <Heart :size="48" class="text-neutral-300 mx-auto mb-4" />
        <h3 class="text-lg font-bold text-neutral-700 mb-2">Your wishlist is empty</h3>
        <p class="text-neutral-500 text-sm mb-6">Browse products and tap the heart icon to save your favorites.</p>
        <router-link to="/products" class="btn-primary inline-flex items-center gap-2 py-2.5 px-6 text-sm rounded-lg no-underline">
          <ShoppingBag :size="15" />
          Browse Products
        </router-link>
      </div>

      <!-- Wishlist Grid -->
      <template v-else>
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm text-neutral-500">
            Showing <strong class="text-neutral-700">{{ wishlist.length }}</strong> {{ wishlist.length === 1 ? 'item' : 'items' }}
          </p>
          <button
            @click="handleMoveAllToCart"
            :disabled="loading"
            class="btn-primary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag :size="15" />
            Move All to Cart
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="item in wishlist"
            :key="item.id"
            class="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden group transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div class="relative bg-neutral-50 h-44 flex items-center justify-center p-6">
              <img
                :src="item.product?.image_url"
                :alt="item.product?.name"
                class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=256&auto=format&fit=crop'"
              />
              <button
                @click="handleRemoveFromWishlist(item.id)"
                class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Remove"
              >
                <Trash2 :size="14" />
              </button>
            </div>

            <div class="p-5 flex flex-col gap-3">
              <div class="flex justify-between items-start gap-3">
                <h4 class="font-semibold text-neutral-900 text-sm leading-snug line-clamp-2">
                  {{ item.product?.name }}
                </h4>
                <span class="font-bold text-primary-600 whitespace-nowrap text-sm">
                  {{ formatCurrency(item.product?.price || 0) }}
                </span>
              </div>

              <p class="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                {{ item.product?.description || 'Premium product designed for quality and performance.' }}
              </p>

              <button
                @click="handleAddToCart(item.product_id)"
                class="w-full mt-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart :size="14" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>
