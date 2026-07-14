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
  TrendingUp,
  AlertCircle,
  History,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
} from 'lucide-vue-next';

// Component state
const products = ref<any[]>([]);
const categories = ref<any[]>([]);
const search = ref('');
const selectedCategory = ref('all');
const loading = ref(true);
const selectedProducts = ref<Set<number>>(new Set());
const selectAll = ref(false);

// Pagination
const currentPage = ref(1);
const itemsPerPage = 5;

// Modal state
const isModalOpen = ref(false);
const isEditing = ref(false);
const editingProductId = ref<number | null>(null);

// Form state
const formName = ref('');
const formSku = ref('');
const formCategoryId = ref('');
const formPrice = ref(0);
const formStock = ref(0);
const formDescription = ref('');
const formImageFile = ref<File | null>(null);
const formImagePreview = ref<string | null>(null);

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await api.getProducts();
    if (res.success) {
      // API now returns paginator shape: { data: { items, ... } }
      products.value = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
    }
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to fetch products', 'error');
  } finally {
    loading.value = false;
  }
};


const fetchCategories = async () => {
  try {
    const res = await api.getCategories();
    if (res.success) {
      categories.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch categories', err);
  }
};

onMounted(async () => {
  await Promise.all([fetchProducts(), fetchCategories()]);
});

// Filtering and Searching
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.value.toLowerCase())) ||
      p.id.toString().includes(search.value);

    const matchesCategory =
      selectedCategory.value === 'all' ||
      p.category_id.toString() === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });
});

// Paginated products
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage) || 1;
});

// Computed Metrics
const lowStockCount = computed(() => {
  return products.value.filter(p => p.stock > 0 && p.stock <= 15).length;
});

const outOfStockCount = computed(() => {
  return products.value.filter(p => p.stock === 0).length;
});

// Modal Operations
const openAddModal = () => {
  isEditing.value = false;
  editingProductId.value = null;
  formName.value = '';
  formSku.value = '';
  formCategoryId.value = categories.value[0]?.id || '';
  formPrice.value = 0;
  formStock.value = 0;
  formDescription.value = '';
  formImageFile.value = null;
  formImagePreview.value = null;
  isModalOpen.value = true;
};

const openEditModal = (product: any) => {
  isEditing.value = true;
  editingProductId.value = product.id;
  formName.value = product.name;
  formSku.value = product.sku || '';
  formCategoryId.value = product.category_id;
  formPrice.value = product.price;
  formStock.value = product.stock;
  formDescription.value = product.description || '';
  formImageFile.value = null;
  formImagePreview.value = product.image_url || null;
  isModalOpen.value = true;
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0] as File;
    formImageFile.value = file;
    formImagePreview.value = URL.createObjectURL(file);
  }
};

const handleSaveProduct = async () => {
  if (!formName.value || !formPrice.value === undefined || !formStock.value === undefined) {
    store.setAlert('Please fill out all required fields', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', formName.value);
  formData.append('sku', formSku.value);
  formData.append('category_id', formCategoryId.value);
  formData.append('price', formPrice.value.toString());
  formData.append('stock', formStock.value.toString());
  formData.append('description', formDescription.value);

  if (formImageFile.value) {
    formData.append('image', formImageFile.value);
  }

  try {
    let res;
    if (isEditing.value && editingProductId.value) {
      res = await api.updateProduct(editingProductId.value, formData);
    } else {
      res = await api.createProduct(formData);
    }

    if (res.success) {
      store.setAlert(
        `Product successfully ${isEditing.value ? 'updated' : 'created'}`,
        'success'
      );
      isModalOpen.value = false;
      await fetchProducts();
    }
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to save product', 'error');
  }
};

const handleDeleteProduct = async (id: number, name: string) => {
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    try {
      const res = await api.deleteProduct(id);
      if (res.success) {
        store.setAlert('Product successfully deleted', 'success');
        await fetchProducts();
      }
    } catch (err: any) {
      store.setAlert(err.message || 'Failed to delete product', 'error');
    }
  }
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// Bulk selection
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProducts.value.clear();
  } else {
    paginatedProducts.value.forEach(p => selectedProducts.value.add(p.id));
  }
  selectAll.value = !selectAll.value;
};

const toggleSelectProduct = (id: number) => {
  if (selectedProducts.value.has(id)) {
    selectedProducts.value.delete(id);
  } else {
    selectedProducts.value.add(id);
  }
  selectAll.value = selectedProducts.value.size === paginatedProducts.value.length;
};

const handleBulkDelete = async () => {
  if (selectedProducts.value.size === 0) {
    store.setAlert('Please select at least one product', 'error');
    return;
  }
  if (confirm(`Are you sure you want to delete ${selectedProducts.value.size} selected products?`)) {
    try {
      for (const id of selectedProducts.value) {
        await api.deleteProduct(id);
      }
      store.setAlert(`${selectedProducts.value.size} products successfully deleted`, 'success');
      selectedProducts.value.clear();
      selectAll.value = false;
      await fetchProducts();
    } catch (err: any) {
      store.setAlert(err.message || 'Failed to delete products', 'error');
    }
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Inventory</p>
        <h1 class="text-2xl font-bold text-neutral-900">Product Inventory</h1>
        <p class="text-sm text-neutral-500 mt-0.5">Manage store catalog, pricing, and stock levels</p>
      </div>
      <button class="btn-primary py-2.5 px-5 text-sm flex items-center gap-2" @click="openAddModal">
        <Plus :size="16" />
        New Product
      </button>
    </div>

    <!-- Filters panel -->
    <div class="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center gap-4">
      <div class="relative flex-1 min-w-[240px]">
        <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input type="text" placeholder="Search by ID, SKU, or name..." class="input-field pl-10 text-sm"
          v-model="search" @input="currentPage = 1" />
      </div>

      <div class="flex items-center gap-2">
        <label class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Category:</label>
        <div class="relative">
          <select class="input-field pr-8 text-sm appearance-none cursor-pointer" v-model="selectedCategory" @change="currentPage = 1">
            <option value="all">All Categories</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id.toString()">
              {{ cat.name }}
            </option>
          </select>
          <ChevronDown :size="14" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      <div v-if="selectedProducts.size > 0" class="flex items-center gap-3 pl-4 border-l border-neutral-200">
        <span class="text-sm font-semibold text-neutral-500 font-mono">{{ selectedProducts.size }} selected</span>
        <button class="btn-outlined text-xs py-2 px-3 text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-1.5" @click="handleBulkDelete">
          <Trash2 :size="13" />
          Delete
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4 text-neutral-400">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p class="text-sm">Loading products catalog...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
        <p class="text-sm text-neutral-500">No products found matching your filters.</p>
        <button class="btn-secondary py-2 px-4 text-xs" @click="search = ''; selectedCategory = 'all'">
          Clear Filters
        </button>
      </div>

      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-50 border-b border-neutral-200">
                <th class="p-4 text-left w-10">
                  <input type="checkbox" :checked="selectAll" @change="toggleSelectAll" class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                </th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Image</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Name</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">SKU</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Category</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Price</th>
                <th class="p-4 text-left font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Stock</th>
                <th class="p-4 text-right font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in paginatedProducts" :key="product.id" class="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors">
                <td class="p-4">
                  <input type="checkbox" :checked="selectedProducts.has(product.id)"
                    @change="toggleSelectProduct(product.id)" class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                </td>
                <td class="p-4">
                  <img :src="product.image_url" :alt="product.name" class="w-11 h-11 rounded-lg border border-neutral-200 object-cover bg-neutral-100"
                    @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=256&auto=format&fit=crop'" />
                </td>
                <td class="p-4 font-semibold text-neutral-900">{{ product.name }}</td>
                <td class="p-4 font-mono text-xs text-neutral-500">{{ product.sku || 'N/A' }}</td>
                <td class="p-4">
                  <span class="text-xs font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">{{ product.category?.name }}</span>
                </td>
                <td class="p-4 font-bold text-primary-600">
                  {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price) }}
                </td>
                <td class="p-4">
                  <span v-if="product.stock === 0" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Out of Stock
                  </span>
                  <span v-else-if="product.stock <= 15" class="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {{ product.stock }} Low
                  </span>
                  <span v-else class="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary-50 text-secondary-600 px-2.5 py-1 rounded-full">
                    <span class="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
                    {{ product.stock }} In Stock
                  </span>
                </td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 transition-all" @click="openEditModal(product)" title="Edit">
                      <Edit :size="15" />
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all" @click="handleDeleteProduct(product.id, product.name)" title="Delete">
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
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }} of {{ filteredProducts.length }}
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

    <!-- Metrics cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white border border-neutral-200 rounded-xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
          <TrendingUp :size="18" />
        </div>
        <div>
          <h4 class="font-semibold text-sm text-neutral-900">Stock Trend</h4>
          <p class="text-xs text-neutral-500 mt-1 leading-relaxed">Inventory turnover increased by 12% this week. Consider restocking high-performing items.</p>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
          <AlertCircle :size="18" />
        </div>
        <div>
          <h4 class="font-semibold text-sm text-neutral-900">Low Stock Alert</h4>
          <p class="text-xs text-neutral-500 mt-1 leading-relaxed">{{ lowStockCount + outOfStockCount }} items are currently below safety threshold. Re-order recommended immediately.</p>
        </div>
      </div>

      <div class="bg-white border border-neutral-200 rounded-xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
        <div class="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
          <History :size="18" />
        </div>
        <div>
          <h4 class="font-semibold text-sm text-neutral-900">Recent Activity</h4>
          <p class="text-xs text-neutral-500 mt-1 leading-relaxed">Admin user updated the 'Sonic Aura Elite' pricing details 14 minutes ago.</p>
        </div>
      </div>
    </div>

    <!-- ADD/EDIT PRODUCT MODAL -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" @click.self="isModalOpen = false">
      <div class="bg-white border border-neutral-200 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 class="font-bold text-lg text-neutral-900">{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h3>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all" @click="isModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleSaveProduct" class="p-6 overflow-y-auto flex-1">
          <div class="grid grid-cols-2 gap-5">
            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Product Name *</label>
              <input id="p-name" type="text" class="input-field" v-model="formName" required />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">SKU</label>
              <input id="p-sku" type="text" class="input-field" v-model="formSku" placeholder="ST-APX-01" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Category *</label>
              <div class="relative">
                <select id="p-cat" class="input-field pr-8 appearance-none cursor-pointer" v-model="formCategoryId" required>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
                <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Price ($) *</label>
              <input id="p-price" type="number" step="0.01" min="0" class="input-field" v-model="formPrice" required />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Stock Level *</label>
              <input id="p-stock" type="number" min="0" class="input-field" v-model="formStock" required />
            </div>

            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description</label>
              <textarea id="p-desc" class="input-field min-h-[90px] resize-y" v-model="formDescription"></textarea>
            </div>

            <!-- Image upload -->
            <div class="col-span-2 flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Product Image</label>
              <div class="relative">
                <input type="file" id="p-image-file" accept="image/*" class="hidden" @change="handleFileChange" />

                <div v-if="formImagePreview" class="flex items-center gap-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <img :src="formImagePreview" class="w-20 h-20 object-cover rounded-lg border border-neutral-200" />
                  <button type="button" class="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors" @click="formImageFile = null; formImagePreview = null">
                    Remove
                  </button>
                </div>
                <label v-else for="p-image-file" class="flex flex-col items-center justify-center gap-1.5 h-24 border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-primary-400 bg-neutral-50/50 transition-colors">
                  <Upload :size="20" class="text-neutral-400" />
                  <span class="text-xs font-medium text-neutral-500">Click to upload image</span>
                  <span class="text-[10px] text-neutral-400">PNG, JPG up to 2MB</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
            <button type="button" class="btn-secondary py-2.5 px-5 text-sm" @click="isModalOpen = false">Cancel</button>
            <button type="submit" class="btn-primary py-2.5 px-5 text-sm">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom CSS needed - all styles use Tailwind utility classes */
</style>

