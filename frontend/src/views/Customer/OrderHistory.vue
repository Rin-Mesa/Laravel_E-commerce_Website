<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { store } from '../../store';
import { api } from '../../services/api';
import { 
  ShoppingBag, 
  Calendar, 
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download
} from 'lucide-vue-next';

const loading = ref(true);
const orders = ref<any[]>([]);
const selectedOrder = ref<any>(null);
const showDetailModal = ref(false);

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await api.getOrders();
    if (res.success) {
      orders.value = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    }
  } catch (e) {
    console.error('Failed to load orders', e);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchOrders();
});

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; icon: any; class: string }> = {
    'Pending': { label: 'Pending', icon: Clock, class: 'bg-tertiary-100 text-tertiary-700' },
    'Processing': { label: 'Processing', icon: Package, class: 'bg-primary-100 text-primary-700' },
    'Shipped': { label: 'Shipped', icon: Truck, class: 'bg-primary-100 text-primary-700' },
    'Delivered': { label: 'Delivered', icon: CheckCircle, class: 'bg-secondary-100 text-secondary-700' },
    'Cancelled': { label: 'Cancelled', icon: XCircle, class: 'bg-red-100 text-red-700' },
    'Completed': { label: 'Completed', icon: CheckCircle, class: 'bg-secondary-100 text-secondary-700' }
  };
  return statusMap[status] || { label: status, icon: Package, class: 'bg-tertiary-100 text-tertiary-700' };
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

const viewOrderDetail = (order: any) => {
  selectedOrder.value = order;
  showDetailModal.value = true;
};

const closeModal = () => {
  selectedOrder.value = null;
  showDetailModal.value = false;
};

const filteredOrders = computed(() => {
  return orders.value.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});
</script>

<template>
  <div class="w-full bg-neutral-50 min-h-screen">
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
      
      <!-- ── Breadcrumb ── -->
      <div class="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <router-link to="/" class="hover:text-primary-600 transition-colors">Home</router-link>
        <span>/</span>
        <span class="text-neutral-700 font-semibold">Order History</span>
      </div>

      <!-- Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Account</p>
          <h1 class="text-2xl md:text-3xl font-bold text-neutral-900">Order History</h1>
          <p class="text-sm text-neutral-500 mt-1">Track and manage your orders</p>
        </div>
        <button class="btn-secondary py-2 px-4 text-xs flex items-center gap-2" @click="fetchOrders" :disabled="loading">
          <Download :size="14" />
          Refresh
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4 text-neutral-400">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="text-sm">Loading your orders...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="orders.length === 0" class="bg-white border border-neutral-200 rounded-2xl p-16 flex flex-col items-center text-center shadow-sm">
        <ShoppingBag :size="48" class="text-neutral-300 mb-4" />
        <h3 class="text-xl font-bold text-neutral-900 mb-2">No orders yet</h3>
        <p class="text-neutral-500 text-sm mb-6">Start shopping to see your order history here</p>
        <router-link to="/" class="btn-primary px-6 py-2.5 text-sm no-underline">Start Shopping</router-link>
      </div>

      <!-- Orders list -->
      <div v-else class="space-y-4">
        <div v-for="order in filteredOrders" :key="order.id" class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="text-sm font-semibold text-neutral-900">Order #{{ order.id }}</span>
              <span class="text-sm text-neutral-500 ml-3">{{ formatDate(order.created_at) }}</span>
            </div>
            <div :class="['px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5', getStatusInfo(order.status).class]">
              <component :is="getStatusInfo(order.status).icon" :size="14" />
              <span>{{ getStatusInfo(order.status).label }}</span>
            </div>
          </div>

          <div class="flex gap-3 mb-4">
            <div v-for="item in (order.items || []).slice(0, 3)" :key="item.id" class="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
              <img 
                :src="item.product?.image_url" 
                :alt="item.product?.name"
                class="w-full h-full object-cover"
                @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=80&auto=format&fit=crop'"
              />
            </div>
            <div v-if="order.items?.length > 3" class="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-500">
              +{{ order.items.length - 3 }}
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-neutral-100">
            <span class="font-bold text-lg text-neutral-900">{{ formatCurrency(order.total || 0) }}</span>
            <button class="btn-secondary py-2 px-4 text-xs flex items-center gap-2" @click="viewOrderDetail(order)">
              <Eye :size="14" />
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <Transition name="modal">
        <div v-if="showDetailModal && selectedOrder" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click="closeModal">
          <div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" @click.stop>
            <div class="flex justify-between items-center p-6 border-b border-neutral-200">
              <h2 class="font-semibold text-lg text-neutral-900">Order #{{ selectedOrder.id }}</h2>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600" @click="closeModal">
                <span class="text-xl">&times;</span>
              </button>
            </div>

            <div class="p-6 space-y-6">
              <div>
                <h3 class="font-semibold text-neutral-900 mb-4">Order Information</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-neutral-50 rounded-lg p-4">
                    <span class="text-xs text-neutral-500 uppercase tracking-wider">Order Date</span>
                    <span class="block font-medium text-neutral-900 mt-1">{{ formatDate(selectedOrder.created_at) }}</span>
                  </div>
                  <div class="bg-neutral-50 rounded-lg p-4">
                    <span class="text-xs text-neutral-500 uppercase tracking-wider">Status</span>
                    <div :class="['mt-1 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit', getStatusInfo(selectedOrder.status).class]">
                      <component :is="getStatusInfo(selectedOrder.status).icon" :size="12" />
                      <span>{{ getStatusInfo(selectedOrder.status).label }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="font-semibold text-neutral-900 mb-4">Order Items</h3>
                <div class="space-y-3">
                  <div v-for="item in (selectedOrder.items || [])" :key="item.id" class="flex gap-4 items-center">
                    <img 
                      :src="item.product?.image_url" 
                      :alt="item.product?.name"
                      class="w-16 h-16 rounded-lg object-cover bg-neutral-100"
                      @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=80&auto=format&fit=crop'"
                    />
                    <div class="flex-1">
                      <h4 class="font-medium text-neutral-900">{{ item.product?.name }}</h4>
                      <span class="text-sm text-neutral-500">Qty: {{ item.quantity }}</span>
                    </div>
                    <span class="font-semibold text-neutral-900">{{ formatCurrency((item.product?.price || 0) * item.quantity) }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="font-semibold text-neutral-900 mb-4">Order Summary</h3>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-neutral-500">Subtotal</span>
                    <span class="font-medium text-neutral-900">{{ formatCurrency(selectedOrder.total || 0) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-neutral-500">Shipping</span>
                    <span class="font-medium text-neutral-900">Free</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-neutral-500">Tax</span>
                    <span class="font-medium text-neutral-900">{{ formatCurrency((selectedOrder.total || 0) * 0.08) }}</span>
                  </div>
                  <div class="border-t border-neutral-200 pt-3 mt-3">
                    <div class="flex justify-between">
                      <span class="font-semibold text-neutral-900">Total</span>
                      <span class="font-bold text-lg text-neutral-900">{{ formatCurrency((selectedOrder.total || 0) * 1.08) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* No custom CSS needed - all styles use Tailwind utility classes */
</style>