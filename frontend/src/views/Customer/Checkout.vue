<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../../store';
import { api } from '../../services/api';
import {
  Lock,
  Truck,
  CreditCard,
  MapPin,
  ShoppingCart,
  ShieldCheck,
  RotateCcw,
} from 'lucide-vue-next';

const router = useRouter();
const loading = ref(false);
const processing = ref(false);

const formData = ref({
  full_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  country: 'United States',
  card_number: '',
  card_name: '',
  card_expiry: '',
  card_cvc: '',
  save_address: false,
  same_as_shipping: true,
});

const errors = ref<Record<string, string>>({});

const cart = computed(() => store.cart.value);
const subtotal = computed(() => store.cartSubtotal.value);
const taxRate = 0.08;
const tax = computed(() => subtotal.value * taxRate);
const shipping = computed(() => subtotal.value >= 100 ? 0 : 9.99);
const total = computed(() => subtotal.value + tax.value + shipping.value);

onMounted(() => {
  if (store.user.value) {
    formData.value.full_name = store.user.value.name || '';
    formData.value.email = store.user.value.email || '';
  }
});

const validateForm = () => {
  errors.value = {};

  if (!formData.value.full_name.trim()) errors.value.full_name = 'Full name is required';
  if (!formData.value.email.trim()) errors.value.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) errors.value.email = 'Enter a valid email';

  if (!formData.value.phone.trim()) errors.value.phone = 'Phone number is required';
  if (!formData.value.address.trim()) errors.value.address = 'Address is required';
  if (!formData.value.city.trim()) errors.value.city = 'City is required';
  if (!formData.value.zip_code.trim()) errors.value.zip_code = 'ZIP code is required';

  if (!formData.value.card_number.trim()) errors.value.card_number = 'Card number is required';
  else if (formData.value.card_number.replace(/\s/g, '').length < 16) errors.value.card_number = 'Invalid card number';

  if (!formData.value.card_name.trim()) errors.value.card_name = 'Name on card is required';
  if (!formData.value.card_expiry.trim()) errors.value.card_expiry = 'Expiry date is required';
  if (!formData.value.card_cvc.trim()) errors.value.card_cvc = 'CVC is required';
  else if (formData.value.card_cvc.length < 3) errors.value.card_cvc = 'Invalid CVC';

  return Object.keys(errors.value).length === 0;
};

const handleCheckout = async () => {
  if (cart.value.length === 0) {
    store.setAlert('Your cart is empty', 'error');
    router.push('/');
    return;
  }

  if (!validateForm()) return;

  processing.value = true;
  try {
    const items = cart.value.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    const res = await api.post('/orders', {
      customer_name: formData.value.full_name,
      phone: formData.value.phone,
      email: formData.value.email || null,
      address: formData.value.address,
      items,
    });

    if (res.success) {
      for (const item of cart.value) {
        if (!item?.id) throw new Error('Cart item id missing');
        await store.removeFromCart(item.id);
      }
      await store.fetchCart();
      store.setAlert('Order placed successfully! Thank you for shopping.', 'success');
      router.push('/');
    }
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to place order', 'error');
  } finally {
    processing.value = false;
  }
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  return parts.length ? parts.join(' ') : v;
};

const formatExpiry = (value: string) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2, 4);
  return v;
};
</script>

<template>
  <div class="w-full bg-neutral-50 min-h-screen">
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">

      <!-- ── Breadcrumb ── -->
      <div class="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <router-link to="/" class="hover:text-primary-600 transition-colors">Home</router-link>
        <span>/</span>
        <router-link to="/cart" class="hover:text-primary-600 transition-colors">Cart</router-link>
        <span>/</span>
        <span class="text-neutral-700 font-semibold">Checkout</span>
      </div>

      <!-- ── Header ── -->
      <div class="mb-8">
        <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Secure checkout</p>
        <h1 class="text-2xl md:text-3xl font-bold text-neutral-900">Checkout</h1>
        <p class="text-sm text-neutral-500 mt-1">Complete your order securely</p>
      </div>

      <!-- ── Empty Cart ── -->
      <div
        v-if="cart.length === 0"
        class="bg-white border border-neutral-200 rounded-2xl p-16 flex flex-col items-center text-center shadow-sm"
      >
        <div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-5">
          <ShoppingCart :size="32" class="text-neutral-400" />
        </div>
        <h2 class="text-xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
        <p class="text-neutral-500 text-sm mb-6 max-w-xs">Add some items to your cart before checking out.</p>
        <router-link to="/products" class="btn-primary px-8 py-3 no-underline">Browse Products</router-link>
      </div>

      <!-- ── Checkout Layout ── -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <!-- ════════ Left Column: Forms ════════ -->
        <div class="lg:col-span-2 flex flex-col gap-6">

          <!-- ── Shipping Information ── -->
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 md:p-8">
            <div class="flex items-center gap-3 mb-6 pb-5 border-b border-neutral-100">
              <div class="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <MapPin :size="17" class="text-primary-600" />
              </div>
              <div>
                <h2 class="font-bold text-neutral-900 text-lg">Shipping Information</h2>
                <p class="text-neutral-500 text-sm mt-0.5">Where should we deliver your order?</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text" v-model="formData.full_name"
                  :class="['input-field', errors.full_name ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="errors.full_name = ''" placeholder="John Doe"
                />
                <span v-if="errors.full_name" class="text-xs text-red-500 font-mono">{{ errors.full_name }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email</label>
                <input
                  type="email" v-model="formData.email"
                  :class="['input-field', errors.email ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="errors.email = ''" placeholder="john@example.com"
                />
                <span v-if="errors.email" class="text-xs text-red-500 font-mono">{{ errors.email }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Phone</label>
                <input
                  type="tel" v-model="formData.phone"
                  :class="['input-field', errors.phone ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="errors.phone = ''" placeholder="+1 (555) 000-0000"
                />
                <span v-if="errors.phone" class="text-xs text-red-500 font-mono">{{ errors.phone }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Address</label>
                <input
                  type="text" v-model="formData.address"
                  :class="['input-field', errors.address ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="errors.address = ''" placeholder="123 Main Street"
                />
                <span v-if="errors.address" class="text-xs text-red-500 font-mono">{{ errors.address }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">City</label>
                <input
                  type="text" v-model="formData.city"
                  :class="['input-field', errors.city ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="errors.city = ''" placeholder="New York"
                />
                <span v-if="errors.city" class="text-xs text-red-500 font-mono">{{ errors.city }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">State</label>
                <input
                  type="text" v-model="formData.state"
                  class="input-field" placeholder="NY"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">ZIP Code</label>
                <input
                  type="text" v-model="formData.zip_code"
                  :class="['input-field', errors.zip_code ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="errors.zip_code = ''" placeholder="10001"
                />
                <span v-if="errors.zip_code" class="text-xs text-red-500 font-mono">{{ errors.zip_code }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Country</label>
                <select v-model="formData.country" class="input-field">
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                </select>
              </div>
            </div>

            <!-- Save address -->
            <label class="flex items-center gap-2 mt-5 text-sm text-neutral-600 cursor-pointer">
              <input
                type="checkbox" v-model="formData.save_address"
                class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Save this address for future orders</span>
            </label>
          </div>

          <!-- ── Payment Information ── -->
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 md:p-8">
            <div class="flex items-center gap-3 mb-6 pb-5 border-b border-neutral-100">
              <div class="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <CreditCard :size="17" class="text-primary-600" />
              </div>
              <div>
                <h2 class="font-bold text-neutral-900 text-lg">Payment Information</h2>
                <p class="text-neutral-500 text-sm mt-0.5">Enter your card details to complete the purchase</p>
              </div>
            </div>

            <div class="flex flex-col gap-5">
              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Card Number</label>
                <input
                  type="text" v-model="formData.card_number"
                  :class="['input-field font-mono text-sm tracking-wider', errors.card_number ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="formData.card_number = formatCardNumber(formData.card_number); errors.card_number = ''"
                  placeholder="1234 5678 9012 3456" maxlength="19"
                />
                <span v-if="errors.card_number" class="text-xs text-red-500 font-mono">{{ errors.card_number }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Name on Card</label>
                <input
                  type="text" v-model="formData.card_name"
                  :class="['input-field', errors.card_name ? '!border-red-400 !ring-red-400/20' : '']"
                  @input="errors.card_name = ''" placeholder="JOHN DOE"
                />
                <span v-if="errors.card_name" class="text-xs text-red-500 font-mono">{{ errors.card_name }}</span>
              </div>

              <div class="grid grid-cols-2 gap-5">
                <div class="flex flex-col gap-1.5">
                  <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="text" v-model="formData.card_expiry"
                    :class="['input-field', errors.card_expiry ? '!border-red-400 !ring-red-400/20' : '']"
                    @input="formData.card_expiry = formatExpiry(formData.card_expiry); errors.card_expiry = ''"
                    placeholder="MM/YY" maxlength="5"
                  />
                  <span v-if="errors.card_expiry" class="text-xs text-red-500 font-mono">{{ errors.card_expiry }}</span>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">CVC</label>
                  <input
                    type="text" v-model="formData.card_cvc"
                    :class="['input-field', errors.card_cvc ? '!border-red-400 !ring-red-400/20' : '']"
                    @input="errors.card_cvc = ''" placeholder="123" maxlength="4"
                  />
                  <span v-if="errors.card_cvc" class="text-xs text-red-500 font-mono">{{ errors.card_cvc }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 mt-5 pt-4 border-t border-neutral-100 text-sm text-neutral-500">
              <Lock :size="14" class="text-secondary-500 shrink-0" />
              <span>Your payment information is encrypted and secure</span>
            </div>
          </div>
        </div>

        <!-- ════════ Right Column: Order Summary ════════ -->
        <div class="flex flex-col gap-5">
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 sticky top-24">

            <h2 class="font-bold text-lg text-neutral-900 mb-5">Order Summary</h2>

            <!-- Cart items -->
            <div class="space-y-4 mb-6">
              <div
                v-for="item in cart"
                :key="item.id"
                class="flex gap-3"
              >
                <img
                  :src="item.product?.image_url"
                  :alt="item.product?.name"
                  class="w-16 h-16 object-cover rounded-xl bg-neutral-100 shrink-0"
                  @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=100&auto=format&fit=crop'"
                />
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-neutral-900 text-sm leading-snug truncate">
                    {{ item.product?.name }}
                  </h4>
                  <p class="font-mono text-[10px] text-neutral-400 mt-0.5">Qty: {{ item.quantity }}</p>
                </div>
                <span class="font-semibold text-neutral-900 text-sm whitespace-nowrap">
                  {{ formatCurrency((item.product?.price || 0) * item.quantity) }}
                </span>
              </div>
            </div>

            <!-- Totals -->
            <div class="border-t border-neutral-200 pt-4 flex flex-col gap-3 text-sm">
              <div class="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span class="font-semibold text-neutral-900">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span :class="shipping === 0 ? 'text-secondary-600 font-semibold' : 'font-semibold text-neutral-900'">
                  {{ shipping === 0 ? 'Free' : formatCurrency(shipping) }}
                </span>
              </div>
              <div class="flex justify-between text-neutral-600">
                <span>Tax (8%)</span>
                <span class="font-semibold text-neutral-900">{{ formatCurrency(tax) }}</span>
              </div>
            </div>

            <div class="my-4 h-px bg-neutral-200"></div>

            <div class="flex justify-between items-center mb-6">
              <span class="font-bold text-neutral-900 text-base">Total</span>
              <span class="font-bold text-xl text-neutral-900">{{ formatCurrency(total) }}</span>
            </div>

            <!-- Place Order button -->
            <button
              class="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleCheckout"
              :disabled="processing"
            >
              <Lock :size="15" v-if="!processing" />
              <span v-if="processing" class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
              <span v-else>Place Order</span>
            </button>

            <!-- Trust badges -->
            <div class="mt-4 grid grid-cols-3 gap-2">
              <div class="flex items-center gap-1.5 bg-neutral-50 rounded-lg px-2 py-2.5 justify-center">
                <ShieldCheck :size="13" class="text-secondary-500 shrink-0" />
                <span class="font-mono text-[10px] text-neutral-500 font-semibold">Secure</span>
              </div>
              <div class="flex items-center gap-1.5 bg-neutral-50 rounded-lg px-2 py-2.5 justify-center">
                <Truck :size="13" class="text-secondary-500 shrink-0" />
                <span class="font-mono text-[10px] text-neutral-500 font-semibold">Free Ship</span>
              </div>
              <div class="flex items-center gap-1.5 bg-neutral-50 rounded-lg px-2 py-2.5 justify-center">
                <RotateCcw :size="13" class="text-secondary-500 shrink-0" />
                <span class="font-mono text-[10px] text-neutral-500 font-semibold">Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All styles use Tailwind utility classes via the project's design system */
</style>
