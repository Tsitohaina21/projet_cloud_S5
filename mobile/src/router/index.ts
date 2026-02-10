import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';
import authService from '@/services/authService';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/create-signalement',
    component: () => import('@/views/CreateSignalementPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/map'
      },
      {
        path: 'map',
        component: () => import('@/views/MapPage.vue')
      },
      {
        path: 'signalements',
        component: () => import('@/views/MySignalementsPage.vue')
      },
      {
        path: 'notifications',
        component: () => import('@/views/NotificationsPage.vue')
      },
      {
        path: 'profile',
        component: () => import('@/views/Tab3Page.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth && !authService.isAuthenticated()) {
    next('/login');
  } else if (to.path === '/login' && authService.isAuthenticated()) {
    next('/tabs/map');
  } else {
    next();
  }
});

export default router;
