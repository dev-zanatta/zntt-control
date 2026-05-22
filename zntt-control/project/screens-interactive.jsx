// screens-interactive.jsx — Kanban board (drag), Task Modal, New Project Modal

// ─── Project Board (Kanban) ───────────────────────────────────────────────
function ProjectBoard({ project, columns: initialCols, tasks: initialTasks, onBack, onOpenTask }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [cols] = useState(initialCols);
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null); // {colId, targetId}

  const byCol = useMemo(() => {
    const m = {};
    cols.forEach(c => { m[c.id] = []; });
    tasks.forEach(t => { if (m[t.col]) m[t.col].push(t); });
    return m;
  }, [tasks, cols]);

  function handleDragStart(e, id) {
    setDragId(id);
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } catch (_) {}
  }
  function handleDragEnd() { setDragId(null); setDragOver(null); }

  function handleDragOver(e, colId, targetId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver({ colId, targetId });
  }

  function handleDrop(e, colId, targetId) {
    e.preventDefault();
    if (!dragId) return;
    setTasks(prev => {
      const next = [...prev];
      const idx = next.findIndex(t => t.id === dragId);
      if (idx === -1) return prev;
      const [moved] = next.splice(idx, 1);
      moved.col = colId;
      if (targetId) {
        const ti = next.findIndex(t => t.id === targetId);
        if (ti !== -1) {
          next.splice(ti, 0, moved);
          return next;
        }
      }
      next.push(moved);
      return next;
    });
    setDragId(null);
    setDragOver(null);
  }

  return (
    <>
      <header className="zc-board-hd">
        <button className="zc-back" onClick={onBack} title="Back"><Icon name="arrowLeft" size={15} /></button>
        <div className="zc-board-logo" style={{background: project.color}}>{project.initials}</div>
        <div className="zc-board-name">{project.name}</div>
        <span className="zc-badge cat">{project.category}</span>
        <button className="zc-btn ghost sm">
          <span className="zc-tb-dot" /> Active <Icon name="chevDown" size={12} />
        </button>
        <div style={{flex:1}} />
        <button className="zc-btn ghost sm"><Icon name="search" size={13} /></button>
        <button className="zc-btn secondary sm"><Icon name="settings" size={13} /> Settings</button>
      </header>

      <div className="zc-board">
        {cols.map(col => {
          const list = byCol[col.id] || [];
          return (
            <div className={"zc-col " + (col.done ? 'done' : '')} key={col.id}>
              <div className="zc-col-hd">
                <span className="zc-col-name">{col.name}</span>
                <span className="zc-col-count">{list.length}</span>
              </div>
              <div
                className="zc-col-body"
                onDragOver={(e) => handleDragOver(e, col.id, null)}
                onDrop={(e) => handleDrop(e, col.id, null)}
              >
                {list.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    dragging={dragId === t.id}
                    dragOver={dragOver && dragOver.targetId === t.id}
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, col.id, t.id)}
                    onDrop={(e) => handleDrop(e, col.id, t.id)}
                    onClick={() => onOpenTask(t)}
                  />
                ))}
                <button className="zc-col-add">
                  <Icon name="plus" size={13} /> Add task
                </button>
              </div>
            </div>
          );
        })}
        <button className="zc-add-col">
          <Icon name="plus" size={13} /> Add column
        </button>
      </div>
    </>
  );
}

function TaskCard({ task, dragging, dragOver, onDragStart, onDragEnd, onDragOver, onDrop, onClick }) {
  return (
    <article
      className={"zc-tcard" + (dragging ? ' dragging' : '') + (dragOver ? ' drag-over' : '')}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div className="zc-tcard-grip"><Icon name="grip" size={12} stroke={1} /></div>
      <h4 className="zc-tcard-title">{task.title}</h4>
      <div className="zc-tcard-meta">
        <PriorityBadge p={task.priority} />
        {task.attachments > 0 && (
          <span className="zc-tcard-meta-item"><Icon name="paperclip" size={11} /> {task.attachments}</span>
        )}
        {task.subTotal > 0 && (
          <span className="zc-tcard-meta-item"><Icon name="checklist" size={11} /> {task.subDone}/{task.subTotal}</span>
        )}
        <span className="spacer" />
        {task.due && <span className="zc-tcard-due">{task.due}</span>}
      </div>
    </article>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────
function TaskModal({ task, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || '');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSub, setNewSub] = useState('');

  function toggleSub(id) {
    setSubtasks(s => s.map(x => x.id === id ? { ...x, done: !x.done } : x));
  }
  function addSub() {
    if (!newSub.trim()) return;
    setSubtasks(s => [...s, { id: 's' + Date.now(), text: newSub.trim(), done: false }]);
    setNewSub('');
  }
  function delSub(id) { setSubtasks(s => s.filter(x => x.id !== id)); }

  return (
    <div className="zc-modal-overlay zc-fade" onClick={onClose}>
      <div className="zc-modal lg" onClick={e => e.stopPropagation()}>
        <div className="zc-modal-hd">
          <button className="zc-modal-x" onClick={onClose}><Icon name="x" size={14} /></button>
          <div className="zc-modal-title" style={{fontFamily:'var(--zc-mono)', fontSize: 11, color:'var(--zc-text-dim)'}}>
            TASK · {task.id.toUpperCase()}
          </div>
          <button className="zc-btn danger sm">
            <Icon name="trash" size={12} /> Delete
          </button>
        </div>
        <div className="zc-modal-body">
          <div className="zc-task-body">
            <div className="zc-task-main">
              <input
                className="zc-task-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea
                className="zc-textarea"
                style={{minHeight: 120}}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Add a description..."
              />

              <div className="zc-task-section">
                <div className="zc-task-section-h">
                  Subtasks <span style={{fontFamily:'var(--zc-mono)', color:'var(--zc-text-faint)'}}>
                    {subtasks.filter(s => s.done).length}/{subtasks.length}
                  </span>
                </div>
                {subtasks.map(s => (
                  <div className={"zc-subtask " + (s.done ? 'done' : '')} key={s.id} onClick={() => toggleSub(s.id)}>
                    <span className={"zc-check " + (s.done ? 'done' : '')}>
                      {s.done && <Icon name="check" size={11} stroke={2.5} />}
                    </span>
                    <span className="zc-subtask-text">{s.text}</span>
                    <button className="zc-btn ghost sm zc-subtask-x" onClick={(e) => {e.stopPropagation(); delSub(s.id);}}>
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                ))}
                <div style={{display:'flex', gap: 6, marginTop: 8}}>
                  <input
                    className="zc-input"
                    placeholder="Add subtask…"
                    value={newSub}
                    onChange={e => setNewSub(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSub(); }}
                  />
                  <button className="zc-btn secondary" onClick={addSub}>Add</button>
                </div>
              </div>

              <div className="zc-task-section">
                <div className="zc-task-section-h">Attachments</div>
                {task.attachments && task.attachments.map((a, i) => (
                  <div className="zc-attach" key={i}>
                    <Icon name="file" size={14} />
                    <span className="zc-attach-name">{a.name}</span>
                    <span className="zc-attach-size">{a.size}</span>
                    <div className="zc-attach-actions">
                      <button className="zc-btn ghost sm icon"><Icon name="ext" size={12} /></button>
                      <button className="zc-btn ghost sm icon"><Icon name="x" size={12} /></button>
                    </div>
                  </div>
                ))}
                <button className="zc-btn ghost sm" style={{marginTop: 8}}>
                  <Icon name="paperclip" size={12} /> Add file
                </button>
              </div>
            </div>

            <aside className="zc-task-side">
              <div className="zc-meta-row">
                <span className="zc-meta-label">Project</span>
                <span className="zc-meta-value" style={{fontFamily:'var(--zc-mono)', fontSize: 11.5}}>{task.project}</span>
              </div>
              <div className="zc-meta-row">
                <span className="zc-meta-label">Column</span>
                <span className="zc-meta-pill">
                  <span className="zc-tb-dot" style={{background:'var(--zc-teal)'}} />
                  {task.column}
                  <Icon name="chevDown" size={11} />
                </span>
              </div>
              <div className="zc-meta-row">
                <span className="zc-meta-label">Priority</span>
                <span className="zc-meta-pill">
                  <span className="zc-tb-dot" style={{background:'#f08585'}} />
                  {task.priority}
                  <Icon name="chevDown" size={11} />
                </span>
              </div>
              <div className="zc-meta-row">
                <span className="zc-meta-label">Due date</span>
                <span className="zc-meta-pill">
                  <Icon name="calendar" size={12} />
                  {task.due}
                </span>
              </div>
              <div className="zc-meta-row">
                <span className="zc-meta-label">Created</span>
                <span className="zc-meta-value" style={{fontFamily:'var(--zc-mono)', fontSize: 11.5, color:'var(--zc-text-dim)'}}>{task.created}</span>
              </div>
              <div className="zc-meta-row">
                <span className="zc-meta-label">Task ID</span>
                <span className="zc-meta-value" style={{fontFamily:'var(--zc-mono)', fontSize: 11.5, color:'var(--zc-text-dim)'}}>#{task.id}</span>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Project Modal ────────────────────────────────────────────────────
const PROJECT_COLORS = [
  '#7c6af7', '#3ecfcf', '#e0a050', '#4caf82',
  '#e05c5c', '#9b7af7', '#7c9af7', '#e6b070',
];
const DEFAULT_COLS = [
  { id: 'c1', name: 'Backlog',  done: false },
  { id: 'c2', name: 'Doing',    done: false },
  { id: 'c3', name: 'Review',   done: false },
  { id: 'c4', name: 'Done',     done: true  },
];

function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [category, setCategory] = useState('');
  const [cols, setCols] = useState(DEFAULT_COLS);

  function setColName(id, name) { setCols(cs => cs.map(c => c.id === id ? { ...c, name } : c)); }
  function setDone(id) { setCols(cs => cs.map(c => ({ ...c, done: c.id === id }))); }
  function delCol(id) { setCols(cs => cs.filter(c => c.id !== id)); }
  function addCol() { setCols(cs => [...cs, { id: 'c' + Date.now(), name: '', done: false }]); }

  return (
    <div className="zc-modal-overlay zc-fade" onClick={onClose}>
      <div className="zc-modal md" onClick={e => e.stopPropagation()}>
        <div className="zc-modal-hd">
          <div className="zc-modal-title">New Project</div>
          <button className="zc-modal-x" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="zc-modal-body" style={{padding: '20px 22px'}}>
          <div style={{display: 'grid', gap: 16}}>
            <div>
              <label className="zc-label">Name</label>
              <input
                className="zc-input"
                placeholder="My new project"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="zc-label">Color</label>
              <div className="zc-color-swatches">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={"zc-color-sw " + (color === c ? 'active' : '')}
                    style={{background: c}}
                    onClick={() => setColor(c)}
                  />
                ))}
                <span className="zc-color-custom" title="Custom hex">+</span>
              </div>
            </div>
            <div>
              <label className="zc-label">Logo (optional)</label>
              <div className="zc-logo-drop">
                <div className="zc-logo-prev" style={{background: color, color: '#0d0d0d', fontFamily:'var(--zc-mono)', fontWeight:700}}>
                  {(name || 'P').slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1, fontSize:12.5, color:'var(--zc-text-dim)'}}>
                  Upload image… <span style={{fontFamily:'var(--zc-mono)', fontSize: 10.5}}>(PNG, SVG, JPG)</span>
                </div>
                <button className="zc-btn ghost sm">Choose…</button>
              </div>
            </div>
            <div>
              <label className="zc-label">Category</label>
              <input
                className="zc-input"
                placeholder="type or select…  (dev, study, personal)"
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>

            <div className="zc-task-section" style={{margin: '4px 0 0'}}>
              <div className="zc-task-section-h">Columns</div>
              {cols.map(c => (
                <div className="zc-coldef" key={c.id}>
                  <span className="zc-coldef-grip"><Icon name="grip" size={13} stroke={1} /></span>
                  <input
                    className="zc-input zc-coldef-input"
                    value={c.name}
                    onChange={e => setColName(c.id, e.target.value)}
                    placeholder="Column name"
                  />
                  <label className="zc-coldef-done" onClick={() => setDone(c.id)}>
                    <span className={"zc-radio " + (c.done ? 'active' : '')} />
                    done
                  </label>
                  <button className="zc-btn ghost sm icon zc-coldef-x" onClick={() => delCol(c.id)}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
              <button className="zc-btn ghost sm" onClick={addCol} style={{marginTop: 4}}>
                <Icon name="plus" size={12} /> Add column
              </button>
            </div>
          </div>
        </div>
        <div className="zc-modal-ft">
          <button className="zc-btn ghost" onClick={onClose}>Cancel</button>
          <button className="zc-btn primary" onClick={() => onCreate && onCreate({name, color, category, cols})}>
            Create <Icon name="arrowRight" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ProjectBoard, TaskCard, TaskModal, NewProjectModal,
  PROJECT_COLORS, DEFAULT_COLS,
});
