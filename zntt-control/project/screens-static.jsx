// screens-static.jsx — Dashboard, Settings, Onboarding, EmptyStates

const M = window.ZC_MOCK;

// ─── Dashboard ────────────────────────────────────────────────────────────
function Dashboard({ projects, onOpenProject, onNewProject }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter(p => p.category === filter || p.status === filter);
  }, [filter, projects]);

  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'active').length;
    const totalTasks = projects.reduce((s, p) => s + p.tasksTotal, 0);
    const doneTasks = projects.reduce((s, p) => s + p.tasksDone, 0);
    return { active, totalTasks, doneTasks };
  }, [projects]);

  return (
    <>
      <header className="zc-page-hd">
        <div>
          <h1 className="zc-page-title">Projects</h1>
          <p className="zc-page-sub">{projects.length} projects · {stats.active} active</p>
        </div>
        <button className="zc-btn primary" onClick={onNewProject}>
          <Icon name="plus" size={14} />
          New Project
        </button>
      </header>

      <div className="zc-dash-body">
        <div className="zc-dash-summary">
          <div className="zc-dash-stat">
            <span className="zc-dash-stat-val">{projects.length}</span>
            <span className="zc-dash-stat-lab">projects</span>
          </div>
          <div className="zc-dash-stat">
            <span className="zc-dash-stat-val">{stats.active}</span>
            <span className="zc-dash-stat-lab">active</span>
          </div>
          <div className="zc-dash-stat">
            <span className="zc-dash-stat-val">{stats.doneTasks}<span style={{color:'var(--zc-text-faint)'}}>/{stats.totalTasks}</span></span>
            <span className="zc-dash-stat-lab">tasks done</span>
          </div>
          <div style={{flex:1}} />
          <div className="zc-dash-filters">
            {['all', 'dev', 'study', 'personal', 'paused'].map(f => (
              <button
                key={f}
                className={"zc-chip " + (filter === f ? 'active' : '')}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="zc-dash-grid">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p)} />
          ))}
        </div>
      </div>
    </>
  );
}

function ProjectCard({ project, onClick }) {
  const pct = Math.round((project.tasksDone / project.tasksTotal) * 100) || 0;
  return (
    <article
      className={"zc-pcard " + project.status}
      style={{ '--zc-pcard-color': project.color }}
      onClick={onClick}
    >
      <div className="zc-pcard-top">
        <div className="zc-pcard-logo">{project.initials}</div>
        <div className="zc-pcard-headline">
          <h3 className="zc-pcard-name">{project.name}</h3>
          <div className="zc-pcard-cat">{project.category}</div>
        </div>
        {project.status !== 'active' && (
          <span className={"zc-badge status-" + project.status}>
            {project.status === 'paused' ? 'paused' : 'done'}
          </span>
        )}
      </div>

      <Progress value={pct} color={project.color} />

      <div className="zc-pcard-stats">
        <span>{project.tasksDone}/{project.tasksTotal} tasks</span>
        <span>{pct}%</span>
      </div>

      <div className="zc-pcard-actions" onClick={e => e.stopPropagation()}>
        <button className="zc-btn icon" title="Settings"><Icon name="settings" size={13} /></button>
        <button className="zc-btn icon" title={project.status === 'paused' ? 'Resume' : 'Pause'}>
          <Icon name={project.status === 'paused' ? 'play' : 'pause'} size={13} />
        </button>
        <button className="zc-btn icon" title="Delete"><Icon name="trash" size={13} /></button>
      </div>
    </article>
  );
}

// ─── Empty dashboard ──────────────────────────────────────────────────────
function DashboardEmpty({ onNewProject }) {
  return (
    <>
      <header className="zc-page-hd">
        <div>
          <h1 className="zc-page-title">Projects</h1>
          <p className="zc-page-sub">0 projects</p>
        </div>
        <button className="zc-btn primary" onClick={onNewProject}>
          <Icon name="plus" size={14} />
          New Project
        </button>
      </header>
      <div className="zc-empty">
        <div className="zc-empty-icon"><Icon name="folder" size={28} stroke={1.4} /></div>
        <div className="zc-empty-title">No projects yet</div>
        <p className="zc-empty-sub">
          Crie seu primeiro projeto para começar a organizar tarefas em um quadro Kanban.
          Tudo fica salvo localmente.
        </p>
        <div className="zc-empty-cta">
          <button className="zc-btn primary lg" onClick={onNewProject}>
            <Icon name="plus" size={15} />
            Create project
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────
const ACCENT_PRESETS = [
  '#7c6af7', // purple (default)
  '#3ecfcf', // teal
  '#e0a050', // amber
  '#4caf82', // green
  '#e05c5c', // red
  '#7c9af7', // blue
  '#e67ac9', // pink
  '#b59cff', // lilac
];

function Settings({ theme = 'dark', onToggleTheme, categories, accent, onAccent, font, onFont }) {
  const [custom, setCustom] = useState(accent);
  useEffect(() => { setCustom(accent); }, [accent]);

  function commit(v) {
    setCustom(v);
    onAccent && onAccent(v);
  }

  return (
    <>
      <header className="zc-page-hd">
        <div>
          <h1 className="zc-page-title">Settings</h1>
          <p className="zc-page-sub">Global app configuration</p>
        </div>
      </header>
      <div className="zc-settings">
        <section className="zc-settings-section">
          <div className="zc-settings-hd">
            <h2 className="zc-settings-h">Appearance</h2>
            <p className="zc-settings-sub">Tema e densidade da interface</p>
          </div>
          <div className="zc-meta-row" style={{borderBottom:'none', padding: '4px 0'}}>
            <span style={{fontSize: 13}}>Theme</span>
            <div className="zc-toggle-group">
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => onToggleTheme('dark')}>
                <Icon name="moon" size={13} /> Dark
              </button>
              <button className={theme === 'light' ? 'active' : ''} onClick={() => onToggleTheme('light')}>
                <Icon name="sun" size={13} /> Light
              </button>
            </div>
          </div>

          <div className="zc-meta-row" style={{borderBottom:'none', padding: '14px 0 4px'}}>
            <div>
              <div style={{fontSize: 13}}>Font style</div>
              <p className="zc-settings-sub" style={{margin: '2px 0 0'}}>
                Tipografia da interface — escolha o clima visual do app.
              </p>
            </div>
            <div className="zc-toggle-group">
              <button className={font === 'mono' ? 'active' : ''} onClick={() => onFont('mono')}>
                <span style={{fontFamily:'"JetBrains Mono", monospace', fontWeight: 600}}>Mono</span>
              </button>
              <button className={font === 'pixel' ? 'active' : ''} onClick={() => onFont('pixel')}>
                <span style={{fontFamily:'"Pixelify Sans", monospace', fontWeight: 700}}>8-bit</span>
              </button>
            </div>
          </div>

          <div className="zc-accent-row">
            <div className="zc-accent-info">
              <div style={{fontSize: 13}}>Accent color</div>
              <p className="zc-settings-sub" style={{margin:'2px 0 0'}}>
                Cor de destaque do app — botões, barras de progresso, links.
              </p>
            </div>
            <div className="zc-accent-controls">
              <div className="zc-accent-presets">
                {ACCENT_PRESETS.map(c => (
                  <button
                    type="button"
                    key={c}
                    className={"zc-accent-sw " + (accent === c ? 'active' : '')}
                    style={{background: c}}
                    onClick={() => commit(c)}
                    title={c}
                  />
                ))}
              </div>
              <div className="zc-accent-picker">
                <span className="zc-accent-swatch" style={{background: custom}}>
                  <input
                    type="color"
                    value={custom}
                    onChange={(e) => commit(e.target.value)}
                    aria-label="Custom accent color"
                  />
                </span>
                <input
                  className="zc-input zc-accent-hex"
                  value={custom}
                  onChange={(e) => {
                    let v = e.target.value;
                    setCustom(v);
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) onAccent && onAccent(v);
                  }}
                  spellCheck="false"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="zc-settings-section">
          <div className="zc-settings-hd">
            <h2 className="zc-settings-h">Categories</h2>
            <p className="zc-settings-sub">Tags livres para organizar projetos</p>
          </div>
          {categories.map(c => (
            <div className="zc-cat-row" key={c.id}>
              <div className="zc-cat-name">
                <span>{c.name}</span>
                <span className="zc-cat-tag">{c.count} projects</span>
              </div>
              <div className="zc-cat-actions">
                <button className="zc-btn ghost sm"><Icon name="pencil" size={12} /> Rename</button>
                <button className="zc-btn ghost sm" style={{color:'var(--zc-danger)'}}>
                  <Icon name="trash" size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
          <button className="zc-btn secondary sm" style={{marginTop: 8}}>
            <Icon name="plus" size={12} /> Add category
          </button>
        </section>

        <section className="zc-settings-section">
          <div className="zc-settings-hd">
            <h2 className="zc-settings-h">Data &amp; Backup</h2>
            <p className="zc-settings-sub">Exportar/importar projetos como JSON</p>
          </div>
          <div style={{display:'flex', gap: 8}}>
            <button className="zc-btn secondary"><Icon name="download" size={13} /> Export all data</button>
            <button className="zc-btn secondary"><Icon name="ext" size={13} /> Import from file</button>
          </div>
        </section>

        <section className="zc-settings-section">
          <div className="zc-settings-hd">
            <h2 className="zc-settings-h">About</h2>
          </div>
          <div className="zc-about">
            <strong>zntt-control</strong> v1.0.0 · Quasar + Electron<br />
            Data folder: <span style={{color:'var(--zc-text)'}}>C:\Users\…\AppData\Roaming\zntt-control</span><br />
            <a href="#">Open data folder ↗</a>
          </div>
        </section>
      </div>
    </>
  );
}

// ─── Onboarding (first run) ───────────────────────────────────────────────
function Onboarding({ onComplete }) {
  return (
    <div className="zc-onb">
      <div className="zc-onb-card zc-fade">
        <div className="zc-onb-logo">Z</div>
        <h1 className="zc-onb-title">Welcome to zntt-control</h1>
        <p className="zc-onb-sub">
          Um gerenciador de projetos pessoais, offline-first.<br />
          Sem nuvem. Sem conta. Seus dados ficam no seu computador.
        </p>

        <div className="zc-onb-steps">
          <div className="zc-onb-step">
            <div className="zc-onb-step-num">1</div>
            <div className="zc-onb-step-txt">
              <b>Crie um projeto</b>
              <span>Defina nome, cor e categoria</span>
            </div>
          </div>
          <div className="zc-onb-step">
            <div className="zc-onb-step-num">2</div>
            <div className="zc-onb-step-txt">
              <b>Configure suas colunas</b>
              <span>Backlog, Doing, Review, Done — seu fluxo</span>
            </div>
          </div>
          <div className="zc-onb-step">
            <div className="zc-onb-step-num">3</div>
            <div className="zc-onb-step-txt">
              <b>Adicione tarefas</b>
              <span>Subtasks, anexos, prioridades, deadlines</span>
            </div>
          </div>
        </div>

        <div className="zc-onb-actions">
          <button className="zc-btn ghost" onClick={onComplete}>Skip for now</button>
          <button className="zc-btn primary lg" onClick={onComplete}>
            Get started <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty Kanban ─────────────────────────────────────────────────────────
function BoardEmpty({ project, onBack }) {
  return (
    <>
      <header className="zc-board-hd">
        <button className="zc-back" onClick={onBack}><Icon name="arrowLeft" size={15} /></button>
        <div className="zc-board-logo" style={{background: project.color}}>{project.initials}</div>
        <div className="zc-board-name">{project.name}</div>
        <span className="zc-badge cat">{project.category}</span>
        <div style={{flex:1}} />
      </header>
      <div className="zc-empty">
        <div className="zc-empty-icon"><Icon name="checklist" size={28} stroke={1.4} /></div>
        <div className="zc-empty-title">No tasks yet</div>
        <p className="zc-empty-sub">
          Adicione sua primeira tarefa para começar. Crie subtasks, anexe arquivos e
          arraste entre colunas conforme o trabalho avança.
        </p>
        <div className="zc-empty-cta">
          <button className="zc-btn primary lg">
            <Icon name="plus" size={15} />
            Add first task
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  Dashboard, ProjectCard, DashboardEmpty,
  Settings, Onboarding, BoardEmpty,
  ACCENT_PRESETS,
});
