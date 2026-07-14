<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { store } from '../../store';
import { api } from '../../services/api';
import {
  ShoppingCart,
  Heart,
  Star,
  Search,
  Grid,
  List,
  Tag,
  Percent
} from 'lucide-vue-next';

const loading = ref(true);
const products = ref<any[]>([]);
const categories = ref<any[]>([]);
const searchQuery = ref('');
const selectedCategory = ref('all');
const sortBy = ref('discount');
const viewMode = ref<'grid' | 'list'>('grid');

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await api.getProducts();
    if (res.success) {
      products.value = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    }
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.getCategories();
    if (res.success) {
      categories.value = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    }
  } catch {
    // silently fail
  }
};

onMounted(async () => {
  await Promise.all([fetchProducts(), fetchCategories()]);
});

// Stable discount per product — computed once
const discountMap = computed(() => {
  const map = new Map<number, { originalPrice: number; percent: number }>();
  for (const p of products.value) {
    const percent = ((p.id * 7 + 13) % 31) + 10; // deterministic 10-40%
    map.set(p.id, {
      originalPrice: +(p.price * (1 + percent / 100)).toFixed(2),
      percent,
    });
  }
  return map;
});

const filteredProducts = computed(() => {
  let filtered = [...products.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  }

  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(p => p.category_id === Number(selectedCategory.value));
  }

  if (sortBy.value === 'discount') {
    filtered.sort((a, b) => (discountMap.value.get(b.id)?.percent ?? 0) - (discountMap.value.get(a.id)?.percent ?? 0));
  } else if (sortBy.value === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy.value === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy.value === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
});

const getDiscount = (productId: number) => discountMap.value.get(productId) ?? { originalPrice: 0, percent: 0 };

const handleAddToCart = async (productId: number) => {
  await store.addToCart(productId, 1);
};

const handleToggleWishlist = async (productId: number) => {
  await store.toggleWishlist(productId);
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  sortBy.value = 'discount';
};

// Countdown timer — cleaned up on unmount
const timeLeft = ref({ days: 2, hours: 14, minutes: 32, seconds: 45 });
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    const t = timeLeft.value;
    if (t.seconds > 0) t.seconds--;
    else if (t.minutes > 0) { t.minutes--; t.seconds = 59; }
    else if (t.hours > 0) { t.hours--; t.minutes = 59; t.seconds = 59; }
    else if (t.days > 0) { t.days--; t.hours = 23; t.minutes = 59; t.seconds = 59; }
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="w-full bg-neutral-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-10 py-10">
      <!-- Hero Section -->
      <div class="bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl p-12 mb-8 relative overflow-hidden">
        <div class="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full"></div>
        <div class="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-4 border border-white/30">
            <Tag :size="16" />
            <span>Limited Time Offers</span>
          </div>
          <h1 class="font-display text-4xl font-bold text-white mb-3">Hot Deals</h1>
          <p class="text-red-100 text-lg mb-6">Save up to 40% on selected premium electronics</p>

          <!-- Countdown Timer -->
          <div class="flex gap-4">
            <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center min-w-[70px] border border-white/30">
              <span class="block text-2xl font-bold text-white">{{ String(timeLeft.days).padStart(2, '0') }}</span>
              <span class="text-xs text-red-100 uppercase tracking-wider">Days</span>
            </div>
            <span class="text-2xl font-bold text-white/50 self-center">:</span>
            <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center min-w-[70px] border border-white/30">
              <span class="block text-2xl font-bold text-white">{{ String(timeLeft.hours).padStart(2, '0') }}</span>
              <span class="text-xs text-red-100 uppercase tracking-wider">Hours</span>
            </div>
            <span class="text-2xl font-bold text-white/50 self-center">:</span>
            <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center min-w-[70px] border border-white/30">
              <span class="block text-2xl font-bold text-white">{{ String(timeLeft.minutes).padStart(2, '0') }}</span>
              <span class="text-xs text-red-100 uppercase tracking-wider">Mins</span>
            </div>
            <span class="text-2xl font-bold text-white/50 self-center">:</span>
            <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center min-w-[70px] border border-white/30">
              <span class="block text-2xl font-bold text-white">{{ String(timeLeft.seconds).padStart(2, '0') }}</span>
              <span class="text-xs text-red-100 uppercase tracking-wider">Secs</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <h2 class="font-bold text-2xl md:text-3xl text-neutral-900 mb-1">Flash Sale</h2>
          <p class="text-neutral-500">{{ filteredProducts.length }} products on sale</p>
        </div>
        <div class="flex gap-2">
          <button :class="['w-11 h-11 rounded-lg flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-600']" @click="viewMode = 'grid'">
            <Grid :size="18" />
          </button>
          <button :class="['w-11 h-11 rounded-lg flex items-center justify-center transition-all', viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-600']" @click="viewMode = 'list'">
            <List :size="18" />
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white border border-neutral-200 rounded-xl p-6 mb-8 shadow-sm flex flex-wrap gap-4">
        <div class="relative flex-1 min-w-[200px]">
          <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" v-model="searchQuery" placeholder="Search deals..." class="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</label>
          <select v-model="selectedCategory" class="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="all">All Categories</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Sort By</label>
          <select v-model="sortBy" class="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="discount">Best Discount</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
          </select>
        </div>

        <button class="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors" @click="clearFilters">Clear Filters</button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-4 text-neutral-500">
        <div class="w-12 h-12 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="text-sm">Loading deals...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredProducts.length === 0" class="bg-white border border-neutral-200 rounded-2xl p-16 flex flex-col items-center text-center shadow-sm">
        <Tag :size="48" class="text-neutral-300 mb-4" />
        <h3 class="text-xl font-semibold text-neutral-900 mb-2">No deals found</h3>
        <p class="text-neutral-500 mb-6">Check back later for new offers</p>
        <button class="px-6 py-3 text-sm font-medium bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors" @click="clearFilters">Clear All Filters</button>
      </div>

      <!-- Products Grid -->
      <div v-else :class="['grid gap-6', viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1']">
        <div v-for="product in filteredProducts" :key="product.id" :class="['bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative', viewMode === 'list' ? 'flex' : '']">
          <div class="absolute top-3 left-3 z-10 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Percent :size="12" />
            <span>{{ getDiscount(product.id).percent }}% OFF</span>
          </div>

          <div :class="['relative', viewMode === 'list' ? 'w-48 shrink-0' : '']">
            <button
              class="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
              @click="handleToggleWishlist(product.id)"
              :title="store.isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'"
            >
              <Heart :size="18" :class="store.isWishlisted(product.id) ? 'fill-red-500 text-red-500' : 'text-neutral-400'" />
            </button>
            <img
              :src="product.image_url"
              :alt="product.name"
              :class="['w-full object-cover bg-neutral-100', viewMode === 'list' ? 'h-full' : 'h-48']"
              @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop'"
            />
          </div>

          <div :class="['p-4', viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : '']">
            <div>
              <span class="text-xs font-medium text-primary-600 uppercase tracking-wider">{{ product.category?.name }}</span>
              <h3 class="font-semibold text-neutral-900 mt-1 mb-2">{{ product.name }}</h3>

              <div class="flex items-center gap-2 mb-3">
                <div class="flex text-amber-400">
                  <Star v-for="i in 5" :key="i" :size="12" />
                </div>
                <span class="text-xs text-neutral-500">({{ 50 + product.id * 5 }})</span>
              </div>

              <p v-if="viewMode === 'list'" class="text-sm text-neutral-600 mb-4">
                {{ product.description || 'High-quality product with premium features.' }}
              </p>
            </div>

            <div class="flex items-center justify-between mt-4">
              <div class="flex flex-col">
                <span class="text-sm text-neutral-400 line-through">{{ formatCurrency(getDiscount(product.id).originalPrice) }}</span>
                <span class="font-bold text-lg text-neutral-900">{{ formatCurrency(product.price) }}</span>
              </div>
              <button class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2" @click="handleAddToCart(product.id)">
                <ShoppingCart :size="14" />
                <span v-if="viewMode === 'list'">Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom CSS needed - all styles use Tailwind utility classes */
</style>

