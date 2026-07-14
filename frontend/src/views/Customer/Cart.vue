<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { store } from '../../store';
import { api } from '../../services/api';
import { useRouter } from 'vue-router';
import {
  Minus, Plus, Trash2, ArrowLeft, Lock,
  Truck, Tag, ShoppingCart, Check, ShieldCheck, RotateCcw, Plus as PlusIcon
} from 'lucide-vue-next';

const router = useRouter();
const loading = ref(false);
const promoCode = ref('');
const promoApplied = ref(false);
const promoDiscount = ref(0);
const removingId = ref<number | null>(null);

const fetchCart = async () => {
  loading.value = true;
  try { await store.fetchCart(); }
  catch (err) { console.error('Failed to load cart', err); }
  finally { loading.value = false; }
};

onMounted(async () => { await fetchCart(); });

const cart = computed(() => store.cart.value);
const subtotal = computed(() => store.cartSubtotal.value);
const taxRate = 0.08;
const tax = computed(() => subtotal.value * taxRate);
const shipping = computed(() => subtotal.value >= 100 ? 0 : 9.99);
const total = computed(() => subtotal.value + tax.value + shipping.value - promoDiscount.value);
const itemCount = computed(() => cart.value.reduce((sum: number, i: any) => sum + i.quantity, 0));

const handleQuantityChange = async (cartItem: any, change: number) => {
  const newQty = cartItem.quantity + change;
  if (newQty < 1) return;
  loading.value = true;
  try { await store.updateCartQuantity(cartItem.id, newQty); }
  finally { loading.value = false; }
};

const handleRemoveItem = async (cartId: number) => {
  removingId.value = cartId;
  try { await store.removeFromCart(cartId); }
  finally { removingId.value = null; }
};

const handleApplyPromo = () => {
  if (promoCode.value.toUpperCase() === 'INDIGO10') {
    promoDiscount.value = subtotal.value * 0.1;
    promoApplied.value = true;
    store.setAlert('Promo applied: 10% off!', 'success');
  } else {
    store.setAlert('Invalid code. Try "INDIGO10"', 'error');
  }
};

const handleCheckout = () => {
  if (cart.value.length === 0) return;
  router.push('/checkout');
};

const recommendedProducts = computed(() => {
  const products = store.products.value;
  if (!Array.isArray(products)) return [];
  const inCartIds = new Set(cart.value.map((i: any) => i.product_id));
  return products.filter((p: any) => !inCartIds.has(p.id)).slice(0, 4);
});

const handleAddRecommended = async (productId: number) => {
  await store.addToCart(productId, 1);
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
</script>

<template>
  <div class="w-full bg-neutral-50 min-h-screen">
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">

      <!-- ── Breadcrumb ── -->
      <div class="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <router-link to="/" class="hover:text-primary-600 transition-colors">Home</router-link>
        <span>/</span>
        <span class="text-neutral-700 font-semibold">Shopping Cart</span>
      </div>

      <!-- Page Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-neutral-900">Shopping Cart</h1>
          <p class="text-sm text-neutral-500 mt-1 font-mono">
            {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }} in your cart
          </p>
        </div>
        <router-link to="/products" class="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          <ArrowLeft :size="16" />
          Continue Shopping
        </router-link>
      </div>

      <!-- Empty State -->
      <div v-if="cart.length === 0" class="bg-white border border-neutral-200 rounded-2xl p-16 flex flex-col items-center text-center shadow-sm">
        <div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-5">
          <ShoppingCart :size="32" class="text-neutral-400" />
        </div>
        <h2 class="text-xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
        <p class="text-neutral-500 text-sm mb-6 max-w-xs">Looks like you haven't added anything yet. Explore our premium products!</p>
        <router-link to="/products" class="btn-primary px-8 py-3">Browse Products</router-link>
      </div>

      <!-- Cart Layout -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <!-- Cart Items -->
        <div class="lg:col-span-2 flex flex-col gap-4">

          <!-- Free shipping banner -->
          <div v-if="subtotal < 100" class="bg-secondary-50 border border-secondary-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Truck :size="18" class="text-secondary-600 shrink-0" />
            <p class="text-sm text-secondary-700">
              Add <span class="font-bold">{{ formatCurrency(100 - subtotal) }}</span> more for <span class="font-bold">free shipping!</span>
            </p>
            <div class="ml-auto w-32 bg-secondary-200 rounded-full h-2">
              <div class="bg-secondary-500 h-2 rounded-full transition-all duration-500" :style="{ width: Math.min((subtotal / 100) * 100, 100) + '%' }"></div>
            </div>
          </div>
          <div v-else class="bg-secondary-50 border border-secondary-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Check :size="18" class="text-secondary-600 shrink-0" />
            <p class="text-sm font-semibold text-secondary-700">You qualify for free shipping! 🎉</p>
          </div>

          <!-- Cart Items -->
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <!-- Table header -->
            <div class="hidden sm:grid grid-cols-12 px-6 py-3 bg-neutral-50 border-b border-neutral-200 gap-4">
              <div class="col-span-6 font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Product</div>
              <div class="col-span-2 font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">Price</div>
              <div class="col-span-2 font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">Qty</div>
              <div class="col-span-2 font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">Total</div>
            </div>

            <!-- Item rows -->
            <TransitionGroup name="cart-item" tag="div">
              <div
                v-for="item in cart"
                :key="item.id"
                class="grid grid-cols-12 gap-4 px-6 py-5 border-b border-neutral-100 last:border-0 items-center group transition-colors hover:bg-neutral-50/50"
                :class="{ 'opacity-50 pointer-events-none': removingId === item.id }"
              >
                <!-- Product image + info -->
                <div class="col-span-12 sm:col-span-6 flex items-center gap-4">
                  <div class="w-20 h-20 rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden shrink-0">
                    <img
                      :src="item.product?.image_url"
                      :alt="item.product?.name"
                      class="w-full h-full object-cover"
                      @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop'"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-neutral-900 text-sm leading-snug mb-0.5 truncate">{{ item.product?.name }}</p>
                    <p class="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">{{ item.product?.sku }}</p>
                    <button
                      @click="handleRemoveItem(item.id)"
                      class="mt-2 flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 :size="12" /> Remove
                    </button>
                  </div>
                </div>

                <!-- Price -->
                <div class="col-span-4 sm:col-span-2 text-center">
                  <p class="text-sm font-semibold text-neutral-700">{{ formatCurrency(item.product?.price || 0) }}</p>
                </div>

                <!-- Quantity -->
                <div class="col-span-4 sm:col-span-2 flex items-center justify-center">
                  <div class="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white">
                    <button
                      class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 transition-colors"
                      @click="handleQuantityChange(item, -1)"
                      :disabled="item.quantity <= 1 || loading"
                    >
                      <Minus :size="12" />
                    </button>
                    <span class="w-8 text-center text-sm font-bold text-neutral-900 font-mono">{{ item.quantity }}</span>
                    <button
                      class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 transition-colors"
                      @click="handleQuantityChange(item, 1)"
                      :disabled="loading"
                    >
                      <Plus :size="12" />
                    </button>
                  </div>
                </div>

                <!-- Line total -->
                <div class="col-span-4 sm:col-span-2 text-right">
                  <p class="text-sm font-bold text-neutral-900">{{ formatCurrency((item.product?.price || 0) * item.quantity) }}</p>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="flex flex-col gap-4">

          <!-- Order Summary card -->
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6">
            <h2 class="font-bold text-neutral-900 text-lg mb-5">Order Summary</h2>

            <div class="flex flex-col gap-3 text-sm">
              <div class="flex justify-between text-neutral-600">
                <span>Subtotal ({{ itemCount }} items)</span>
                <span class="font-semibold text-neutral-900">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span :class="shipping === 0 ? 'text-secondary-600 font-semibold' : 'font-semibold text-neutral-900'">
                  {{ shipping === 0 ? 'Free' : formatCurrency(shipping) }}
                </span>
              </div>
              <div class="flex justify-between text-neutral-600">
                <span>Estimated Tax (8%)</span>
                <span class="font-semibold text-neutral-900">{{ formatCurrency(tax) }}</span>
              </div>
              <div v-if="promoApplied" class="flex justify-between text-secondary-600">
                <span class="flex items-center gap-1.5"><Tag :size="13" /> Promo (INDIGO10)</span>
                <span class="font-semibold">−{{ formatCurrency(promoDiscount) }}</span>
              </div>
            </div>

            <div class="my-4 h-px bg-neutral-200"></div>

            <div class="flex justify-between items-center mb-5">
              <span class="font-bold text-neutral-900 text-base">Total</span>
              <span class="font-bold text-xl text-neutral-900">{{ formatCurrency(total) }}</span>
            </div>

            <!-- Checkout button -->
            <button
              @click="handleCheckout"
              class="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
              :disabled="loading"
            >
              <Lock :size="15" />
              Proceed to Checkout
            </button>

            <!-- Trust signals -->
            <div class="mt-4 grid grid-cols-2 gap-2">
              <div class="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                <ShieldCheck :size="14" class="text-secondary-500 shrink-0" />
                <span class="font-mono text-[10px] text-neutral-500 font-semibold">Secure Payment</span>
              </div>
              <div class="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                <RotateCcw :size="14" class="text-secondary-500 shrink-0" />
                <span class="font-mono text-[10px] text-neutral-500 font-semibold">Free Returns</span>
              </div>
              <div class="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                <Truck :size="14" class="text-secondary-500 shrink-0" />
                <span class="font-mono text-[10px] text-neutral-500 font-semibold">Fast Delivery</span>
              </div>
              <div class="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                <Check :size="14" class="text-secondary-500 shrink-0" />
                <span class="font-mono text-[10px] text-neutral-500 font-semibold">Genuine Products</span>
              </div>
            </div>
          </div>

          <!-- Promo Code card -->
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-5">
            <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-3">Promo Code</label>
            <div class="flex gap-2">
              <input
                type="text"
                v-model="promoCode"
                placeholder='Try "INDIGO10"'
                class="input-field text-sm py-2 flex-1"
                :disabled="promoApplied"
                :class="{ 'opacity-60': promoApplied }"
              />
              <button
                @click="handleApplyPromo"
                :disabled="promoApplied"
                class="btn-outlined py-2 px-4 text-xs shrink-0 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            <p v-if="promoApplied" class="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-secondary-600">
              <Check :size="13" /> Code applied — 10% off!
            </p>
          </div>

        </div>
      </div>

      <!-- Recommended Products -->
      <section v-if="recommendedProducts.length > 0" class="mt-14">
        <div class="flex items-center justify-between mb-5">
          <div>
            <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">You might also like</p>
            <h2 class="font-bold text-neutral-900 text-xl">Recommended for You</h2>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="product in recommendedProducts"
            :key="product.id"
            class="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <!-- Image -->
            <div class="h-36 bg-neutral-50 overflow-hidden">
              <img
                :src="product.image_url"
                :alt="product.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=256&auto=format&fit=crop'"
              />
            </div>

            <!-- Info -->
            <div class="p-3">
              <p class="font-semibold text-neutral-900 text-xs leading-snug mb-1 line-clamp-2">{{ product.name }}</p>
              <p class="font-bold text-primary-600 text-sm mb-3 font-mono">{{ formatCurrency(product.price) }}</p>
              <button
                @click="handleAddRecommended(product.id)"
                class="w-full btn-primary py-1.5 text-xs flex items-center justify-center gap-1.5"
              >
                <Plus :size="12" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.3s ease;
}
.cart-item-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(12px);
  max-height: 0;
}
</style>
