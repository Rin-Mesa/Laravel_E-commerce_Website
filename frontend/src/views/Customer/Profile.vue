<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { store } from '../../store';
import { api } from '../../services/api';
import { useRouter } from 'vue-router';
import {
  User, Mail, Lock,
  Edit3, Save, LogOut, Camera, Shield,
  ShoppingBag, Heart, CheckCircle, Key,
  Star, Package, AlertCircle, Eye, EyeOff
} from 'lucide-vue-next';

const router = useRouter();
const saving = ref(false);
const editing = ref(false);
const stats = ref({ orders: 0, reviews: 0 });

const profileData = ref({
  name: '',
  email: '',
});

const passwordData = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
});

const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const errors = ref<Record<string, string>>({});
const passwordErrors = ref<Record<string, string>>({});
const passwordError = ref('');

const currentUser = computed(() => store.user.value);

const initials = computed(() => {
  const name = currentUser.value?.name || 'U';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
});

const memberSince = computed(() => {
  if (!currentUser.value?.created_at) return new Date().getFullYear();
  return new Date(currentUser.value.created_at).getFullYear();
});

onMounted(async () => {
  if (currentUser.value) {
    profileData.value.name = currentUser.value.name || '';
    profileData.value.email = currentUser.value.email || '';
  }
  try {
    const [ordersRes, reviewsRes] = await Promise.allSettled([
      api.getOrders(),
      api.get('/reviews', { params: { user_id: currentUser.value?.id } }),
    ]);
    if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
      stats.value.orders = ordersRes.value.data.length;
    }
    if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.data) {
      stats.value.reviews = Array.isArray(reviewsRes.value.data)
        ? reviewsRes.value.data.length
        : reviewsRes.value.data?.data?.length || 0;
    }
  } catch {
    // silently fail
  }
});

const handleCancel = () => {
  editing.value = false;
  if (currentUser.value) {
    profileData.value.name = currentUser.value.name || '';
    profileData.value.email = currentUser.value.email || '';
  }
  errors.value = {};
};

const validateProfile = () => {
  errors.value = {};
  if (!profileData.value.name.trim()) errors.value.name = 'Name is required';
  if (!profileData.value.email.trim()) errors.value.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.value.email)) errors.value.email = 'Enter a valid email';
  return Object.keys(errors.value).length === 0;
};

const handleSaveProfile = async () => {
  if (!validateProfile()) return;
  saving.value = true;
  try {
    const res = await api.updateProfile({ name: profileData.value.name, email: profileData.value.email });
    if (res.success) {
      await store.fetchUser();
      editing.value = false;
      store.setAlert('Profile updated successfully', 'success');
    }
  } catch (err: any) {
    const data = err?.response?.data;
    if (data?.errors) {
      for (const [field, msgs] of Object.entries(data.errors)) {
        const msg = (msgs as string[])[0];
        if (msg) errors.value[field] = msg;
      }
    }
    store.setAlert(data?.message || 'Failed to update profile', 'error');
  } finally {
    saving.value = false;
  }
};

const validatePassword = () => {
  passwordErrors.value = {};
  passwordError.value = '';
  if (!passwordData.value.current_password) passwordErrors.value.current_password = 'Required';
  if (!passwordData.value.new_password) passwordErrors.value.new_password = 'Required';
  else if (passwordData.value.new_password.length < 8) passwordErrors.value.new_password = 'Min 8 characters';
  if (passwordData.value.new_password !== passwordData.value.confirm_password) passwordErrors.value.confirm_password = 'Passwords do not match';
  return Object.keys(passwordErrors.value).length === 0;
};

const handleChangePassword = async () => {
  if (!validatePassword()) return;
  saving.value = true;
  try {
    const res = await api.changePassword({
      current_password: passwordData.value.current_password,
      password: passwordData.value.new_password,
      password_confirmation: passwordData.value.confirm_password,
    });
    if (res.success) {
      passwordData.value = { current_password: '', new_password: '', confirm_password: '' };
      store.setAlert('Password changed successfully', 'success');
    }
  } catch (err: any) {
    const data = err?.response?.data;
    passwordError.value = data?.message || 'Failed to change password';
    if (data?.errors) {
      for (const [field, msgs] of Object.entries(data.errors)) {
        const key = field === 'password' ? 'new_password' : field;
        const msg = (msgs as string[])[0];
        if (key && msg) passwordErrors.value[key] = msg;
      }
    }
  } finally {
    saving.value = false;
  }
};

const handleLogout = async () => {
  await store.logout();
  router.push('/login');
};

const passwordStrength = computed(() => {
  const p = passwordData.value.new_password;
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
});
</script>

<template>
  <div class="w-full bg-neutral-50 min-h-screen">
    <div class="max-w-[1100px] mx-auto px-4 md:px-8 py-8 md:py-12">

      <!-- ── Page Header ── -->
      <div class="mb-8">
        <p class="font-mono text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Account</p>
        <h1 class="text-2xl md:text-3xl font-bold text-neutral-900">My Profile</h1>
      </div>

      <!-- ── Hero Banner ── -->
      <div class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 md:p-8 mb-8 overflow-hidden">
        <div class="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-12 -left-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none"></div>
        <div class="absolute top-1/2 right-1/4 w-32 h-32 bg-secondary-500/10 rounded-full blur-xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div class="relative shrink-0">
            <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
              <span class="text-white font-bold text-2xl font-mono">{{ initials }}</span>
            </div>
            <button class="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-secondary-500 hover:bg-secondary-600 rounded-lg flex items-center justify-center text-white shadow-md transition-colors cursor-pointer">
              <Camera :size="13" />
            </button>
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-white truncate">{{ currentUser?.name || 'User' }}</h2>
            <p class="text-primary-200 text-sm mt-0.5 truncate">{{ currentUser?.email || '' }}</p>
            <div class="flex items-center gap-3 mt-3 flex-wrap">
              <span class="bg-white/15 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-wider">
                Member since {{ memberSince }}
              </span>
              <span :class="[
                'text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider border',
                currentUser?.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                  : 'bg-secondary-500/20 text-secondary-200 border-secondary-400/30'
              ]">
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

        <div class="relative z-10 grid grid-cols-3 gap-3 mt-6">
          <div class="bg-white/10 rounded-xl p-3 text-center border border-white/10 backdrop-blur-sm">
            <Package :size="18" class="text-white/60 mx-auto mb-1" />
            <p class="text-white font-bold text-lg font-mono">{{ stats.orders }}</p>
            <p class="text-primary-200 text-[10px] font-mono uppercase tracking-wider">Orders</p>
          </div>
          <div class="bg-white/10 rounded-xl p-3 text-center border border-white/10 backdrop-blur-sm">
            <Heart :size="18" class="text-white/60 mx-auto mb-1" />
            <p class="text-white font-bold text-lg font-mono">{{ store.wishlist.value.length }}</p>
            <p class="text-primary-200 text-[10px] font-mono uppercase tracking-wider">Wishlist</p>
          </div>
          <div class="bg-white/10 rounded-xl p-3 text-center border border-white/10 backdrop-blur-sm">
            <Star :size="18" class="text-white/60 mx-auto mb-1" />
            <p class="text-white font-bold text-lg font-mono">{{ stats.reviews }}</p>
            <p class="text-primary-200 text-[10px] font-mono uppercase tracking-wider">Reviews</p>
          </div>
        </div>
      </div>

      <!-- ── Main Grid ── -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        <!-- ── Profile Information (wide) ── -->
        <div class="lg:col-span-3 bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 md:p-8 transition-shadow hover:shadow-md">
          <div class="flex items-start justify-between mb-6 pb-5 border-b border-neutral-100">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <User :size="17" class="text-primary-600" />
              </div>
              <div>
                <h2 class="font-bold text-neutral-900 text-lg">Profile Information</h2>
                <p class="text-neutral-500 text-sm mt-0.5">Update your personal details</p>
              </div>
            </div>
            <button
              v-if="!editing"
              @click="editing = true"
              class="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 :size="13" /> Edit
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
              <div class="relative">
                <User :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  v-model="profileData.name"
                  :disabled="!editing"
                  class="input-field pl-9 disabled:bg-neutral-50 disabled:text-neutral-600 disabled:cursor-default"
                  :class="{ 'border-red-400 focus:border-red-400 focus:ring-red-400/20': errors.name }"
                  @input="errors.name = ''"
                />
              </div>
              <span v-if="errors.name" class="text-xs text-red-500 font-mono">{{ errors.name }}</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
              <div class="relative">
                <Mail :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  v-model="profileData.email"
                  :disabled="!editing"
                  class="input-field pl-9 disabled:bg-neutral-50 disabled:text-neutral-600 disabled:cursor-default"
                  :class="{ 'border-red-400 focus:border-red-400 focus:ring-red-400/20': errors.email }"
                  @input="errors.email = ''"
                />
              </div>
              <span v-if="errors.email" class="text-xs text-red-500 font-mono">{{ errors.email }}</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Role</label>
              <div class="relative">
                <Shield :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  :value="currentUser?.role || 'customer'"
                  disabled
                  class="input-field pl-9 disabled:bg-neutral-50 disabled:text-neutral-600 disabled:cursor-default capitalize"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Member Since</label>
              <div class="relative">
                <CheckCircle :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  :value="currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'"
                  disabled
                  class="input-field pl-9 disabled:bg-neutral-50 disabled:text-neutral-600 disabled:cursor-default"
                />
              </div>
            </div>
          </div>

          <div v-if="editing" class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button @click="handleCancel" class="btn-secondary py-2 px-5 text-sm cursor-pointer">Cancel</button>
            <button @click="handleSaveProfile" :disabled="saving" class="btn-primary py-2 px-5 text-sm flex items-center gap-2 cursor-pointer">
              <span v-if="saving" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <Save v-else :size="14" />
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <!-- ── Right Column ── -->
        <div class="lg:col-span-2 flex flex-col gap-5">

          <!-- Change Password -->
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 transition-shadow hover:shadow-md">
            <div class="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-100">
              <div class="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <Key :size="17" class="text-primary-600" />
              </div>
              <div>
                <h2 class="font-bold text-neutral-900 text-base leading-none mb-0.5">Change Password</h2>
                <p class="text-neutral-500 text-xs">Update your security credentials</p>
              </div>
            </div>

            <div v-if="passwordError" class="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3 font-medium">
              {{ passwordError }}
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Current Password</label>
                <div class="relative">
                  <input
                    :type="showCurrent ? 'text' : 'password'"
                    v-model="passwordData.current_password"
                    placeholder="Enter current password"
                    class="input-field text-sm pr-10"
                    :class="{ 'border-red-400': passwordErrors.current_password }"
                    @input="passwordErrors.current_password = ''; passwordError = ''"
                  />
                  <button type="button" @click="showCurrent = !showCurrent" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                    <EyeOff v-if="showCurrent" :size="15" /><Eye v-else :size="15" />
                  </button>
                </div>
                <span v-if="passwordErrors.current_password" class="text-xs text-red-500 font-mono">{{ passwordErrors.current_password }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">New Password</label>
                <div class="relative">
                  <input
                    :type="showNew ? 'text' : 'password'"
                    v-model="passwordData.new_password"
                    placeholder="Min. 8 characters"
                    class="input-field text-sm pr-10"
                    :class="{ 'border-red-400': passwordErrors.new_password }"
                    @input="passwordErrors.new_password = ''; passwordError = ''"
                  />
                  <button type="button" @click="showNew = !showNew" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                    <EyeOff v-if="showNew" :size="15" /><Eye v-else :size="15" />
                  </button>
                </div>
                <div v-if="passwordData.new_password" class="flex gap-1 mt-0.5">
                  <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-colors duration-300" :class="[
                    passwordStrength >= i
                      ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-lime-400' : 'bg-secondary-500'
                      : 'bg-neutral-200'
                  ]"></div>
                </div>
                <span v-if="passwordErrors.new_password" class="text-xs text-red-500 font-mono">{{ passwordErrors.new_password }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-mono text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Confirm New Password</label>
                <div class="relative">
                  <input
                    :type="showConfirm ? 'text' : 'password'"
                    v-model="passwordData.confirm_password"
                    placeholder="Re-enter new password"
                    class="input-field text-sm pr-10"
                    :class="{ 'border-red-400': passwordErrors.confirm_password }"
                    @input="passwordErrors.confirm_password = ''; passwordError = ''"
                  />
                  <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                    <EyeOff v-if="showConfirm" :size="15" /><Eye v-else :size="15" />
                  </button>
                </div>
                <span v-if="passwordErrors.confirm_password" class="text-xs text-red-500 font-mono">{{ passwordErrors.confirm_password }}</span>
              </div>

              <button
                @click="handleChangePassword"
                :disabled="saving"
                class="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-1 cursor-pointer"
              >
                <span v-if="saving" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <Lock v-else :size="14" />
                {{ saving ? 'Updating...' : 'Change Password' }}
              </button>
            </div>
          </div>

          <!-- Account Actions -->
          <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 transition-shadow hover:shadow-md">
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100">
              <div class="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle :size="17" class="text-red-500" />
              </div>
              <div>
                <h2 class="font-bold text-neutral-900 text-sm leading-none mb-0.5">Account Actions</h2>
                <p class="text-neutral-500 text-xs">Manage your session</p>
              </div>
            </div>
            <button
              @click="handleLogout"
              class="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut :size="14" />
              Sign Out
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* No custom CSS needed - all styles use Tailwind utility classes */
</style>
