// app.jsx — assembles every screen as an artboard inside the design canvas.
// Tweaks retired: theme + accent + font are configured in-app, in Settings.

const M = window.ZC_MOCK;
const W = 1280;
const H = 820;

function applyAccent(hex) {
  const root = document.documentElement;
  root.style.setProperty('--zc-accent', hex);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  root.style.setProperty('--zc-accent-soft', `rgba(${r},${g},${b},0.16)`);
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('#7c6af7');
  const [font, setFont] = useState('mono');

  useEffect(() => { applyAccent(accent); }, [accent]);

  // Font choice → app shell class
  const fontClass = font === 'pixel' ? 'theme-pixel' : 'font-mono';

  const settingsProps = {
    theme,
    onToggleTheme: setTheme,
    categories: M.categories,
    accent,
    onAccent: setAccent,
    font,
    onFont: setFont,
  };

  return (
    <DesignCanvas>
      <DCSection
        id="dashboard"
        title="Dashboard"
        subtitle="Lista de projetos · grid 3 colunas · sidebar de 64px · chrome de janela Windows"
      >
        <DCArtboard id="dash-full" label="Dashboard · 9 projetos" width={W} height={H}>
          <AppShell active="dashboard" className={fontClass}>
            <Dashboard projects={M.projects} onOpenProject={() => {}} onNewProject={() => {}} />
          </AppShell>
        </DCArtboard>

        <DCArtboard id="dash-empty" label="Dashboard · empty state" width={W} height={H}>
          <AppShell active="dashboard" className={fontClass}>
            <DashboardEmpty onNewProject={() => {}} />
          </AppShell>
        </DCArtboard>

        <DCArtboard id="new-proj" label="New Project modal" width={W} height={H}>
          <AppShell active="dashboard" className={fontClass}>
            <Dashboard projects={M.projects} onOpenProject={() => {}} onNewProject={() => {}} />
            <NewProjectModal onClose={() => {}} onCreate={() => {}} />
          </AppShell>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="board"
        title="Project Board"
        subtitle="Kanban com 4 colunas · drag-and-drop entre colunas · clique no card abre detalhe"
      >
        <DCArtboard id="board-full" label="Kanban · zntt-control" width={W} height={H}>
          <BoardScene fontClass={fontClass} />
        </DCArtboard>

        <DCArtboard id="task-modal" label="Task detail" width={W} height={H}>
          <BoardScene fontClass={fontClass} forceTask />
        </DCArtboard>

        <DCArtboard id="board-empty" label="Board · empty state" width={W} height={H}>
          <AppShell active="dashboard" className={fontClass}>
            <BoardEmpty project={M.projects[0]} onBack={() => {}} />
          </AppShell>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="settings"
        title="Settings & First Run"
        subtitle="Tema · cor accent (RGB picker) · estilo da fonte (Mono ou 8-bit) · onboarding"
      >
        <DCArtboard id="settings-page" label="Settings" width={W} height={H}>
          <AppShell active="settings" className={fontClass}>
            <Settings {...settingsProps} />
          </AppShell>
        </DCArtboard>

        <DCArtboard id="onboarding" label="Onboarding · first run" width={W} height={H}>
          <div className={"zc-app " + fontClass}>
            <WindowChrome title="zntt-control · Welcome">
              <aside className="zc-sidebar" style={{opacity: 0.4, pointerEvents:'none'}}>
                <div className="zc-sb-logo">Z</div>
                <button className="zc-sb-item"><Icon name="grid" size={18} /></button>
                <div className="zc-sb-spacer" />
                <button className="zc-sb-item"><Icon name="settings" size={18} /></button>
              </aside>
              <main className="zc-main">
                <Onboarding onComplete={() => {}} />
              </main>
            </WindowChrome>
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

function BoardScene({ fontClass, forceTask }) {
  const [task, setTask] = useState(forceTask ? M.taskDetail : null);

  return (
    <AppShell
      active="dashboard"
      className={fontClass}
      title="zntt-control · zntt-control"
    >
      <ProjectBoard
        project={M.projects[0]}
        columns={M.columns}
        tasks={M.tasks}
        onBack={() => {}}
        onOpenTask={(t) => setTask({ ...M.taskDetail, title: t.title, id: t.id })}
      />
      {task && <TaskModal task={task} onClose={() => setTask(null)} />}
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
