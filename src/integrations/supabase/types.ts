export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: string | null;
          phone: string | null;
          oab_number: string | null;
          avatar_url: string | null;
          firm_logo_url: string | null;
          subscription_plan: 'start' | 'pro' | 'elite' | null;
          updated_at: string | null;
          profissao: string | null;
          oab_state: string | null;
          estado: string | null;
          endereco: string | null;
          numero: string | null;
          cpf: string | null;
          cep: string | null;
          cidade: string | null;
          bairro: string | null;
          complemento: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      processos: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          number: string;
          client: string;
          court: string;
          class: string;
          subject: string;
          active_party: string;
          passive_party: string;
          responsible: string;
          phase: string;
          status: 'Em andamento' | 'Aguardando prazo' | 'Concluído' | 'Suspenso';
          next_deadline: string | null;
          last_movement: string;
          last_checked_at?: string | null;
          value: number;
          docs_count: number;
          owner_id: string | null;
          escavador_update_id: number | null;
          status_atualizacao: 'NONE' | 'PENDING' | 'SUCCESS' | 'ERROR' | 'NOT_FOUND';
          ultima_movimentacao_hash: string | null;
          monitoramento_ativo: boolean;
          ultima_verificacao: string | null;
        };
        Insert: Omit<Database['public']['Tables']['processos']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['processos']['Insert']>;
      };
      process_movements: {
        Row: {
          id: string;
          created_at: string;
          process_id: string;
          process_number: string;
          movement_date: string;
          movement_type: string;
          full_text: string;
          is_relevant: boolean;
          external_id: number | null;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['process_movements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['process_movements']['Insert']>;
      };
      process_monitor_logs: {
        Row: {
          id: string;
          created_at: string;
          process_id: string | null;
          process_number: string | null;
          log_type: 'consulta_realizada' | 'atualizacao_encontrada' | 'erro_api' | 'callback_recebido';
          message: string | null;
          details: Record<string, unknown> | null;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['process_monitor_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['process_monitor_logs']['Insert']>;
      };
      escavador_callback_logs: {
        Row: {
          id: string;
          created_at: string;
          callback_id: number | null;
          callback_uuid: string | null;
          evento: string | null;
          status: string | null;
          numero_cnj: string | null;
          payload: Record<string, unknown> | null;
          processing_result: string | null;
          error_message: string | null;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['escavador_callback_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['escavador_callback_logs']['Insert']>;
      };
      deadlines: {
        Row: {
          id: string;
          process_id: string;
          titulo: string;
          descricao: string;
          data_inicio: string;
          data_fim: string;
          dias_uteis: number;
          status: 'Pendente' | 'Concluído' | 'Vencido' | 'Cancelado';
          owner_id: string;
        };
        Insert: Omit<Database['public']['Tables']['deadlines']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['deadlines']['Insert']>;
      };
      feriados_forenses: {
        Row: {
          data: string;
          descricao: string;
          tribunal: string;
        };
        Insert: Database['public']['Tables']['feriados_forenses']['Row'];
        Update: Partial<Database['public']['Tables']['feriados_forenses']['Row']>;
      };
      fees: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          client: string;
          process_number: string;
          description: string;
          value: number;
          status: 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
          due_date: string | null;
          paid_date: string | null;
          payment_method: 'a_vista' | 'entrada_parcelas' | 'cartao_credito';
          entrada_value: number | null;
          installments: number | null;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['fees']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['fees']['Insert']>;
      };
      office_expenses: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          category: 'luz' | 'agua' | 'assinaturas' | 'outros';
          description: string;
          value: number;
          status: 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
          due_date: string | null;
          paid_date: string | null;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['office_expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['office_expenses']['Insert']>;
      };
      office_expense_category_settings: {
        Row: {
          id: string;
          owner_id: string;
          category: 'luz' | 'agua' | 'assinaturas' | 'outros';
          display_name: string;
          budget_value: number;
        };
        Insert: Omit<Database['public']['Tables']['office_expense_category_settings']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['office_expense_category_settings']['Row']>;
      };
      documents: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          process_number: string;
          description: string;
          uploaded_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      inbox_items: {
        Row: {
          id: string;
          tipo: 'Publicação' | 'Andamento' | 'Documento' | 'Tarefa' | 'Sistema';
          titulo: string;
          descricao: string;
          referencia_id: string | null;
          lido: boolean;
          prioridade: 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
          owner_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inbox_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['inbox_items']['Insert']>;
      };
      crm_stages: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          color: string;
          position: number;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['crm_stages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['crm_stages']['Insert']>;
      };
      crm_clients: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email: string;
          phone: string;
          source: string;
          notes: string;
          stage_id: string;
          position: number;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['crm_clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['crm_clients']['Insert']>;
      };
      whatsapp_config: {
        Row: {
          id: string;
          owner_id: string;
          provider: 'cloud_api' | 'z_api' | 'evolution_api';
          api_url: string;
          api_key: string;
          instance_id: string;
          phone_number: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['whatsapp_config']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['whatsapp_config']['Insert']>;
      };
      whatsapp_messages: {
        Row: {
          id: string;
          owner_id: string | null;
          contact_name: string;
          contact_phone: string;
          message_text: string;
          direction: 'incoming' | 'outgoing';
          media_url: string;
          status: string;
          crm_client_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['whatsapp_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['whatsapp_messages']['Insert']>;
      };
      pecas: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          tipo: string;
          context: string;
          generated_text: string;
          process_number: string;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['pecas']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pecas']['Insert']>;
      };
      user_permissions: {
        Row: {
          id: string;
          user_id: string;
          module: string;
          can_view: boolean;
          can_edit: boolean;
        };
        Insert: Omit<Database['public']['Tables']['user_permissions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['user_permissions']['Insert']>;
      };
      agenda_events: {
        Row: {
          id: string;
          created_at: string;
          owner_id: string | null;
          titulo: string;
          tipo: string;
          data: string;
          hora_inicio: string;
          hora_fim: string;
          participantes: string | null;
          cliente_id: string | null;
          processo_id: string | null;
          cliente_nome: string | null;
          processo_numero: string | null;
          link: string | null;
          status: string;
        };
        Insert: Omit<Database['public']['Tables']['agenda_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['agenda_events']['Insert']>;
      };
      andamentos: {
        Row: {
          id: string;
          process_id: string;
          data: string;
          tipo: string;
          descricao: string;
          responsavel_id: string | null;
          owner_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['andamentos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['andamentos']['Insert']>;
      };
      audiencias: {
        Row: {
          id: string;
          process_id: string;
          data: string;
          tipo: string;
          local: string | null;
          link_meet: string | null;
          status: string;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audiencias']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['audiencias']['Insert']>;
      };
      process_notes: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          process_id: string;
          content: string;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['process_notes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['process_notes']['Insert']>;
      };
      process_documents: {
        Row: {
          id: string;
          created_at: string;
          process_id: string;
          title: string;
          url: string | null;
          file_path: string | null;
          description: string | null;
          owner_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['process_documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['process_documents']['Insert']>;
      };
      calculos: {
        Row: {
          id: string;
          created_at: string;
          owner_id: string | null;
          cliente_id: string | null;
          processo_id: string | null;
          tipo_calculo: string;
          versao_formula: number;
          parametros_json: Record<string, unknown>;
          resultado_json: Record<string, unknown> | null;
          hash_integridade: string | null;
          titulo: string | null;
        };
        Insert: Omit<Database['public']['Tables']['calculos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['calculos']['Insert']>;
      };
      indices_oficiais: {
        Row: {
          id: string;
          created_at: string;
          indice: string;
          referencia: string;
          valor: number;
        };
        Insert: Omit<Database['public']['Tables']['indices_oficiais']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['indices_oficiais']['Insert']>;
      };
      calculo_logs: {
        Row: {
          id: string;
          created_at: string;
          calculo_id: string;
          evento: string;
          detalhes: Record<string, unknown> | null;
        };
        Insert: Omit<Database['public']['Tables']['calculo_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['calculo_logs']['Insert']>;
      };
    };
  };
}
