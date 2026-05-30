import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import { AuthService } from 'src/domains/auth/auth.service'
import { projectRoutes }  from 'src/domains/project/routes'
import { boardRoutes }    from 'src/domains/board/routes'
import { settingsRoutes } from 'src/domains/settings/routes'

export default route(function () {
  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    history: createWebHashHistory(),
    routes: [
      {
        path: '/login',
        component: () => import('layouts/LoginLayout.vue'),
        children: [
          {
            path: '',
            name: 'login',
            component: () => import('pages/LoginPage.vue'),
          },
        ],
        meta: { public: true },
      },
      {
        path: '/',
        component: () => import('layouts/MainLayout.vue'),
        children: [
          ...projectRoutes,
          ...boardRoutes,
          ...settingsRoutes,
        ],
      },
      {
        path: '/:catchAll(.*)*',
        component: () => import('pages/DashboardPage.vue'),
      },
    ],
  })

  router.beforeEach((to) => {
    const isAuth   = AuthService.isAuthenticated()
    const isPublic = to.meta?.public === true

    if (!isAuth && !isPublic) return { name: 'login' }
    if (isAuth && to.name === 'login') return { path: '/' }
  })

  return router
})
