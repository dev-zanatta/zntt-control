// Mappers entre campos Portuguese (API Django) e English (frontend)

// ── Status ────────────────────────────────────────────────────────────────────
const PROJECT_STATUS_TO_EN = { ativo: 'active', pausado: 'paused', concluido: 'completed' }
const PROJECT_STATUS_TO_PT = { active: 'ativo', paused: 'pausado', completed: 'concluido' }
const PRIORITY_TO_EN = { baixa: 'low', media: 'medium', alta: 'high' }
const PRIORITY_TO_PT = { low: 'baixa', medium: 'media', high: 'alta' }

// ── Category ──────────────────────────────────────────────────────────────────
export const mapCategory = (c) => ({
  id:            c.id,
  name:          c.nome,
  project_count: c.total_projetos ?? 0,
})

// ── Project ───────────────────────────────────────────────────────────────────
export const mapProject = (p) => ({
  id:                    p.id,
  name:                  p.nome,
  color:                 p.cor,
  logo_path:             p.logo_url ?? null,
  category_id:           p.categoria ?? null,
  category_name:         p.categoria_nome ?? null,
  status:                PROJECT_STATUS_TO_EN[p.status] ?? p.status,
  total_tasks:           p.total_tasks ?? 0,
  done_tasks:            p.done_tasks ?? 0,
  created_at:            p.criado_em,
  updated_at:            p.atualizado_em,
  is_owner:              p.is_owner ?? false,
  invite_code:           p.invite_code ?? null,
  pending_members_count: p.pending_members_count ?? 0,
})

export const projectToApi = (data) => {
  const out = {}
  if (data.name        !== undefined) out.nome      = data.name
  if (data.color       !== undefined) out.cor       = data.color
  if (data.category_id !== undefined) out.categoria = data.category_id
  if (data.columns     !== undefined) out.columns   = data.columns
  if (data.status      !== undefined) out.status    = PROJECT_STATUS_TO_PT[data.status] ?? data.status
  return out
}

// ── Column ────────────────────────────────────────────────────────────────────
export const mapColumn = (c) => ({
  id:             c.id,
  name:           c.nome,
  position:       c.posicao ?? 0,
  is_done_column: c.is_done_column ?? false,
  tasks:          (c.tasks ?? []).map(mapTaskCard),
})

export const columnToApi = (data) => {
  const out = {}
  if (data.project_id     !== undefined) out.projeto        = data.project_id
  if (data.name           !== undefined) out.nome           = data.name
  if (data.position       !== undefined) out.posicao        = data.position
  if (data.is_done_column !== undefined) out.is_done_column = data.is_done_column
  return out
}

// ── Subtask ───────────────────────────────────────────────────────────────────
// TaskModal uses: st.id, st.title, st.completed
export const mapSubtask = (s) => ({
  id:        s.id,
  title:     s.titulo,
  completed: s.concluida,
  position:  s.posicao ?? 0,
})

// ── Attachment ────────────────────────────────────────────────────────────────
// TaskModal uses: att.id, att.original_name, att.size_bytes, att.url
export const mapAttachment = (a) => ({
  id:            a.id,
  url:           a.arquivo_url,
  original_name: a.nome_original,
  mime_type:     a.mime_type,
  size_bytes:    a.tamanho_bytes,
})

// ── Task card (board view) ────────────────────────────────────────────────────
// TaskCard.vue uses: task.title, task.priority, task.due_date,
//                    task.subtask_count, task.subtask_done, task.attachment_count
export const mapTaskCard = (t) => ({
  id:               t.id,
  title:            t.titulo,
  description:      t.descricao,
  position:         t.posicao ?? 0,
  priority:         PRIORITY_TO_EN[t.prioridade] ?? t.prioridade,
  due_date:         t.data_limite ?? null,
  assigned_to:      t.atribuido_para_username ?? null,
  subtask_count:    t.subtarefas_total ?? 0,
  subtask_done:     t.subtarefas_concluidas ?? 0,
  attachment_count: t.anexos_total ?? 0,
  created_at:       t.criado_em,
})

// ── Task full detail ──────────────────────────────────────────────────────────
// TaskModal uses: task.id, task.title, task.description, task.priority,
//                 task.due_date, task.column_id, task.created_at,
//                 task.subtasks[], task.attachments[]
export const mapTask = (t) => ({
  id:               t.id,
  title:            t.titulo,
  description:      t.descricao,
  status:           t.status,
  priority:         PRIORITY_TO_EN[t.prioridade] ?? t.prioridade,
  project_id:       t.projeto ?? null,
  column_id:        t.coluna ?? null,
  position:         t.posicao ?? 0,
  due_date:         t.data_limite ?? null,
  assigned_to:      t.atribuido_para ?? null,
  can_edit:         t.can_edit ?? false,
  subtasks:         (t.subtarefas ?? []).map(mapSubtask),
  attachments:      (t.anexos ?? []).map(mapAttachment),
  subtask_count:    t.subtarefas_total ?? 0,
  subtask_done:     t.subtarefas_concluidas ?? 0,
  attachment_count: t.anexos?.length ?? 0,
  created_at:       t.criado_em,
  updated_at:       t.atualizado_em,
})

// ── Task → API ────────────────────────────────────────────────────────────────
export const taskToApi = (data) => {
  const out = {}
  if (data.title       !== undefined) out.titulo         = data.title
  if (data.description !== undefined) out.descricao      = data.description
  if (data.status      !== undefined) out.status         = data.status
  if (data.priority    !== undefined) out.prioridade     = PRIORITY_TO_PT[data.priority] ?? data.priority
  if (data.project_id  !== undefined) out.projeto        = data.project_id
  if (data.column_id   !== undefined) out.coluna         = data.column_id
  if (data.position    !== undefined) out.posicao        = data.position
  if (data.due_date    !== undefined) out.data_limite    = data.due_date
  if (data.assigned_to !== undefined) out.atribuido_para = data.assigned_to
  return out
}
