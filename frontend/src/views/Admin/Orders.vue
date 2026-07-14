<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { store } from '../../store';
import {
  Plus,
  Search,
  ChevronDown,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  DollarSign,
  X,
  Package
} from 'lucide-vue-next';

// Component state
const orders = ref<any[]>([]);
const search = ref('');
const statusFilter = ref('all');
const loading = ref(true);

// Pagination
const currentPage = ref(1);
const itemsPerPage = 8;

// Modal state
const isModalOpen = ref(false);
const selectedOrder = ref<any | null>(null);

// Stats
const todayRevenue = ref(0);

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await api.getOrders();
    if (res.success) {
      orders.value = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      // Calculate today's revenue
      const today = new Date().toISOString().split('T')[0];
      todayRevenue.value = orders.value
        .filter(o => o.created_at && o.created_at.startsWith(today))
        .reduce((sum, o) => sum + (o.total || 0), 0);
    }
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to fetch orders', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchOrders();
});

// Filtering and Searching
const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    const matchesSearch =
      o.id.toString().includes(search.value) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search.value.toLowerCase())) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(search.value.toLowerCase()));

    const matchesStatus =
      statusFilter.value === 'all' ||
      o.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

// Paginated orders
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredOrders.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage) || 1;
});

// Computed Metrics
const pendingCount = computed(() => {
  return orders.value.filter(o => o.status === 'pending').length;
});

const processingCount = computed(() => {
  return orders.value.filter(o => o.status === 'processing').length;
});

const completedCount = computed(() => {
  return orders.value.filter(o => o.status === 'completed').length;
});

const cancelledCount = computed(() => {
  return orders.value.filter(o => o.status === 'cancelled').length;
});

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; icon: any }> = {
    pending: { label: 'Pending', icon: Clock },
    processing: { label: 'Processing', icon: Package },
    completed: { label: 'Completed', icon: CheckCircle },
    cancelled: { label: 'Cancelled', icon: XCircle }
  };
  return statusMap[status] || { label: status, icon: Clock };
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Modal Operations
const openViewModal = (order: any) => {
  selectedOrder.value = order;
  isModalOpen.value = true;
};

const updateOrderStatus = async (orderId: number, newStatus: string) => {
  try {
    const res = await api.updateOrderStatus(orderId, newStatus);
    if (res.success) {
      store.setAlert('Order status updated successfully', 'success');
      await fetchOrders();
    }
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to update order status', 'error');
  }
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const handleExport = () => {
  store.setAlert('Export functionality coming soon', 'info');
};

const handleCreateOrder = () => {
  store.setAlert('Create order functionality coming soon', 'info');
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Sales</p>
        <h1 class="text-2xl font-bold text-neutral-900">Order Management</h1>
        <p class="text-sm text-neutral-500 mt-0.5">Track and manage customer orders</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-outlined py-2 px-4 text-xs flex items-center gap-1.5" @click="handleExport">
          <Download :size="14" />
          Export
        </button>
        <button class="btn-primary py-2 px-4 text-sm flex items-center gap-2" @click="handleCreateOrder">
          <Plus :size="15" />
          Create Order
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Today's Revenue</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ formatCurrency(todayRevenue) }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <DollarSign :size="18" />
          </div>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Pending</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ pendingCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock :size="18" />
          </div>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Processing</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ processingCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <Package :size="18" />
          </div>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Completed</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ completedCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center text-secondary-600">
            <CheckCircle :size="18" />
          </div>
        </div>
      </div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="flex items-center gap-2 flex-wrap">
      <button 
        v-for="status in ['all', 'pending', 'processing', 'completed', 'cancelled']"
        :key="status"
        :class="['px-4 py-2 rounded-lg text-sm font-semibold transition-all', 
          statusFilter === status 
            ? 'bg-primary-600 text-white shadow-sm' 
            : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700']"
        @click="statusFilter = status; currentPage = 1"
      >
        {{ status.charAt(0).toUpperCase() + status.slice(1) }}
        <span v-if="status !== 'all'" class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono" :class="statusFilter === status ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'">
          {{ status === 'pending' ? pendingCount : 
             status === 'processing' ? processingCount :
             status === 'completed' ? completedCount : cancelledCount }}
        </span>
      </button>
    </div>

    <!-- Filters panel -->
    <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center gap-4">
      <div class="relative flex-1 min-w-[240px]">
        <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input type="text" placeholder="Search by Order ID, Customer Name, or Email..." class="input-field pl-10 text-sm"
          v-model="search" @input="currentPage = 1" />
      </div>

      <div class="flex items-center gap-2">
        <label class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date Range:</label>
        <div class="relative">
          <select class="input-field pr-8 text-sm appearance-none cursor-pointer">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <ChevronDown :size="14" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4 text-neutral-400">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="text-sm">Loading orders...</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
        <Package :size="40" class="text-neutral-300" />
        <p class="text-sm text-neutral-500">No orders found matching your filters.</p>
        <button class="btn-secondary py-2 px-4 text-xs" @click="search = ''; statusFilter = 'all'">
          Clear Filters
        </button>
      </div>

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-50 border-b border-neutral-200">
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Order ID</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Customer</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Items</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                <th class="p-4 text-right font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in paginatedOrders" :key="order.id" class="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors">
                <td class="p-4 font-bold text-neutral-900 font-mono text-xs">#ORD-{{ order.id }}</td>
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-bold text-xs flex items-center justify-center border border-primary-100 shrink-0">
                      {{ order.customer_name ? order.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'CU' }}
                    </span>
                    <div>
                      <p class="font-semibold text-neutral-900 text-sm leading-tight">{{ order.customer_name || 'Unknown' }}</p>
                      <p class="text-xs text-neutral-500">{{ order.customer_email || '' }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-4">
                  <span class="text-xs font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">{{ order.items_count || 0 }} items</span>
                </td>
                <td class="p-4 font-bold text-primary-600">{{ formatCurrency(order.total || 0) }}</td>
                <td class="p-4 text-neutral-500 text-xs">{{ formatDate(order.created_at) }}</td>
                <td class="p-4">
                  <span :class="'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ' + (order.status === 'pending' ? 'bg-amber-50 text-amber-600' : order.status === 'processing' ? 'bg-primary-50 text-primary-600' : order.status === 'completed' ? 'bg-secondary-50 text-secondary-600' : order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-600')">
                    <component :is="getStatusBadge(order.status).icon" :size="12" />
                    {{ getStatusBadge(order.status).label }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 transition-all" @click="openViewModal(order)" title="View Details">
                      <Eye :size="15" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-4 border-t border-neutral-100 bg-neutral-50/50">
          <span class="text-xs text-neutral-500 font-mono">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }} of {{ filteredOrders.length }}
          </span>
          <div class="flex items-center gap-1">
            <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
              <ChevronLeft :size="15" />
            </button>
            <button v-for="p in totalPages" :key="p" 
              :class="['w-8 h-8 rounded-lg text-xs font-semibold border transition-all', 
                currentPage === p ? 'bg-primary-600 text-white border-primary-600' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-100']"
              @click="changePage(p)">
              {{ p }}
            </button>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
              <ChevronRight :size="15" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- ORDER DETAILS MODAL -->
    <div v-if="isModalOpen && selectedOrder" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" @click.self="isModalOpen = false">
      <div class="bg-white border border-neutral-200 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 class="font-bold text-lg text-neutral-900">Order Details #ORD-{{ selectedOrder.id }}</h3>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all" @click="isModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <!-- Customer Info -->
            <div class="flex flex-col gap-3 bg-neutral-50 rounded-xl p-4">
              <h4 class="font-bold text-sm text-neutral-900">Customer Information</h4>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-500">Name:</span>
                <span class="font-semibold text-neutral-900">{{ selectedOrder.customer_name || 'N/A' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-500">Email:</span>
                <span class="font-semibold text-neutral-900">{{ selectedOrder.customer_email || 'N/A' }}</span>
              </div>
            </div>

            <!-- Order Info -->
            <div class="flex flex-col gap-3 bg-neutral-50 rounded-xl p-4">
              <h4 class="font-bold text-sm text-neutral-900">Order Information</h4>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-500">Date:</span>
                <span class="font-semibold text-neutral-900">{{ formatDate(selectedOrder.created_at) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-500">Amount:</span>
                <span class="font-bold text-primary-600">{{ formatCurrency(selectedOrder.total || 0) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-neutral-500">Items:</span>
                <span class="font-semibold text-neutral-900">{{ selectedOrder.items_count || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Status Update -->
          <div class="flex flex-col gap-3">
            <h4 class="font-bold text-sm text-neutral-900">Update Status</h4>
            <div class="flex gap-2 flex-wrap">
              <button 
                v-for="status in ['pending', 'processing', 'completed', 'cancelled']"
                :key="status"
                :class="['px-4 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all',
                  selectedOrder.status === status
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50']"
                @click="updateOrderStatus(selectedOrder.id, status)"
              >
                <component :is="getStatusBadge(status).icon" :size="13" />
                {{ status.charAt(0).toUpperCase() + status.slice(1) }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <button type="button" class="btn-secondary py-2.5 px-5 text-sm" @click="isModalOpen = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

