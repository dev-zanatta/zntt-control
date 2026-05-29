import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import { projectRoutes }  from 'src/domains/project/routes'
import { boardRoutes }    from 'src/domains/board/routes'
import { settingsRoutes } from 'src/domains/settings/routes'

export default route(function () {
  return createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    history: createWebHashHistory(),
    routes: [
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
})
