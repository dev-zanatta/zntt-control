window.ZC_MOCK = (function () {
  const projects = [
    {
      id: 'zntt',
      name: 'zntt-control',
      initials: 'ZC',
      color: '#7c6af7',
      category: 'dev',
      status: 'active',
      tasksDone: 8,
      tasksTotal: 12,
    },
    {
      id: 'dotfiles',
      name: 'dotfiles',
      initials: 'DF',
      color: '#3ecfcf',
      category: 'dev',
      status: 'active',
      tasksDone: 4,
      tasksTotal: 9,
    },
    {
      id: 'mestrado',
      name: 'Mestrado · ML',
      initials: 'ML',
      color: '#e0a050',
      category: 'study',
      status: 'active',
      tasksDone: 11,
      tasksTotal: 24,
    },
    {
      id: 'site',
      name: 'Site Pessoal',
      initials: 'SP',
      color: '#4caf82',
      category: 'personal',
      status: 'active',
      tasksDone: 6,
      tasksTotal: 7,
    },
    {
      id: 'reading',
      name: 'Reading List',
      initials: 'RL',
      color: '#e05c5c',
      category: 'personal',
      status: 'paused',
      tasksDone: 3,
      tasksTotal: 18,
    },
    {
      id: 'leetcode',
      name: 'Algoritmos',
      initials: 'AL',
      color: '#9b7af7',
      category: 'study',
      status: 'active',
      tasksDone: 22,
      tasksTotal: 40,
    },
    {
      id: 'home',
      name: 'Home Server',
      initials: 'HS',
      color: '#2ab5b5',
      category: 'dev',
      status: 'completed',
      tasksDone: 14,
      tasksTotal: 14,
    },
    {
      id: 'finanças',
      name: 'Finanças 2026',
      initials: 'F$',
      color: '#e6b070',
      category: 'personal',
      status: 'active',
      tasksDone: 2,
      tasksTotal: 8,
    },
    {
      id: 'blog',
      name: 'Blog · devlog',
      initials: 'BL',
      color: '#7c9af7',
      category: 'personal',
      status: 'active',
      tasksDone: 5,
      tasksTotal: 11,
    },
  ];

  // Tasks for zntt-control (the kanban screen)
  const columns = [
    { id: 'backlog',  name: 'Backlog',  done: false },
    { id: 'doing',    name: 'Doing',    done: false },
    { id: 'review',   name: 'Review',   done: false },
    { id: 'done',     name: 'Done',     done: true  },
  ];

  const tasks = [
    {
      id: 't1', col: 'backlog',
      title: 'Persistir estado da janela ao fechar',
      priority: 'low',
      attachments: 0, subDone: 0, subTotal: 0,
      due: 'Mar 28',
    },
    {
      id: 't2', col: 'backlog',
      title: 'Adicionar suporte a temas customizados (JSON)',
      priority: 'medium',
      attachments: 1, subDone: 0, subTotal: 3,
      due: 'Apr 02',
    },
    {
      id: 't3', col: 'backlog',
      title: 'Atalhos de teclado globais para criar tarefa',
      priority: 'low',
      attachments: 0, subDone: 0, subTotal: 0,
    },
    {
      id: 't4', col: 'backlog',
      title: 'Importar/Exportar projetos como .json',
      priority: 'medium',
      attachments: 0, subDone: 0, subTotal: 4,
      due: 'Apr 10',
    },
    {
      id: 't5', col: 'doing',
      title: 'Drag-and-drop de cards entre colunas',
      priority: 'high',
      attachments: 2, subDone: 1, subTotal: 3,
      due: 'Mar 15',
    },
    {
      id: 't6', col: 'doing',
      title: 'Modal de edição de task com subtasks',
      priority: 'high',
      attachments: 0, subDone: 2, subTotal: 5,
      due: 'Mar 17',
    },
    {
      id: 't7', col: 'doing',
      title: 'Persistência local com SQLite',
      priority: 'medium',
      attachments: 1, subDone: 0, subTotal: 2,
    },
    {
      id: 't8', col: 'review',
      title: 'Sidebar com tooltip ao hover',
      priority: 'low',
      attachments: 0, subDone: 0, subTotal: 0,
      due: 'Mar 14',
    },
    {
      id: 't9', col: 'review',
      title: 'Página de Settings — categorias',
      priority: 'medium',
      attachments: 1, subDone: 2, subTotal: 2,
    },
    {
      id: 't10', col: 'done',
      title: 'Layout base + sidebar 64px',
      priority: 'medium',
      attachments: 0, subDone: 4, subTotal: 4,
      due: 'Mar 08',
    },
    {
      id: 't11', col: 'done',
      title: 'Tokens de cor (dark theme)',
      priority: 'low',
      attachments: 0, subDone: 1, subTotal: 1,
      due: 'Mar 05',
    },
    {
      id: 't12', col: 'done',
      title: 'Quasar + Electron — boilerplate',
      priority: 'low',
      attachments: 0, subDone: 0, subTotal: 0,
      due: 'Mar 01',
    },
  ];

  // Detail for one specific task (used in task modal)
  const taskDetail = {
    id: 't5',
    title: 'Drag-and-drop de cards entre colunas',
    description:
      'Implementar drag-and-drop nativo (HTML5 DnD ou lib leve) para mover cards de tarefa entre as colunas do board. Persistir a nova ordem no SQLite imediatamente após o drop. Deve funcionar tanto entre colunas quanto dentro da mesma coluna (reordenação).',
    project: 'zntt-control',
    column: 'Doing',
    priority: 'High',
    due: 'Mar 15, 2026',
    created: 'Feb 10, 2026',
    subtasks: [
      { id: 's1', text: 'Detectar dragstart e dragover nos cards', done: true },
      { id: 's2', text: 'Animar placeholder durante o drag', done: false },
      { id: 's3', text: 'Persistir nova ordem no SQLite', done: false },
    ],
    attachments: [
      { name: 'spec-dnd.md', size: '12 KB' },
      { name: 'sketch-flow.png', size: '420 KB' },
    ],
  };

  const categories = [
    { id: 'personal', name: 'Personal', count: 4 },
    { id: 'dev',      name: 'Dev',      count: 3 },
    { id: 'study',    name: 'Study',    count: 2 },
  ];

  return { projects, columns, tasks, taskDetail, categories };
})();
