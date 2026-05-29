# Integração zntt-control ↔ Taskie API

**Documento para o desenvolvedor do backend Taskie (Django)**

---

## Índice

1. [Contexto e Objetivo](#1-contexto-e-objetivo)
2. [Arquitetura da Integração](#2-arquitetura-da-integração)
3. [Fase 1 — Dependências e Configurações](#3-fase-1--dependências-e-configurações)
4. [Fase 2 — Novo app `projects`](#4-fase-2--novo-app-projects)
5. [Fase 3 — Alterações no app `tasks`](#5-fase-3--alterações-no-app-tasks)
6. [Fase 4 — Configuração de Mídia (logos e anexos)](#6-fase-4--configuração-de-mídia-logos-e-anexos)
7. [Fase 5 — Registrar tudo em settings.py e urls.py](#7-fase-5--registrar-tudo-em-settingspy-e-urlspy)
8. [Fase 6 — Migrações](#8-fase-6--migrações)
9. [Fase 7 — zntt-control Frontend (lado do Zannatta)](#9-fase-7--zntt-control-frontend-lado-do-zannatta)
10. [Contrato de API Completo](#10-contrato-de-api-completo)
11. [Compatibilidade com App Mobile Taskie](#11-compatibilidade-com-app-mobile-taskie)

---

## 1. Contexto e Objetivo

### Situação atual

| App | Stack | Banco | Status |
|-----|-------|-------|--------|
| **Taskie** (mobile) | Flutter + Django REST | PostgreSQL | Produção |
| **zntt-control** (desktop) | Vue 3 + Quasar + Tauri | SQLite local | Offline, sem API |

### Objetivo

Unificar os dois apps em um **único backend Django** compartilhado, de forma que:

- O app mobile **Taskie continua funcionando sem alterações** (backward compatible)
- O app desktop **zntt-control passa a usar a API do Taskie** via HTTP/JWT
- Ambos os apps lêem e escrevem no **mesmo banco PostgreSQL**

### O que o zntt-control precisa que o Taskie ainda não tem

| Funcionalidade | Impacto no Backend |
|---|---|
| Múltiplos projetos | Novo model `Project` + `Category` |
| Colunas Kanban dinâmicas por projeto | Novo model `Column` |
| Subtarefas por tarefa | Novo model `Subtask` |
| Anexos de arquivo por tarefa | Novo model `Attachment` + upload de arquivos |
| Posição de task dentro da coluna | Campo `posicao` no `Task` |
| Mover task entre colunas | Novo endpoint `POST /tasks/{id}/move/` |
| Settings por usuário (tema, cor) | Novo model `UserSettings` |
| Reordenar colunas | Novo endpoint `PUT /projects/{id}/columns/reorder/` |
| Board completo (colunas + tasks aninhadas) | Novo endpoint `GET /projects/{id}/board/` |

---

## 2. Arquitetura da Integração

### Estrutura de apps após a integração

```
backend/apps/
├── authentication/     # existente — adicionar UserSettings
├── core/               # existente — sem alterações
├── tasks/              # existente — adicionar campos + Subtask + Attachment
└── projects/           # NOVO — Category, Project, Column
```

### Decisão crítica: Colunas × Status

O Taskie mobile usa `status` fixo (`backlog` / `em_andamento` / `concluido`).  
O zntt-control usa **colunas dinâmicas** — a coluna em que a task está determina seu estado.

**Regra de compatibilidade adotada:**

- Tasks **sem coluna** (`coluna = null`): `status` funciona exatamente como hoje para o mobile.
- Tasks **com coluna**: `status` é auto-derivado de `coluna.is_done_column` no `save()`.
  - `is_done_column = True` → `status = 'concluido'`
  - `is_done_column = False` → `status = 'em_andamento'`
  - A regra "concluído é irreversível" **não se aplica** a tasks com coluna (arrastar entre colunas deve ser livre).

O app mobile lê o campo `status` normalmente — tasks de projetos do desktop aparecerão como `em_andamento` ou `concluido`. **Nenhuma mudança no app mobile é necessária.**

---

## 3. Fase 1 — Dependências e Configurações

### 3.1 Instalar Pillow (para logos de projeto)

```bash
pip install Pillow
```

Adicionar no `requirements.txt`:
```
Pillow==10.3.0
```

### 3.2 CORS para o app desktop (Tauri)

O Tauri desktop usa origem `tauri://localhost` ou `http://localhost:1420`. Adicionar ao `config/settings/base.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    # Desktop (Tauri)
    "http://localhost:1420",
    "http://127.0.0.1:1420",
    "tauri://localhost",
]
```

---

## 4. Fase 2 — Novo app `projects`

### 4.1 Criar o app

```bash
cd backend
python manage.py startapp projects apps/projects
```

### 4.2 `apps/projects/models.py`

```python
import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import SoftDeleteModel, BaseModel


class Category(BaseModel):
    """Categorias para organizar projetos"""

    nome = models.CharField(max_length=100)
    criado_por = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='categories'
    )

    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['nome']
        unique_together = [['nome', 'criado_por']]

    def __str__(self):
        return self.nome

    @property
    def total_projetos(self):
        return self.projects.filter(deletado_em__isnull=True).count()


class Project(SoftDeleteModel):
    """Projetos do zntt-control"""

    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('pausado', 'Pausado'),
        ('concluido', 'Concluído'),
    ]

    nome = models.CharField(max_length=255)
    cor = models.CharField(max_length=7, default='#7c6af7')
    logo = models.ImageField(
        upload_to='projects/logos/',
        null=True,
        blank=True
    )
    categoria = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='projects'
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='ativo'
    )
    criado_por = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='projects'
    )

    class Meta:
        verbose_name = 'Projeto'
        verbose_name_plural = 'Projetos'
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['criado_por', '-criado_em']),
            models.Index(fields=['status', '-criado_em']),
            models.Index(fields=['deletado_em']),
        ]

    def __str__(self):
        return self.nome

    @property
    def total_tasks(self):
        return self.tasks.filter(deletado_em__isnull=True).count()

    @property
    def done_tasks(self):
        done_columns = self.columns.filter(is_done_column=True)
        return self.tasks.filter(
            coluna__in=done_columns,
            deletado_em__isnull=True
        ).count()


class Column(BaseModel):
    """Colunas do board Kanban de um projeto"""

    projeto = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='columns'
    )
    nome = models.CharField(max_length=100)
    posicao = models.IntegerField(default=0)
    is_done_column = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Coluna'
        verbose_name_plural = 'Colunas'
        ordering = ['posicao']
        indexes = [
            models.Index(fields=['projeto', 'posicao']),
        ]

    def __str__(self):
        return f"{self.projeto.nome} › {self.nome}"
```

### 4.3 `apps/projects/serializers.py`

```python
from rest_framework import serializers
from .models import Category, Project, Column


class CategorySerializer(serializers.ModelSerializer):
    total_projetos = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = ('id', 'nome', 'total_projetos', 'criado_em')
        read_only_fields = ('id', 'criado_em', 'total_projetos')

    def validate_nome(self, value):
        if not value.strip():
            raise serializers.ValidationError("Nome não pode estar vazio.")
        user = self.context['request'].user
        qs = Category.objects.filter(nome__iexact=value.strip(), criado_por=user)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Você já tem uma categoria com esse nome.")
        return value.strip()

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class ColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ('id', 'projeto', 'nome', 'posicao', 'is_done_column', 'criado_em')
        read_only_fields = ('id', 'criado_em')

    def validate(self, attrs):
        # Garante que só uma coluna por projeto seja is_done_column=True
        # (validação extra no view ao criar/atualizar)
        return attrs


class ColumnCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ('projeto', 'nome', 'posicao', 'is_done_column')

    def validate_nome(self, value):
        if not value.strip():
            raise serializers.ValidationError("Nome da coluna não pode estar vazio.")
        return value.strip()


class ColumnUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ('nome', 'is_done_column')

    def validate_nome(self, value):
        if not value.strip():
            raise serializers.ValidationError("Nome da coluna não pode estar vazio.")
        return value.strip()


# Serializer compacto de task para uso dentro do board
class TaskCardSerializer(serializers.Serializer):
    """Serializer leve para exibição no board — evita circular import"""
    id = serializers.UUIDField()
    titulo = serializers.CharField()
    descricao = serializers.CharField(allow_null=True)
    posicao = serializers.IntegerField()
    prioridade = serializers.CharField()
    data_limite = serializers.DateTimeField(allow_null=True)
    atribuido_para_username = serializers.CharField(
        source='atribuido_para.username', allow_null=True
    )
    subtarefas_total = serializers.SerializerMethodField()
    subtarefas_concluidas = serializers.SerializerMethodField()
    anexos_total = serializers.SerializerMethodField()
    criado_em = serializers.DateTimeField()

    def get_subtarefas_total(self, obj):
        return obj.subtarefas.count()

    def get_subtarefas_concluidas(self, obj):
        return obj.subtarefas.filter(concluida=True).count()

    def get_anexos_total(self, obj):
        return obj.anexos.count()


class ColumnBoardSerializer(serializers.ModelSerializer):
    """Coluna com tasks aninhadas — usada no endpoint /board/"""
    tasks = serializers.SerializerMethodField()

    class Meta:
        model = Column
        fields = ('id', 'nome', 'posicao', 'is_done_column', 'tasks')

    def get_tasks(self, obj):
        tasks = obj.tasks.filter(
            deletado_em__isnull=True
        ).select_related(
            'atribuido_para'
        ).prefetch_related(
            'subtarefas', 'anexos'
        ).order_by('posicao')
        return TaskCardSerializer(tasks, many=True).data


class ProjectSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True, allow_null=True)
    total_tasks = serializers.ReadOnlyField()
    done_tasks = serializers.ReadOnlyField()
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'nome', 'cor', 'logo', 'logo_url',
            'categoria', 'categoria_nome', 'status',
            'total_tasks', 'done_tasks',
            'criado_em', 'atualizado_em',
        )
        read_only_fields = ('id', 'criado_em', 'atualizado_em', 'logo_url')

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.logo.url)
        return obj.logo.url

    def validate_nome(self, value):
        if not value.strip():
            raise serializers.ValidationError("Nome do projeto não pode estar vazio.")
        return value.strip()

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class ProjectCreateSerializer(serializers.ModelSerializer):
    columns = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    class Meta:
        model = Project
        fields = ('nome', 'cor', 'categoria', 'columns')

    def validate_nome(self, value):
        if not value.strip():
            raise serializers.ValidationError("Nome do projeto não pode estar vazio.")
        return value.strip()

    def validate_columns(self, value):
        if not value:
            raise serializers.ValidationError("O projeto precisa ter pelo menos uma coluna.")
        done_count = sum(1 for c in value if c.get('is_done_column', False))
        if done_count != 1:
            raise serializers.ValidationError("Exatamente uma coluna deve ser marcada como done.")
        return value

    def create(self, validated_data):
        columns_data = validated_data.pop('columns', [])
        validated_data['criado_por'] = self.context['request'].user
        project = super().create(validated_data)
        for i, col_data in enumerate(columns_data):
            Column.objects.create(
                projeto=project,
                nome=col_data.get('nome', f'Coluna {i+1}'),
                posicao=i,
                is_done_column=col_data.get('is_done_column', False)
            )
        return project


class ProjectStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('status',)

    def validate_status(self, value):
        valid = [s[0] for s in Project.STATUS_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f"Status inválido. Use: {valid}")
        return value
```

### 4.4 `apps/projects/permissions.py`

```python
from rest_framework import permissions


class IsProjectOwner(permissions.BasePermission):
    """Apenas o criador do projeto pode modificá-lo"""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Para Column e Category, verifica o campo criado_por diretamente ou via projeto
        if hasattr(obj, 'criado_por'):
            return obj.criado_por == request.user
        if hasattr(obj, 'projeto'):
            return obj.projeto.criado_por == request.user
        return False
```

### 4.5 `apps/projects/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction

from apps.core.mixins import ActionSerializerMixin
from .models import Category, Project, Column
from .serializers import (
    CategorySerializer,
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectStatusSerializer,
    ColumnSerializer,
    ColumnCreateSerializer,
    ColumnUpdateSerializer,
    ColumnBoardSerializer,
)
from .permissions import IsProjectOwner


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(criado_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if category.total_projetos > 0:
            return Response(
                {'detail': f'Não é possível excluir: {category.total_projetos} projeto(s) usa(m) esta categoria.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class ProjectViewSet(ActionSerializerMixin, viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    serializer_classes = {
        'create': ProjectCreateSerializer,
        'update_status': ProjectStatusSerializer,
    }
    permission_classes = [IsAuthenticated, IsProjectOwner]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Project.objects.filter(
            criado_por=self.request.user
        ).select_related('categoria').prefetch_related('columns')

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectStatusSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProjectSerializer(project, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='logo', parser_classes=[MultiPartParser, FormParser])
    def upload_logo(self, request, pk=None):
        project = self.get_object()
        if 'logo' not in request.FILES:
            return Response({'detail': 'Nenhum arquivo enviado.'}, status=status.HTTP_400_BAD_REQUEST)
        project.logo = request.FILES['logo']
        project.save(update_fields=['logo'])
        return Response(ProjectSerializer(project, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='board')
    def board(self, request, pk=None):
        """Retorna todas as colunas com tasks aninhadas"""
        project = self.get_object()
        columns = project.columns.prefetch_related(
            'tasks__subtarefas',
            'tasks__anexos',
            'tasks__atribuido_para'
        ).order_by('posicao')
        serializer = ColumnBoardSerializer(columns, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'], url_path='columns/reorder')
    def reorder_columns(self, request, pk=None):
        """
        Reordena colunas do projeto.
        Body: { "ids": ["uuid1", "uuid2", "uuid3"] }
        """
        project = self.get_object()
        ids = request.data.get('ids', [])

        if not ids:
            return Response({'detail': 'Lista de ids é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for posicao, col_id in enumerate(ids):
                Column.objects.filter(pk=col_id, projeto=project).update(posicao=posicao)

        return Response({'status': 'ok'})


class ColumnViewSet(ActionSerializerMixin, viewsets.ModelViewSet):
    serializer_class = ColumnSerializer
    serializer_classes = {
        'create': ColumnCreateSerializer,
        'update': ColumnUpdateSerializer,
        'partial_update': ColumnUpdateSerializer,
    }
    permission_classes = [IsAuthenticated, IsProjectOwner]

    def get_queryset(self):
        return Column.objects.filter(
            projeto__criado_por=self.request.user
        ).select_related('projeto')

    def perform_create(self, serializer):
        instance = serializer.save()
        # Se nova coluna é done, desmarcar as outras
        if instance.is_done_column:
            Column.objects.filter(
                projeto=instance.projeto
            ).exclude(pk=instance.pk).update(is_done_column=False)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.is_done_column:
            Column.objects.filter(
                projeto=instance.projeto
            ).exclude(pk=instance.pk).update(is_done_column=False)
        # Sincronizar status das tasks afetadas
        self._sync_tasks_status(instance)

    def _sync_tasks_status(self, column):
        from apps.tasks.models import Task
        new_status = 'concluido' if column.is_done_column else 'em_andamento'
        Task.objects.filter(coluna=column).update(status=new_status)

    def destroy(self, request, *args, **kwargs):
        column = self.get_object()
        task_count = column.tasks.filter(deletado_em__isnull=True).count()
        if task_count > 0:
            return Response(
                {'detail': f'Não é possível excluir: a coluna tem {task_count} tarefa(s).'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
```

### 4.6 `apps/projects/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'projects'

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'columns', views.ColumnViewSet, basename='column')

urlpatterns = [
    path('', include(router.urls)),
]
```

### 4.7 `apps/projects/admin.py`

```python
from django.contrib import admin
from .models import Category, Project, Column


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('nome', 'criado_por', 'total_projetos', 'criado_em')
    list_filter = ('criado_por',)
    search_fields = ('nome',)


class ColumnInline(admin.TabularInline):
    model = Column
    extra = 0
    fields = ('nome', 'posicao', 'is_done_column')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('nome', 'status', 'criado_por', 'categoria', 'criado_em')
    list_filter = ('status', 'criado_por')
    search_fields = ('nome',)
    inlines = [ColumnInline]


@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ('nome', 'projeto', 'posicao', 'is_done_column')
    list_filter = ('projeto', 'is_done_column')
    search_fields = ('nome',)
```

### 4.8 `apps/projects/apps.py`

```python
from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.projects'
    verbose_name = 'Projetos'
```

---

## 5. Fase 3 — Alterações no app `tasks`

### 5.1 Novos models: Subtask e Attachment

Adicionar ao final de `apps/tasks/models.py`:

```python
# ──────────────────────────────────────────
# Adicionar os imports no topo do arquivo:
# from apps.core.models import SoftDeleteModel, BaseModel
# ──────────────────────────────────────────

class Subtask(BaseModel):
    """Subtarefas de uma task"""

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='subtarefas'
    )
    titulo = models.CharField(max_length=255)
    concluida = models.BooleanField(default=False)
    posicao = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Subtarefa'
        verbose_name_plural = 'Subtarefas'
        ordering = ['posicao', 'criado_em']

    def __str__(self):
        return f"{self.task.titulo} › {self.titulo}"


class Attachment(BaseModel):
    """Arquivos anexados a uma task"""

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='anexos'
    )
    arquivo = models.FileField(upload_to='tasks/attachments/%Y/%m/')
    nome_original = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, null=True, blank=True)
    tamanho_bytes = models.BigIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = 'Anexo'
        verbose_name_plural = 'Anexos'
        ordering = ['criado_em']

    def __str__(self):
        return f"{self.task.titulo} › {self.nome_original}"
```

### 5.2 Alterações no model `Task`

Adicionar os seguintes campos ao model `Task` existente (antes do `class Meta`):

```python
# Adicionar dentro da classe Task, após o campo data_limite:

projeto = models.ForeignKey(
    'projects.Project',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='tasks'
)
coluna = models.ForeignKey(
    'projects.Column',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='tasks'
)
posicao = models.IntegerField(default=0)
```

Também adicionar `posicao` e `coluna` nos indexes do `Meta`:

```python
class Meta:
    # ... manter o que já existe e adicionar:
    indexes = [
        models.Index(fields=['status', '-criado_em']),
        models.Index(fields=['criado_por', '-criado_em']),
        models.Index(fields=['atribuido_para', '-criado_em']),
        models.Index(fields=['deletado_em']),
        # Novos:
        models.Index(fields=['coluna', 'posicao']),
        models.Index(fields=['projeto', '-criado_em']),
    ]
```

### 5.3 Atualizar `Task.save()` para sincronizar status com coluna

Modificar o método `save()` do model `Task`. Adicionar ao final do método, antes do `super().save()`:

```python
def save(self, *args, **kwargs):
    user = getattr(self, '_history_user', None)

    if self.pk and user:
        # ... código existente de histórico (não alterar) ...
        pass

    # NOVO: sincroniza status com a coluna (se tiver coluna definida)
    if self.coluna_id:
        from apps.projects.models import Column as Col
        try:
            col = Col.objects.get(pk=self.coluna_id)
            derived_status = 'concluido' if col.is_done_column else 'em_andamento'
            if self.status != derived_status:
                self.status = derived_status
        except Col.DoesNotExist:
            pass

    super().save(*args, **kwargs)
```

### 5.4 Atualizar `apps/tasks/serializers.py`

Adicionar os novos serializers e atualizar os existentes.

**Adicionar ao final do arquivo** (após os serializers existentes):

```python
from .models import Task, TaskHistory, Subtask, Attachment


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ('id', 'task', 'titulo', 'concluida', 'posicao', 'criado_em')
        read_only_fields = ('id', 'criado_em')


class SubtaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ('task', 'titulo', 'posicao')

    def validate_titulo(self, value):
        if not value.strip():
            raise serializers.ValidationError("Título não pode estar vazio.")
        return value.strip()


class AttachmentSerializer(serializers.ModelSerializer):
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ('id', 'task', 'arquivo', 'arquivo_url', 'nome_original', 'mime_type', 'tamanho_bytes', 'criado_em')
        read_only_fields = ('id', 'criado_em', 'arquivo_url', 'nome_original', 'mime_type', 'tamanho_bytes')

    def get_arquivo_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.arquivo.url)
        return obj.arquivo.url
```

**Atualizar `TaskSerializer`** para incluir subtarefas e anexos no detalhe da task:

```python
class TaskSerializer(serializers.ModelSerializer):
    criado_por_username = serializers.CharField(source='criado_por.username', read_only=True)
    atribuido_para_username = serializers.CharField(source='atribuido_para.username', read_only=True, allow_null=True)
    can_edit = serializers.SerializerMethodField()
    # Novos:
    subtarefas = SubtaskSerializer(many=True, read_only=True)
    anexos = AttachmentSerializer(many=True, read_only=True)
    subtarefas_total = serializers.SerializerMethodField()
    subtarefas_concluidas = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            'id', 'titulo', 'descricao', 'status', 'prioridade',
            'atribuido_para', 'atribuido_para_username', 'data_limite',
            'criado_por', 'criado_por_username', 'criado_em', 'atualizado_em',
            'can_edit',
            # Novos campos:
            'projeto', 'coluna', 'posicao',
            'subtarefas', 'anexos',
            'subtarefas_total', 'subtarefas_concluidas',
        )

    def get_can_edit(self, obj):
        request = self.context.get('request')
        return request is not None and obj.criado_por == request.user

    def get_subtarefas_total(self, obj):
        return obj.subtarefas.count()

    def get_subtarefas_concluidas(self, obj):
        return obj.subtarefas.filter(concluida=True).count()

    def validate_status(self, value):
        """Regra de irreversibilidade apenas para tasks SEM coluna (mobile)"""
        if self.instance and self.instance.coluna_id is None:
            if self.instance.status == 'concluido' and value != 'concluido':
                raise serializers.ValidationError(
                    "Não é possível alterar status de tarefa concluída"
                )
        return value

    # ... manter o restante (validate_titulo, validate_atribuido_para, validate, create, update) ...
```

**Atualizar `TaskCreateSerializer`** para aceitar `projeto`, `coluna`, `posicao`:

```python
class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('titulo', 'descricao', 'prioridade', 'atribuido_para', 'data_limite',
                  'projeto', 'coluna', 'posicao')  # adicionados

    def validate_titulo(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Título não pode estar vazio")
        return value.strip()

    def validate(self, attrs):
        # Se tem coluna, deve ter projeto
        if attrs.get('coluna') and not attrs.get('projeto'):
            raise serializers.ValidationError({'projeto': 'Projeto é obrigatório quando coluna é informada.'})
        return attrs
```

**Atualizar `TaskUpdateSerializer`** para aceitar `coluna` e `posicao`:

```python
class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('titulo', 'descricao', 'status', 'prioridade', 'atribuido_para',
                  'data_limite', 'coluna', 'posicao')  # adicionados

    def validate_status(self, value):
        """Irreversibilidade apenas para tasks sem coluna"""
        if self.instance and self.instance.coluna_id is None:
            if self.instance.status == 'concluido' and value != 'concluido':
                raise serializers.ValidationError(
                    "Não é possível alterar status de tarefa concluída"
                )
        return value
```

### 5.5 Atualizar `apps/tasks/filters.py`

Adicionar filtros por `projeto` e `coluna`:

```python
class TaskFilter(django_filters.FilterSet):
    # ... manter tudo que já existe e adicionar:

    projeto = django_filters.UUIDFilter(field_name='projeto__id')
    coluna = django_filters.UUIDFilter(field_name='coluna__id')

    class Meta:
        model = Task
        fields = {
            'status': ['exact'],
            'prioridade': ['exact'],
            'criado_por': ['exact'],
            'atribuido_para': ['exact'],
            'projeto': ['exact'],
            'coluna': ['exact'],
        }
```

### 5.6 Atualizar `apps/tasks/views.py`

Adicionar os novos endpoints e viewsets.

**No `TaskViewSet` existente**, adicionar os novos actions:

```python
from django.db import transaction
from django.db.models import F
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Task, TaskHistory, Subtask, Attachment
from .serializers import (
    TaskSerializer, TaskHistorySerializer,
    TaskCreateSerializer, TaskUpdateSerializer,
    SubtaskSerializer, SubtaskCreateSerializer,
    AttachmentSerializer,
)

# Adicionar dentro da classe TaskViewSet:

def get_queryset(self):
    return Task.objects.select_related(
        'criado_por', 'atribuido_para', 'projeto', 'coluna'
    ).prefetch_related(
        'subtarefas', 'anexos'
    ).all()

@action(detail=True, methods=['post'], url_path='move')
def move(self, request, pk=None):
    """
    Move task para outra coluna com reordenação de posições.
    Body: { "coluna_id": "uuid", "posicao": 2 }
    """
    task = self.get_object()
    nova_coluna_id = request.data.get('coluna_id')
    nova_posicao = int(request.data.get('posicao', 0))

    if not nova_coluna_id:
        return Response({'detail': 'coluna_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

    from apps.projects.models import Column
    try:
        nova_coluna = Column.objects.get(pk=nova_coluna_id)
    except Column.DoesNotExist:
        return Response({'detail': 'Coluna não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        old_coluna_id = task.coluna_id

        # Fechar gap na coluna de origem
        if old_coluna_id:
            Task.objects.filter(
                coluna_id=old_coluna_id,
                posicao__gt=task.posicao,
                deletado_em__isnull=True
            ).update(posicao=F('posicao') - 1)

        # Abrir espaço na coluna de destino
        Task.objects.filter(
            coluna_id=nova_coluna_id,
            posicao__gte=nova_posicao,
            deletado_em__isnull=True
        ).exclude(pk=task.pk).update(posicao=F('posicao') + 1)

        # Atualizar a task
        task.coluna = nova_coluna
        task.posicao = nova_posicao
        task.status = 'concluido' if nova_coluna.is_done_column else 'em_andamento'
        task.save(update_fields=['coluna', 'posicao', 'status', 'atualizado_em'])

    serializer = TaskSerializer(task, context={'request': request})
    return Response(serializer.data)
```

**Adicionar SubtaskViewSet e AttachmentViewSet** (novas classes no mesmo arquivo):

```python
class SubtaskViewSet(ActionSerializerMixin, viewsets.ModelViewSet):
    serializer_class = SubtaskSerializer
    serializer_classes = {
        'create': SubtaskCreateSerializer,
    }
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subtask.objects.select_related('task')

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, pk=None):
        subtask = self.get_object()
        subtask.concluida = not subtask.concluida
        subtask.save(update_fields=['concluida'])
        return Response(SubtaskSerializer(subtask).data)


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Attachment.objects.select_related('task')

    def create(self, request, *args, **kwargs):
        """Upload de anexo para uma task. Body: multipart/form-data com 'task' e 'arquivo'"""
        arquivo = request.FILES.get('arquivo')
        task_id = request.data.get('task')

        if not arquivo:
            return Response({'detail': 'Arquivo é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        attachment = Attachment.objects.create(
            task_id=task_id,
            arquivo=arquivo,
            nome_original=arquivo.name,
            mime_type=arquivo.content_type,
            tamanho_bytes=arquivo.size,
        )
        return Response(
            AttachmentSerializer(attachment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
```

### 5.7 Atualizar `apps/tasks/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'tasks'

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'subtasks', views.SubtaskViewSet, basename='subtask')
router.register(r'attachments', views.AttachmentViewSet, basename='attachment')

urlpatterns = [
    path('', include(router.urls)),
]
```

### 5.8 UserSettings no app `authentication`

Adicionar ao `apps/authentication/models.py`:

```python
from django.db import models
from django.contrib.auth.models import User


class UserSettings(models.Model):
    """Preferências de UI por usuário (tema, cor accent)"""

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='settings'
    )
    tema = models.CharField(max_length=20, default='dark')
    cor_accent = models.CharField(max_length=7, default='#6366f1')
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configurações do Usuário'
        verbose_name_plural = 'Configurações dos Usuários'

    def __str__(self):
        return f"Settings de {self.usuario.username}"
```

Adicionar ao `apps/authentication/serializers.py`:

```python
from .models import UserSettings

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ('tema', 'cor_accent', 'atualizado_em')
        read_only_fields = ('atualizado_em',)
```

Adicionar ao `apps/authentication/views.py`:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserSettings
from .serializers import UserSettingsSerializer

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(usuario=request.user)
        return Response(UserSettingsSerializer(settings_obj).data)

    def put(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(usuario=request.user)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
```

Adicionar à `apps/authentication/urls.py`:

```python
from django.urls import path
from .views import UserSettingsView
# ... manter imports existentes ...

# Adicionar ao urlpatterns:
path('settings/', UserSettingsView.as_view(), name='user-settings'),
```

---

## 6. Fase 4 — Configuração de Mídia (logos e anexos)

### 6.1 Adicionar ao `config/settings/base.py`

```python
import os

# Media files (logos, attachments)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### 6.2 Atualizar `config/urls.py`

```python
from django.conf import settings
from django.conf.urls.static import static

# Adicionar ao final do arquivo, após o urlpatterns:
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

> **Para produção:** configure nginx para servir `/media/` a partir de `MEDIA_ROOT`. Exemplo no `docker-compose.yml`:
> ```yaml
> volumes:
>   - ./media:/app/media
> ```

### 6.3 Atualizar `Dockerfile`

Adicionar criação do diretório de mídia:

```dockerfile
# Após WORKDIR /app:
RUN mkdir -p /app/media/projects/logos /app/media/tasks/attachments
```

---

## 7. Fase 5 — Registrar tudo em `settings.py` e `urls.py`

### 7.1 `config/settings/base.py` — adicionar app

```python
LOCAL_APPS = [
    'apps.core',
    'apps.authentication',
    'apps.tasks',
    'apps.projects',   # NOVO
]
```

### 7.2 `config/urls.py` — adicionar rotas

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api_root'),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/', include('apps.tasks.urls')),
    path('api/', include('apps.projects.urls')),   # NOVO
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
```

Atualizar o `api_root` para incluir os novos endpoints:

```python
def api_root(request):
    return JsonResponse({
        'message': 'Taskie Task Manager API',
        'version': '2.0',
        'endpoints': {
            'authentication': '/api/auth/',
            'tasks': '/api/tasks/',
            'subtasks': '/api/subtasks/',
            'attachments': '/api/attachments/',
            'projects': '/api/projects/',
            'columns': '/api/columns/',
            'categories': '/api/categories/',
            'settings': '/api/auth/settings/',
            'admin': '/admin/',
            'docs': '/api/docs/',
        }
    })
```

---

## 8. Fase 6 — Migrações

```bash
cd backend

# Criar migrations para todos os apps alterados
python manage.py makemigrations projects
python manage.py makemigrations tasks
python manage.py makemigrations authentication

# Aplicar
python manage.py migrate

# Se usando Docker:
docker-compose exec web python manage.py makemigrations projects
docker-compose exec web python manage.py makemigrations tasks
docker-compose exec web python manage.py makemigrations authentication
docker-compose exec web python manage.py migrate
```

> **Atenção:** os campos `projeto`, `coluna` e `posicao` adicionados ao `Task` são `null=True, blank=True` — sem impacto nos dados existentes do mobile.

---

## 9. Fase 7 — zntt-control Frontend (lado do Zannatta)

Esta fase é executada pelo dono do zntt-control. Documentada aqui para referência cruzada.

### 9.1 Ativar axios

```bash
npm install axios
```

Em `src/infrastructure/api.js`, descomentar o conteúdo e ajustar:

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          err.config.headers.Authorization = `Bearer ${data.access}`
          return api.request(err.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  },
)

export { api }
```

### 9.2 Atualizar repositórios HTTP

Em cada `src/domains/{domain}/{domain}.service.js`, trocar:
```js
import { XRepository } from '@/infrastructure/ipc/x.repository'
```
por:
```js
import { XRepository } from '@/infrastructure/http/x.repository'
```

### 9.3 Ajustar os stubs HTTP existentes

Os arquivos em `src/infrastructure/http/` já existem com os contratos corretos. Apenas verificar que os paths batem com os endpoints abaixo.

**`board.repository.js`** — ajustar path do board:
```js
getBoard: (projectId) => api.get(`/projects/${projectId}/board/`).then(r => r.data),
reorderColumns: (projectId, ids) => api.put(`/projects/${projectId}/columns/reorder/`, { ids }).then(() => {}),
```

**`task.repository.js`** — ajustar move e subtasks:
```js
move:           (taskId, target) => api.post(`/tasks/${taskId}/move/`, target).then(r => r.data),
createSubtask:  (data) => api.post('/subtasks/', data).then(r => r.data),
toggleSubtask:  (id) => api.post(`/subtasks/${id}/toggle/`).then(r => r.data),
deleteSubtask:  (id) => api.delete(`/subtasks/${id}/`).then(() => {}),
addAttachment:  (taskId, file) => {
  const form = new FormData()
  form.append('task', taskId)
  form.append('arquivo', file)
  return api.post('/attachments/', form).then(r => r.data)
},
deleteAttachment: (id) => api.delete(`/attachments/${id}/`).then(() => {}),
```

### 9.4 Drag-and-drop de tasks entre colunas

**Status: corrigido** — o código já está atualizado nos arquivos `TaskList.vue` e `ProjectBoardPage.vue`.

**Problema que existia:** `TaskList.vue` usava `Sortable.create()` raw (sortablejs direto) enquanto as colunas usavam `VueDraggable` (vue-draggable-plus). Dois instâncias SortableJS no mesmo DOM tree causavam conflito — o drag simplesmente não iniciava. Além disso, o `onAdd` removia o elemento DOM manualmente após o SortableJS já tê-lo movido, desincronizando com o virtual DOM do Vue.

**Solução aplicada:**
- `TaskList.vue` agora usa `VueDraggable` com `v-model` via computed writável, mesma biblioteca das colunas
- Removida a manipulação manual do DOM (`evt.item.parentNode?.removeChild(...)`)
- `v-model:tasks` no lugar de `:tasks` — VueDraggable atualiza automaticamente os arrays de origem e destino ao mover entre colunas
- `onDragReorder` e `onDragMoved` em `ProjectBoardPage.vue` removidos os splices manuais — os arrays já estão atualizados quando os eventos chegam

**Contrato de evento mantido:**
- `@reorder` — reordenação dentro da mesma coluna: `{ colId, oldIndex, newIndex }`
- `@moved` — mover entre colunas: `{ taskId, fromColId, toColId, newIndex }`

Ao migrar para HTTP, o `moveTask()` chamado nesses handlers fará `POST /api/tasks/{id}/move/` em vez do IPC, sem mais nenhuma alteração necessária.

### 9.5 Tela de login

Criar `src/pages/LoginPage.vue` que:
1. Faz `POST /api/auth/login/` com `{ username, password }`
2. Salva `access_token` e `refresh_token` no `localStorage`
3. Redireciona para `/`

Adicionar guard de rota no `src/router/index.js`:
```js
router.beforeEach((to, from, next) => {
  const publicRoutes = ['/login']
  const token = localStorage.getItem('access_token')
  if (!token && !publicRoutes.includes(to.path)) {
    next('/login')
  } else {
    next()
  }
})
```

> **Observação:** `window.location.href = '/login'` dentro do interceptor de 401 deve ser trocado por `router.push('/login')` após o router estar acessível no módulo do api.js.

---

## 10. Contrato de API Completo

### Autenticação

| Método | URL | Descrição |
|--------|-----|-----------|
| `POST` | `/api/auth/login/` | Login → `{ access, refresh, user }` |
| `POST` | `/api/auth/refresh/` | Renovar token → `{ access }` |
| `POST` | `/api/auth/logout/` | Logout (invalida refresh) |
| `GET`  | `/api/auth/me/` | Dados do usuário autenticado |
| `POST` | `/api/auth/register/` | Registro de novo usuário |
| `GET`  | `/api/auth/users/` | Lista todos usuários (para atribuição) |
| `GET`  | `/api/auth/settings/` | Settings do usuário atual |
| `PUT`  | `/api/auth/settings/` | Salvar tema e cor accent |

### Categorias

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET`    | `/api/categories/` | Lista categorias do usuário |
| `POST`   | `/api/categories/` | Criar categoria |
| `PUT`    | `/api/categories/{id}/` | Atualizar nome |
| `DELETE` | `/api/categories/{id}/` | Excluir (erro se tiver projetos) |

### Projetos

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET`    | `/api/projects/` | Lista projetos do usuário |
| `POST`   | `/api/projects/` | Criar projeto + colunas iniciais |
| `GET`    | `/api/projects/{id}/` | Detalhes do projeto |
| `PUT`    | `/api/projects/{id}/` | Atualizar (nome, cor, categoria) |
| `PATCH`  | `/api/projects/{id}/status/` | Atualizar status (ativo/pausado/concluido) |
| `DELETE` | `/api/projects/{id}/` | Soft delete |
| `POST`   | `/api/projects/{id}/logo/` | Upload de logo (multipart) |
| `GET`    | `/api/projects/{id}/board/` | Board completo: colunas + tasks aninhadas |
| `PUT`    | `/api/projects/{id}/columns/reorder/` | Reordenar colunas `{ ids: [...] }` |

### Colunas

| Método | URL | Descrição |
|--------|-----|-----------|
| `POST`   | `/api/columns/` | Criar coluna `{ projeto, nome, posicao, is_done_column }` |
| `PUT`    | `/api/columns/{id}/` | Atualizar `{ nome, is_done_column }` |
| `DELETE` | `/api/columns/{id}/` | Excluir (erro se tiver tasks) |

### Tasks

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET`    | `/api/tasks/` | Lista paginada (filtros: `projeto`, `coluna`, `status`, `search`, ...) |
| `POST`   | `/api/tasks/` | Criar `{ titulo, descricao, prioridade, projeto, coluna, posicao, atribuido_para, data_limite }` |
| `GET`    | `/api/tasks/{id}/` | Detalhes com subtarefas e anexos |
| `PATCH`  | `/api/tasks/{id}/` | Atualizar campos parciais |
| `DELETE` | `/api/tasks/{id}/` | Soft delete |
| `POST`   | `/api/tasks/{id}/move/` | Mover coluna `{ coluna_id, posicao }` |
| `GET`    | `/api/tasks/{id}/history/` | Histórico de alterações |
| `GET`    | `/api/tasks/my_tasks/` | Tasks criadas pelo usuário atual |
| `GET`    | `/api/tasks/assigned_to_me/` | Tasks atribuídas ao usuário atual |
| `GET`    | `/api/tasks/stats/` | Estatísticas |

### Subtarefas

| Método | URL | Descrição |
|--------|-----|-----------|
| `POST`   | `/api/subtasks/` | Criar `{ task, titulo, posicao }` |
| `POST`   | `/api/subtasks/{id}/toggle/` | Alternar concluída/pendente |
| `DELETE` | `/api/subtasks/{id}/` | Excluir |

### Anexos

| Método | URL | Descrição |
|--------|-----|-----------|
| `POST`   | `/api/attachments/` | Upload `multipart/form-data`: `task` + `arquivo` |
| `DELETE` | `/api/attachments/{id}/` | Excluir arquivo + registro |

---

## 11. Compatibilidade com App Mobile Taskie

Nenhuma alteração é necessária no app mobile Taskie.

### Por que continua funcionando

| Comportamento atual (mobile) | Após integração |
|---|---|
| Tasks não têm `projeto` nem `coluna` | Os campos são `null=True` — tasks antigas ficam com `null` |
| `status` é campo obrigatório | Campo mantido. Tasks sem coluna continuam usando `status` direto |
| Regra "concluído é irreversível" | Mantida para tasks sem coluna. Desativada apenas para tasks com coluna |
| Endpoints `/api/tasks/` | Nenhuma alteração nos paths |
| Paginação, filtros, ordenação | Nenhuma alteração |
| JWT auth | Nenhuma alteração |

### Novos campos visíveis no mobile (não quebram nada)

O `TaskSerializer` agora retorna `subtarefas`, `anexos`, `projeto`, `coluna`, `posicao`. Para tasks criadas pelo mobile, esses campos virão como listas vazias ou `null`. O app Flutter usa campos específicos — campos desconhecidos são ignorados pelo `Freezed` com `@JsonSerializable(explicitToJson: true)`.

### Sugestão futura (opcional)

Quando o app mobile quiser mostrar o board de um projeto, basta consumir `GET /api/projects/{id}/board/` — a estrutura já estará disponível.

---

## Checklist de Implementação

### Backend (seu amigo — Django)

- [ ] Criar app `apps/projects/` com os arquivos listados acima
- [ ] Adicionar `Subtask` e `Attachment` ao `apps/tasks/models.py`
- [ ] Adicionar campos `projeto`, `coluna`, `posicao` ao model `Task`
- [ ] Atualizar `Task.save()` para derivar `status` da coluna
- [ ] Atualizar `TaskSerializer` com subtarefas, anexos e novos campos
- [ ] Atualizar `TaskCreateSerializer` e `TaskUpdateSerializer`
- [ ] Atualizar `TaskFilter` com filtros `projeto` e `coluna`
- [ ] Adicionar action `move` ao `TaskViewSet`
- [ ] Adicionar `SubtaskViewSet` e `AttachmentViewSet`
- [ ] Atualizar `apps/tasks/urls.py`
- [ ] Adicionar `UserSettings` ao `apps/authentication/`
- [ ] Configurar `MEDIA_ROOT` e `MEDIA_URL` no settings
- [ ] Atualizar `config/urls.py` (rota projects + media)
- [ ] Adicionar `apps.projects` ao `INSTALLED_APPS`
- [ ] Adicionar `Pillow` ao `requirements.txt`
- [ ] Atualizar CORS para aceitar origem Tauri
- [ ] Rodar `makemigrations` + `migrate`
- [ ] Testar endpoints no Swagger (`/api/docs/`)

### Frontend — zntt-control (Zannatta)

- [x] **Drag-and-drop de tasks entre colunas corrigido** (`TaskList.vue` + `ProjectBoardPage.vue`)
- [ ] `npm install axios`
- [ ] Ativar `src/infrastructure/api.js`
- [ ] Criar `LoginPage.vue` + guard de rota
- [ ] Trocar imports IPC → HTTP nos services
- [ ] Ajustar paths nos repositórios HTTP
- [ ] Adaptar upload de logo (FormData em vez de path local)
- [ ] Adaptar upload de anexo (FormData em vez de path local)
- [ ] Configurar `VITE_API_URL` no `.env`
