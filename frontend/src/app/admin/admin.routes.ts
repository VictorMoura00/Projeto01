import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./configurator-overview.component').then(m => m.ConfiguratorOverviewComponent)
      },
      {
        path: 'forms',
        loadChildren: () => import('./forms/forms.routes').then(m => m.formsRoutes)
      },
      {
        path: 'entities',
        loadChildren: () => import('./entities/entities.routes').then(m => m.entitiesRoutes)
      },
      {
        path: 'parameters',
        loadChildren: () => import('./parameters/parameters.routes').then(m => m.parametersRoutes)
      },
      {
        path: 'access',
        loadChildren: () => import('./access/access.routes').then(m => m.accessRoutes)
      },
      {
        path: 'white-label',
        loadChildren: () => import('./white-label/white-label.routes').then(m => m.whiteLabelRoutes)
      },
      {
        path: 'modules',
        loadComponent: () => import('./configurator-placeholder.component').then(m => m.ConfiguratorPlaceholderComponent),
        data: {
          title: 'Módulos e menus',
          description: 'Defina quais módulos, submódulos e funções aparecem para cada projeto white label.',
          icon: 'pi pi-sitemap',
          features: [
            'Cadastro de módulos e submódulos por tenant.',
            'Controle de visibilidade de menus por plano, role ou feature flag.',
            'Ordenação e agrupamento das funções no shell do ERP.',
            'Publicação gradual de recursos em projetos específicos.'
          ]
        }
      },
      {
        path: 'workflows',
        loadComponent: () => import('./configurator-placeholder.component').then(m => m.ConfiguratorPlaceholderComponent),
        data: {
          title: 'Workflows',
          description: 'Configure fluxos, etapas e automações para entidades dinâmicas da base.',
          icon: 'pi pi-share-alt',
          features: [
            'Estados e transições por entidade.',
            'Regras de aprovação por role ou departamento.',
            'Ações automáticas por evento do ciclo de vida.',
            'Templates reutilizáveis para novos projetos.'
          ]
        }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./configurator-placeholder.component').then(m => m.ConfiguratorPlaceholderComponent),
        data: {
          title: 'Notificações',
          description: 'Gerencie canais, templates e gatilhos de comunicação do mini ERP.',
          icon: 'pi pi-bell',
          features: [
            'Templates por e-mail, sistema e webhooks.',
            'Preferências por tenant e perfil de usuário.',
            'Gatilhos baseados em workflow e alterações de dados.',
            'Histórico de entregas e falhas.'
          ]
        }
      },
      {
        path: 'audit',
        loadComponent: () => import('./configurator-placeholder.component').then(m => m.ConfiguratorPlaceholderComponent),
        data: {
          title: 'Auditoria',
          description: 'Acompanhe eventos críticos, alterações e rastreabilidade de configurações.',
          icon: 'pi pi-history',
          features: [
            'Linha do tempo de alterações por usuário.',
            'Comparação de antes e depois para parâmetros e entidades.',
            'Filtros por tenant, módulo, operação e período.',
            'Exportação para compliance e suporte.'
          ]
        }
      },
      {
        path: 'integrations',
        loadComponent: () => import('./configurator-placeholder.component').then(m => m.ConfiguratorPlaceholderComponent),
        data: {
          title: 'Integrações',
          description: 'Prepare conectores e credenciais para adaptar a base a diferentes clientes.',
          icon: 'pi pi-link',
          features: [
            'Cadastro seguro de endpoints e credenciais.',
            'Mapeamento de payloads por entidade.',
            'Webhooks e filas de sincronização.',
            'Monitoramento de saúde das integrações.'
          ]
        }
      }
    ]
  }
];
