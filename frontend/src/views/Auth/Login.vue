<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../../store';
import { Eye, EyeOff } from 'lucide-vue-next';

const router = useRouter();
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

onMounted(() => {
  if (store.user.value) {
    redirectBasedOnRole(store.user.value.role);
  }
});

const redirectBasedOnRole = (role: string) => {
  if (role === 'admin') router.push('/admin/dashboard');
  else router.push('/');
};

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  try {
    const res = await store.login({ email: email.value, password: password.value });
    if (res.success) redirectBasedOnRole(res.user.role);
  } catch (err: any) {
    error.value = err.message || 'Invalid email or password.';
  } finally {
    loading.value = false;
  }
};

const handleSocialLogin = (provider: 'google' | 'apple') => {
  store.setAlert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon`, 'info');
};
</script>

<template>
  <main class="flex-1 w-full flex items-center justify-center bg-primary-50 p-4 md:p-10 min-h-[calc(100vh-80px)]">
    <div
      class="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden flex flex-col md:flex-row animate-fade-in-up">

      <!-- ── Left Branding Panel ── -->
      <div class="md:w-5/12 relative bg-primary-600 p-10 flex flex-col justify-between overflow-hidden min-h-[360px]">
        <!-- Decorative circles -->
        <div class="absolute -top-16 -left-16 w-64 h-64 bg-primary-500/40 rounded-full"></div>
        <div class="absolute -bottom-20 -right-20 w-72 h-72 bg-primary-700/50 rounded-full"></div>
        <!-- Photo overlay -->
        <div
          class="absolute inset-0 bg-[url('https://i.pinimg.com/1200x/f4/5e/31/f45e311ae38c698b77b641b6237992a4.jpg')] bg-cover bg-center opacity-10">
        </div>

        <!-- Top badge -->
        <div class="relative z-10">
          <span class="label-neutral font-mono text-[10px]">MS E-COMMERCE</span>
        </div>

        <!-- Bottom copy -->
        <div class="relative z-10 mt-auto">
          <h1 class="text-3xl md:text-4xl font-bold text-white leading-snug mb-3">
            Elevate Your<br>Experience
          </h1>
          <p class="text-primary-200 text-sm leading-relaxed">
            Join the MS community for exclusive access to premium collections and personalized shopping.
          </p>
          <!-- Feature pills -->
          <div class="flex flex-wrap gap-2 mt-6">
            <span class="bg-white/15 text-white text-xs font-mono px-3 py-1 rounded-full border border-white/20">Free
              Shipping</span>
            <span class="bg-white/15 text-white text-xs font-mono px-3 py-1 rounded-full border border-white/20">Easy
              Returns</span>
            <span class="bg-secondary-500/80 text-white text-xs font-mono px-3 py-1 rounded-full">10k+ Products</span>
          </div>
        </div>
      </div>

      <!-- ── Right Form Panel ── -->
      <div class="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">

        <div class="mb-8">
          <p class="font-mono text-xs text-neutral-400 tracking-widest uppercase mb-1">Step 1 of 1</p>
          <h2 class="text-2xl font-bold text-neutral-900 mb-1">Welcome Back</h2>
          <p class="text-neutral-500 text-sm">Sign in to manage your orders and preferences.</p>
        </div>

        <!-- Social Buttons -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <button type="button" @click="handleSocialLogin('google')"
            class="btn-secondary gap-2 py-2.5 text-xs justify-center">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-4 h-4" alt="Google" />
            Continue with Google
          </button>
          <button type="button" @click="handleSocialLogin('apple')"
            class="btn-inverted gap-2 py-2.5 text-xs justify-center">
            <img src="https://www.svgrepo.com/show/511330/apple-173.svg" class="w-4 h-4 invert" alt="Apple" />
            Continue with Apple
          </button>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-6">
          <div class="flex-1 h-px bg-neutral-200"></div>
          <span class="font-mono text-[10px] font-semibold text-neutral-400 tracking-widest uppercase">Or with
            email</span>
          <div class="flex-1 h-px bg-neutral-200"></div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <!-- Error -->
          <div v-if="error"
            class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg font-medium">
            {{ error }}
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-mono">Email
              Address</label>
            <input type="email" v-model="email" placeholder="name@example.com" class="input-field" required />
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-neutral-600 uppercase tracking-wider font-mono">Password</label>
              <a href="#" class="text-xs font-semibold text-primary-600 hover:text-primary-700">Forgot password?</a>
            </div>
            <div class="relative">
              <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="••••••••"
                class="input-field pr-10" required />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <!-- Remember me -->
          <label class="flex items-center gap-2.5 cursor-pointer group">
            <input type="checkbox" id="remember" v-model="rememberMe"
              class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <span class="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">Remember me for 30
              days</span>
          </label>

          <!-- Submit -->
          <button type="submit" class="btn-primary w-full py-3 mt-2 text-sm" :disabled="loading">
            <span v-if="loading"
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ loading ? 'Signing in...' : 'Sign In to Account' }}
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-6 pt-6 border-t border-neutral-100 text-center">
          <p class="text-sm text-neutral-500">
            Don't have an account?
            <router-link to="/register" class="font-semibold text-primary-600 hover:text-primary-700 ml-1">Create an
              account →</router-link>
          </p>
        </div>
      </div>

    </div>
  </main>
</template>
