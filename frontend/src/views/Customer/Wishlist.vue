<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { store } from '../../store';
import { api } from '../../services/api';
import { ShoppingCart, Trash2, ShoppingBag, Heart } from 'lucide-vue-next';

const loading = ref(true);

const fetchWishlist = async () => {
  loading.value = true;
  try {
    await store.fetchWishlist();
  } catch (err) {
    console.error('Failed to load wishlist items', err);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchWishlist();
});

const wishlist = computed(() => store.wishlist.value);

const handleAddToCart = async (productId: number) => {
  await store.addToCart(productId, 1);
};

const handleRemoveFromWishlist = async (wishlistId: number) => {
  loading.value = true;
  try {
    await api.removeFromWishlist(wishlistId);
    await store.fetchWishlist();
    store.setAlert('Removed item from wishlist', 'success');
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to remove wishlist item', 'error');
  } finally {
    loading.value = false;
  }
};

const handleMoveAllToCart = async () => {
  if (wishlist.value.length === 0) return;
  loading.value = true;
  try {
    // Add all products to cart
    for (const item of wishlist.value) {
      if (item.product_id) {
        await api.addToCart(item.product_id, 1);
      }
    }
    
    // Clear wishlist
    for (const item of wishlist.value) {
      await api.removeFromWishlist(item.id);
    }
    
    await Promise.all([
      store.fetchCart(),
      store.fetchWishlist()
    ]);
    
    store.setAlert('Moved all items to your shopping cart', 'success');
  } catch (err: any) {
    store.setAlert(err.message || 'Failed to move items', 'error');
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};
</script>

<template>
  <div class="wishlist-wrapper">

    <!-- Wishlist list area -->
    <div class="wishlist-content-card card animate-fade-in-up">
      <div class="wishlist-content-header">
        <div>
          <h3>Your Wishlist</h3>
          <p v-if="wishlist.length > 0">
            You have {{ wishlist.length }} items saved for later.
          </p>
          <p v-else>Your wishlist is currently empty.</p>
        </div>
        
        <button 
          v-if="wishlist.length > 0" 
          class="btn btn-primary" 
          @click="handleMoveAllToCart"
          :disabled="loading"
        >
          <ShoppingBag :size="16" />
          Move All to Cart
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading && wishlist.length === 0" class="wishlist-loading">
        <div class="loader"></div>
        <p>Loading your saved items...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="wishlist.length === 0" class="wishlist-empty">
        <Heart :size="48" class="heart-empty-icon" />
        <p>Browse products and click the heart icon to save them here.</p>
        <router-link to="/" class="btn btn-secondary btn-sm">
          Go Shopping
        </router-link>
      </div>

      <!-- Wishlist grid -->
      <div v-else class="wishlist-grid">
        <div v-for="item in wishlist" :key="item.id" class="wishlist-item-card">
          <button class="remove-wishlist-btn" @click="handleRemoveFromWishlist(item.id)">
            <Trash2 :size="16" />
          </button>
          
          <div class="wishlist-card-image-box">
            <img 
              :src="item.product?.image_url" 
              :alt="item.product?.name" 
              class="wishlist-card-img"
              @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=256&auto=format&fit=crop'"
            />
          </div>

          <div class="wishlist-card-info">
            <div class="wishlist-card-name-price">
              <h4 class="wishlist-item-name">{{ item.product?.name }}</h4>
              <span class="wishlist-item-price">{{ formatCurrency(item.product?.price || 0) }}</span>
            </div>
            
            <p class="wishlist-item-desc">
              {{ item.product?.description || 'Ultra-responsive features tailored for professionals.' }}
            </p>
            
            <button class="btn btn-secondary btn-sm add-cart-btn-full" @click="handleAddToCart(item.product_id)">
              <ShoppingCart :size="14" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wishlist-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32px;
  font-family: var(--font-body);
}

/* Profile header summary */
.profile-summary-header {
  background: linear-gradient(135deg, #111827 0%, #1e1b4b 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  padding: 32px 40px;
}

.profile-details-box {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-main-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.1);
  object-fit: cover;
}

.profile-meta h2 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  color: white;
  margin-bottom: 4px;
}

.user-role-badge {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 50px;
}

/* Wishlist Content Card */
.wishlist-content-card {
  padding: 32px;
  background-color: #111827;
  border-color: rgba(255, 255, 255, 0.05);
}

.wishlist-content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 20px;
}

.wishlist-content-header h3 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
}

.wishlist-content-header p {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 4px;
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1200px) {
  .wishlist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .wishlist-grid {
    grid-template-columns: 1fr;
  }
}

.wishlist-item-card {
  background-color: #0b0f19;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.remove-wishlist-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  cursor: pointer;
  z-index: 10;
  transition: all var(--transition-fast);
}

.remove-wishlist-btn:hover {
  background-color: #ef4444;
  color: white;
}

.wishlist-card-image-box {
  background-color: #111827;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.wishlist-card-img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.wishlist-card-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.wishlist-card-name-price {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.wishlist-item-name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: white;
  line-height: 1.3;
}

.wishlist-item-price {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: #3b82f6;
  white-space: nowrap;
}

.wishlist-item-desc {
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.add-cart-btn-full {
  width: 100%;
  margin-top: auto;
  border-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.add-cart-btn-full:hover {
  background-color: #2563eb;
  color: white;
}

.wishlist-loading, .wishlist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
  color: #6b7280;
}

.heart-empty-icon {
  color: #1f2937;
}
</style>
