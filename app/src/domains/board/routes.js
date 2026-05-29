export const boardRoutes = [
  {
    path: 'project/:id',
    name: 'project-board',
    component: () => import('pages/ProjectBoardPage.vue'),
  },
]
