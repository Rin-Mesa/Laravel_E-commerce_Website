<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { store } from '../../store';
import {
  Plus,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  Mail,
  Shield,
  User as UserIcon,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Crown
} from 'lucide-vue-next';

// Component state
const users = ref<any[]>([]);
const search = ref('');
const roleFilter = ref('all');
const statusFilter = ref('all');
const loading = ref(true);

// Pagination
const currentPage = ref(1);
const itemsPerPage = 8;

// Modal state
const isModalOpen = ref(false);
const isEditing = ref(false);
const editingUserId = ref<number | null>(null);

// Form state
const formName = ref('');
const formEmail = ref('');
const formRole = ref('customer');
const formIsActive = ref(true);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.getUsers();
    if (res.success) {
      users.value = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    }
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to fetch users', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchUsers();
});

// Filtering and Searching
const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.value.toLowerCase()) ||
      u.email.toLowerCase().includes(search.value.toLowerCase());

    const matchesRole =
      roleFilter.value === 'all' ||
      u.role === roleFilter.value;

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && u.is_active) ||
      (statusFilter.value === 'inactive' && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });
});

// Paginated users
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage) || 1;
});

// Computed Metrics
const adminCount = computed(() => {
  return users.value.filter(u => u.role === 'admin').length;
});

const customerCount = computed(() => {
  return users.value.filter(u => u.role === 'customer').length;
});

const activeCount = computed(() => {
  return users.value.filter(u => u.is_active).length;
});

const getRoleBadge = (role: string) => {
  if (role === 'admin') return { label: 'Admin', icon: Crown };
  return { label: 'Customer', icon: UserIcon };
};

const getStatusBadge = (isActive: boolean) => {
  if (isActive) return { label: 'Active', icon: CheckCircle };
  return { label: 'Inactive', icon: XCircle };
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
const openAddModal = () => {
  isEditing.value = false;
  editingUserId.value = null;
  formName.value = '';
  formEmail.value = '';
  formRole.value = 'customer';
  formIsActive.value = true;
  isModalOpen.value = true;
};

const openEditModal = (user: any) => {
  isEditing.value = true;
  editingUserId.value = user.id;
  formName.value = user.name;
  formEmail.value = user.email;
  formRole.value = user.role || 'customer';
  formIsActive.value = user.is_active ?? true;
  isModalOpen.value = true;
};

const handleSaveUser = async () => {
  if (!formName.value || !formEmail.value) {
    store.setAlert('Please fill out all required fields', 'error');
    return;
  }

  const userData = {
    name: formName.value,
    email: formEmail.value,
    role: formRole.value,
    is_active: formIsActive.value
  };

  try {
    let res;
    if (isEditing.value && editingUserId.value) {
      res = await api.updateUser(editingUserId.value, userData);
    } else {
      res = await api.createUser(userData);
    }

    if (res.success) {
      store.setAlert(
        `User successfully ${isEditing.value ? 'updated' : 'created'}`,
        'success'
      );
      isModalOpen.value = false;
      await fetchUsers();
    }
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to save user', 'error');
  }
};

const handleDeleteUser = async (id: number, name: string) => {
  if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        store.setAlert('User successfully deleted', 'success');
        await fetchUsers();
      }
    } catch (err: any) {
      store.setAlert(err.message || 'Failed to delete user', 'error');
    }
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
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Accounts</p>
        <h1 class="text-2xl font-bold text-neutral-900">User Management</h1>
        <p class="text-sm text-neutral-500 mt-0.5">Manage user accounts and permissions</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-outlined py-2 px-4 text-xs flex items-center gap-1.5" @click="handleExport">
          <Download :size="14" />
          Export
        </button>
        <button class="btn-primary py-2 px-4 text-sm flex items-center gap-2" @click="openAddModal">
          <Plus :size="15" />
          Add New User
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Total Users</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ users.length }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <UserIcon :size="18" />
          </div>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Admins</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ adminCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <Crown :size="18" />
          </div>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Customers</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ customerCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <Shield :size="18" />
          </div>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Active</p>
            <p class="text-2xl font-bold text-neutral-900 mt-1">{{ activeCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center text-secondary-600">
            <CheckCircle :size="18" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters panel -->
    <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center gap-4">
      <div class="relative flex-1 min-w-[240px]">
        <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input type="text" placeholder="Search by name or email..." class="input-field pl-10 text-sm"
          v-model="search" @input="currentPage = 1" />
      </div>

      <div class="flex items-center gap-2">
        <label class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Role:</label>
        <div class="relative">
          <select class="input-field pr-8 text-sm appearance-none cursor-pointer" v-model="roleFilter" @change="currentPage = 1">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
          <ChevronDown :size="14" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <label class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status:</label>
        <div class="relative">
          <select class="input-field pr-8 text-sm appearance-none cursor-pointer" v-model="statusFilter" @change="currentPage = 1">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown :size="14" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4 text-neutral-400">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="text-sm">Loading users...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
        <UserIcon :size="40" class="text-neutral-300" />
        <p class="text-sm text-neutral-500">No users found matching your filters.</p>
        <button class="btn-secondary py-2 px-4 text-xs" @click="search = ''; roleFilter = 'all'; statusFilter = 'all'">
          Clear Filters
        </button>
      </div>

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-50 border-b border-neutral-200">
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">User</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Role</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Joined</th>
                <th class="p-4 text-right font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id" class="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors">
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary-50 text-primary-700 font-bold text-sm flex items-center justify-center border border-primary-100 shrink-0">
                      {{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}
                    </div>
                    <span class="font-semibold text-neutral-900">{{ user.name }}</span>
                  </div>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <Mail :size="14" class="text-neutral-400 shrink-0" />
                    <span class="text-neutral-600">{{ user.email }}</span>
                  </div>
                </td>
                <td class="p-4">
                  <span :class="'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ' + (user.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600')">
                    <component :is="getRoleBadge(user.role).icon" :size="12" />
                    {{ getRoleBadge(user.role).label }}
                  </span>
                </td>
                <td class="p-4">
                  <span :class="'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ' + (user.is_active ? 'bg-secondary-50 text-secondary-600' : 'bg-red-50 text-red-600')">
                    <component :is="getStatusBadge(user.is_active).icon" :size="12" />
                    {{ getStatusBadge(user.is_active).label }}
                  </span>
                </td>
                <td class="p-4 text-neutral-500 text-xs">{{ formatDate(user.created_at) }}</td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 transition-all" @click="openEditModal(user)" title="Edit">
                      <Edit :size="15" />
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all" @click="handleDeleteUser(user.id, user.name)" title="Delete">
                      <Trash2 :size="15" />
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} of {{ filteredUsers.length }}
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

    <!-- ADD/EDIT USER MODAL -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" @click.self="isModalOpen = false">
      <div class="bg-white border border-neutral-200 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 class="font-bold text-lg text-neutral-900">{{ isEditing ? 'Edit User' : 'Add New User' }}</h3>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all" @click="isModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleSaveUser" class="p-6 overflow-y-auto flex-1">
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Full Name *</label>
              <input id="u-name" type="text" class="input-field" v-model="formName" required />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email Address *</label>
              <input id="u-email" type="email" class="input-field" v-model="formEmail" required />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Role *</label>
              <div class="relative">
                <select id="u-role" class="input-field pr-8 appearance-none cursor-pointer" v-model="formRole" required>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="flex items-center gap-3 cursor-pointer">
                <input id="u-active" type="checkbox" v-model="formIsActive" class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                <span class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Active User</span>
              </label>
              <p class="text-xs text-neutral-400 ml-7">Enable this user to allow login</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
            <button type="button" class="btn-secondary py-2.5 px-5 text-sm" @click="isModalOpen = false">Cancel</button>
            <button type="submit" class="btn-primary py-2.5 px-5 text-sm">Save User</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom CSS needed - all styles use Tailwind utility classes */
</style>

