export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_leis: {
        Row: {
          audio_url: string
          created_at: string | null
          id: string
          lei_id: string
          titulo: string | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          id?: string
          lei_id: string
          titulo?: string | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          id?: string
          lei_id?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_leis_lei_id_fkey"
            columns: ["lei_id"]
            isOneToOne: false
            referencedRelation: "leis"
            referencedColumns: ["id"]
          },
        ]
      }
      audios_da_aula: {
        Row: {
          audio_url: string
          aula_id: string
          created_at: string | null
          id: string
          titulo: string | null
        }
        Insert: {
          audio_url: string
          aula_id: string
          created_at?: string | null
          id?: string
          titulo?: string | null
        }
        Update: {
          audio_url?: string
          aula_id?: string
          created_at?: string | null
          id?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audios_da_aula_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          autor_id: string | null
          created_at: string | null
          curso_id: string | null
          descricao: string | null
          disciplina_id: string | null
          id: string
          imagem_capa: string | null
          imagem_perfil: string | null
          is_degustacao: boolean | null
          is_liberado: boolean | null
          modulo_id: string | null
          pdf: string | null
          sort_order: number | null
          texto_aula: string | null
          titulo: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          descricao?: string | null
          disciplina_id?: string | null
          id?: string
          imagem_capa?: string | null
          imagem_perfil?: string | null
          is_degustacao?: boolean | null
          is_liberado?: boolean | null
          modulo_id?: string | null
          pdf?: string | null
          sort_order?: number | null
          texto_aula?: string | null
          titulo: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          descricao?: string | null
          disciplina_id?: string | null
          id?: string
          imagem_capa?: string | null
          imagem_perfil?: string | null
          is_degustacao?: boolean | null
          is_liberado?: boolean | null
          modulo_id?: string | null
          pdf?: string | null
          sort_order?: number | null
          texto_aula?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          comentario: string | null
          created_at: string | null
          curso_id: string | null
          foto_aluno: string | null
          id: string
          pacote_id: string | null
          professor_id: string | null
          rating: number
          user_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          curso_id?: string | null
          foto_aluno?: string | null
          id?: string
          pacote_id?: string | null
          professor_id?: string | null
          rating: number
          user_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          curso_id?: string | null
          foto_aluno?: string | null
          id?: string
          pacote_id?: string | null
          professor_id?: string | null
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          id: string
          imagem: string
          is_active: boolean | null
          redirecionamento: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imagem: string
          is_active?: boolean | null
          redirecionamento?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imagem?: string
          is_active?: boolean | null
          redirecionamento?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      bloco_flashcards: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          pasta_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          pasta_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          pasta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloco_flashcards_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pasta_flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          id: string
          nome: string
          nome_categoria: string | null
          nome_disciplina: string | null
          nome_escolaridade: string | null
          nome_orgao: string | null
        }
        Insert: {
          id?: string
          nome: string
          nome_categoria?: string | null
          nome_disciplina?: string | null
          nome_escolaridade?: string | null
          nome_orgao?: string | null
        }
        Update: {
          id?: string
          nome?: string
          nome_categoria?: string | null
          nome_disciplina?: string | null
          nome_escolaridade?: string | null
          nome_orgao?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string | null
          filtro_cargo: string | null
          filtro_cidade: string | null
          filtro_disciplina: string | null
          filtro_escolaridade: string | null
          filtro_estado: string | null
          filtro_nivel: string | null
          filtro_orgao: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          filtro_cargo?: string | null
          filtro_cidade?: string | null
          filtro_disciplina?: string | null
          filtro_escolaridade?: string | null
          filtro_estado?: string | null
          filtro_nivel?: string | null
          filtro_orgao?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          filtro_cargo?: string | null
          filtro_cidade?: string | null
          filtro_disciplina?: string | null
          filtro_escolaridade?: string | null
          filtro_estado?: string | null
          filtro_nivel?: string | null
          filtro_orgao?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      chamados: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          id_chamado: string | null
          imagem: string | null
          is_suporte_aluno: boolean | null
          is_suporte_professor: boolean | null
          status: string | null
          user_id: string | null
          video: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_chamado?: string | null
          imagem?: string | null
          is_suporte_aluno?: boolean | null
          is_suporte_professor?: boolean | null
          status?: string | null
          user_id?: string | null
          video?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_chamado?: string | null
          imagem?: string | null
          is_suporte_aluno?: boolean | null
          is_suporte_professor?: boolean | null
          status?: string | null
          user_id?: string | null
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          image: string | null
          text: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          image?: string | null
          text?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          image?: string | null
          text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          image: string | null
          last_message: string | null
          last_message_sent_by: string | null
          last_message_time: string | null
          message_seen: boolean | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image?: string | null
          last_message?: string | null
          last_message_sent_by?: string | null
          last_message_time?: string | null
          message_seen?: boolean | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image?: string | null
          last_message?: string | null
          last_message_sent_by?: string | null
          last_message_time?: string | null
          message_seen?: boolean | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_last_message_sent_by_fkey"
            columns: ["last_message_sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          comentario: string
          created_at: string | null
          curso_id: string | null
          foto_usuario: string | null
          id: string
          imagens: string[] | null
          nome: string | null
          professor_id: string | null
          user_id: string | null
        }
        Insert: {
          comentario: string
          created_at?: string | null
          curso_id?: string | null
          foto_usuario?: string | null
          id?: string
          imagens?: string[] | null
          nome?: string | null
          professor_id?: string | null
          user_id?: string | null
        }
        Update: {
          comentario?: string
          created_at?: string | null
          curso_id?: string | null
          foto_usuario?: string | null
          id?: string
          imagens?: string[] | null
          nome?: string | null
          professor_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          uses_count: number | null
          valid_until: string | null
          valor: number
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
          valid_until?: string | null
          valor: number
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
          valid_until?: string | null
          valor?: number
        }
        Relationships: []
      }
      curso_disciplinas: {
        Row: {
          curso_id: string
          disciplina_id: string
        }
        Insert: {
          curso_id: string
          disciplina_id: string
        }
        Update: {
          curso_id?: string
          disciplina_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_disciplinas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_disciplinas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          average_rating: number | null
          cargo: string | null
          categoria_id: string | null
          cidade: string | null
          created_at: string | null
          descricao: string | null
          disciplina_id: string | null
          escolaridade: string | null
          estado: string | null
          id: string
          imagem: string | null
          is_degustacao: boolean | null
          is_encerrado: boolean | null
          is_mentoria: boolean | null
          is_pacote: boolean | null
          is_publicado: boolean | null
          nome: string
          orgao: string | null
          preco: number | null
          professor_id: string
          taxa_superclasse: number | null
          updated_at: string | null
          video_aula_apresentacao: string | null
        }
        Insert: {
          average_rating?: number | null
          cargo?: string | null
          categoria_id?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina_id?: string | null
          escolaridade?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          is_degustacao?: boolean | null
          is_encerrado?: boolean | null
          is_mentoria?: boolean | null
          is_pacote?: boolean | null
          is_publicado?: boolean | null
          nome: string
          orgao?: string | null
          preco?: number | null
          professor_id: string
          taxa_superclasse?: number | null
          updated_at?: string | null
          video_aula_apresentacao?: string | null
        }
        Update: {
          average_rating?: number | null
          cargo?: string | null
          categoria_id?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina_id?: string | null
          escolaridade?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          is_degustacao?: boolean | null
          is_encerrado?: boolean | null
          is_mentoria?: boolean | null
          is_pacote?: boolean | null
          is_publicado?: boolean | null
          nome?: string
          orgao?: string | null
          preco?: number | null
          professor_id?: string
          taxa_superclasse?: number | null
          updated_at?: string | null
          video_aula_apresentacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinas: {
        Row: {
          cidade: string | null
          esfera: string | null
          estado: string | null
          id: string
          nome: string
          nome_cargo: string | null
          nome_categoria: string | null
          orgao: string | null
        }
        Insert: {
          cidade?: string | null
          esfera?: string | null
          estado?: string | null
          id?: string
          nome: string
          nome_cargo?: string | null
          nome_categoria?: string | null
          orgao?: string | null
        }
        Update: {
          cidade?: string | null
          esfera?: string | null
          estado?: string | null
          id?: string
          nome?: string
          nome_cargo?: string | null
          nome_categoria?: string | null
          orgao?: string | null
        }
        Relationships: []
      }
      documento_professors: {
        Row: {
          documento_id: string
          professor_id: string
        }
        Insert: {
          documento_id: string
          professor_id: string
        }
        Update: {
          documento_id?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_professors_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_professors_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          pdf: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          pdf?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          pdf?: string | null
        }
        Relationships: []
      }
      editais: {
        Row: {
          cargo: string | null
          categoria_id: string | null
          cidade: string | null
          created_at: string | null
          descricao: string | null
          disciplina: string | null
          estado: string | null
          id: string
          imagem: string | null
          orgao: string | null
          pdf: string | null
          professor_id: string | null
          resumo: string | null
          titulo: string
        }
        Insert: {
          cargo?: string | null
          categoria_id?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          orgao?: string | null
          pdf?: string | null
          professor_id?: string | null
          resumo?: string | null
          titulo: string
        }
        Update: {
          cargo?: string | null
          categoria_id?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          orgao?: string | null
          pdf?: string | null
          professor_id?: string | null
          resumo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "editais_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editais_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          curso_id: string
          enrolled_at: string | null
          id: string
          is_suspended: boolean | null
          user_id: string
        }
        Insert: {
          curso_id: string
          enrolled_at?: string | null
          id?: string
          is_suspended?: boolean | null
          user_id: string
        }
        Update: {
          curso_id?: string
          enrolled_at?: string | null
          id?: string
          is_suspended?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escolaridades: {
        Row: {
          id: string
          nome: string
        }
        Insert: {
          id?: string
          nome: string
        }
        Update: {
          id?: string
          nome?: string
        }
        Relationships: []
      }
      esferas: {
        Row: {
          id: string
          nome: string
        }
        Insert: {
          id?: string
          nome: string
        }
        Update: {
          id?: string
          nome?: string
        }
        Relationships: []
      }
      estados: {
        Row: {
          id: string
          imagem: string | null
          nome: string
        }
        Insert: {
          id?: string
          imagem?: string | null
          nome: string
        }
        Update: {
          id?: string
          imagem?: string | null
          nome?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          created_at: string | null
          id: string
          pergunta: string | null
          resposta: string | null
          sort_order: number | null
          titulo: string | null
          video: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pergunta?: string | null
          resposta?: string | null
          sort_order?: number | null
          titulo?: string | null
          video?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pergunta?: string | null
          resposta?: string | null
          sort_order?: number | null
          titulo?: string | null
          video?: string | null
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          created_at: string | null
          id: string
          referencia_id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referencia_id: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referencia_id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          aluno_id: string | null
          aula_id: string | null
          bloco_id: string | null
          created_at: string | null
          curso_id: string | null
          id: string
          pasta_id: string | null
          pergunta: string
          professor_id: string | null
          resposta: string
        }
        Insert: {
          aluno_id?: string | null
          aula_id?: string | null
          bloco_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          id?: string
          pasta_id?: string | null
          pergunta: string
          professor_id?: string | null
          resposta: string
        }
        Update: {
          aluno_id?: string | null
          aula_id?: string | null
          bloco_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          id?: string
          pasta_id?: string | null
          pergunta?: string
          professor_id?: string | null
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "bloco_flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pasta_flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lei_user_access: {
        Row: {
          lei_id: string
          user_id: string
        }
        Insert: {
          lei_id: string
          user_id: string
        }
        Update: {
          lei_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lei_user_access_lei_id_fkey"
            columns: ["lei_id"]
            isOneToOne: false
            referencedRelation: "leis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lei_user_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leis: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          nome: string
          subpasta_id: string | null
          texto: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome: string
          subpasta_id?: string | null
          texto?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome?: string
          subpasta_id?: string | null
          texto?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leis_subpasta_id_fkey"
            columns: ["subpasta_id"]
            isOneToOne: false
            referencedRelation: "subpastas_leis"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          audio_position_seconds: number | null
          aula_id: string
          completed_at: string | null
          created_at: string | null
          curso_id: string
          id: string
          is_completed: boolean | null
          last_quiz_at: string | null
          quiz_best_score: number | null
          quiz_score: number | null
          quiz_total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_position_seconds?: number | null
          aula_id: string
          completed_at?: string | null
          created_at?: string | null
          curso_id: string
          id?: string
          is_completed?: boolean | null
          last_quiz_at?: string | null
          quiz_best_score?: number | null
          quiz_score?: number | null
          quiz_total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_position_seconds?: number | null
          aula_id?: string
          completed_at?: string | null
          created_at?: string | null
          curso_id?: string
          id?: string
          is_completed?: boolean | null
          last_quiz_at?: string | null
          quiz_best_score?: number | null
          quiz_score?: number | null
          quiz_total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentoria_alunos: {
        Row: {
          enrolled_at: string | null
          mentoria_id: string
          user_id: string
        }
        Insert: {
          enrolled_at?: string | null
          mentoria_id: string
          user_id: string
        }
        Update: {
          enrolled_at?: string | null
          mentoria_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentoria_alunos_mentoria_id_fkey"
            columns: ["mentoria_id"]
            isOneToOne: false
            referencedRelation: "mentorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentoria_alunos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorias: {
        Row: {
          contem: string[] | null
          created_at: string | null
          descricao: string | null
          id: string
          preco: number | null
          professor_id: string
          titulo: string | null
        }
        Insert: {
          contem?: string[] | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          preco?: number | null
          professor_id: string
          titulo?: string | null
        }
        Update: {
          contem?: string[] | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          preco?: number | null
          professor_id?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorias_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          created_at: string | null
          curso_id: string
          id: string
          nome: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          curso_id: string
          id?: string
          nome: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          curso_id?: string
          id?: string
          nome?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes: {
        Row: {
          contato_cliente: string | null
          created_at: string | null
          curso_id: string | null
          data_string: string | null
          email_cliente: string | null
          id: string
          nome_cliente: string | null
          nome_curso: string | null
          pacote_id: string | null
          pagarme_order_id: string | null
          professor_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          taxa_plataforma: number | null
          user_id: string | null
          valor: number
          valor_curso: number | null
        }
        Insert: {
          contato_cliente?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_string?: string | null
          email_cliente?: string | null
          id?: string
          nome_cliente?: string | null
          nome_curso?: string | null
          pacote_id?: string | null
          pagarme_order_id?: string | null
          professor_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          taxa_plataforma?: number | null
          user_id?: string | null
          valor: number
          valor_curso?: number | null
        }
        Update: {
          contato_cliente?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_string?: string | null
          email_cliente?: string | null
          id?: string
          nome_cliente?: string | null
          nome_curso?: string | null
          pacote_id?: string | null
          pagarme_order_id?: string | null
          professor_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          taxa_plataforma?: number | null
          user_id?: string | null
          valor?: number
          valor_curso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          estado_id: string | null
          id: string
          nome: string
        }
        Insert: {
          estado_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          estado_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipios_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      niveis: {
        Row: {
          id: string
          nome: string
        }
        Insert: {
          id?: string
          nome: string
        }
        Update: {
          id?: string
          nome?: string
        }
        Relationships: []
      }
      noticias: {
        Row: {
          cargo: string | null
          categoria_id: string | null
          cidade: string | null
          created_at: string | null
          descricao: string | null
          disciplina: string | null
          estado: string | null
          id: string
          imagem: string | null
          orgao: string | null
          pdf: string | null
          titulo: string
        }
        Insert: {
          cargo?: string | null
          categoria_id?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          orgao?: string | null
          pdf?: string | null
          titulo: string
        }
        Update: {
          cargo?: string | null
          categoria_id?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          disciplina?: string | null
          estado?: string | null
          id?: string
          imagem?: string | null
          orgao?: string | null
          pdf?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "noticias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          is_read: boolean | null
          titulo: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_read?: boolean | null
          titulo?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_read?: boolean | null
          titulo?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          created_at: string | null
          descricao: string | null
          disciplina: string | null
          id: string
          titulo: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          titulo?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          disciplina?: string | null
          id?: string
          titulo?: string | null
        }
        Relationships: []
      }
      orgaos: {
        Row: {
          id: string
          nome: string
          nome_categoria: string | null
          nome_cidade: string | null
          nome_escolaridade: string | null
          nome_estado: string | null
        }
        Insert: {
          id?: string
          nome: string
          nome_categoria?: string | null
          nome_cidade?: string | null
          nome_escolaridade?: string | null
          nome_estado?: string | null
        }
        Update: {
          id?: string
          nome?: string
          nome_categoria?: string | null
          nome_cidade?: string | null
          nome_escolaridade?: string | null
          nome_estado?: string | null
        }
        Relationships: []
      }
      package_access: {
        Row: {
          access_expire_date: string | null
          created_at: string | null
          id: string
          pacote_id: string
          user_id: string
        }
        Insert: {
          access_expire_date?: string | null
          created_at?: string | null
          id?: string
          pacote_id: string
          user_id: string
        }
        Update: {
          access_expire_date?: string | null
          created_at?: string | null
          id?: string
          pacote_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_access_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_categorias: {
        Row: {
          categoria_id: string
          pacote_id: string
        }
        Insert: {
          categoria_id: string
          pacote_id: string
        }
        Update: {
          categoria_id?: string
          pacote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacote_categorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_categorias_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_cursos: {
        Row: {
          curso_id: string
          pacote_id: string
        }
        Insert: {
          curso_id: string
          pacote_id: string
        }
        Update: {
          curso_id?: string
          pacote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacote_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_cursos_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_professors: {
        Row: {
          pacote_id: string
          professor_id: string
        }
        Insert: {
          pacote_id: string
          professor_id: string
        }
        Update: {
          pacote_id?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacote_professors_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_professors_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pacotes: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          imagem: string | null
          nome: string
          preco: number | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome: string
          preco?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome?: string
          preco?: number | null
        }
        Relationships: []
      }
      pacotes_leis: {
        Row: {
          created_at: string | null
          id: string
          nome: string | null
          tipo_pacote_lei: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome?: string | null
          tipo_pacote_lei?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string | null
          tipo_pacote_lei?: number | null
        }
        Relationships: []
      }
      pasta_flashcards: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasta_flashcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdfs: {
        Row: {
          created_at: string | null
          id: string
          nome: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdfs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_professores: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          imagem: string | null
          professor_id: string
          titulo: string | null
          video: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem?: string | null
          professor_id: string
          titulo?: string | null
          video?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem?: string | null
          professor_id?: string
          titulo?: string | null
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_professores_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_profiles: {
        Row: {
          agencia: string | null
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          average_rating: number | null
          bairro: string | null
          banco: string | null
          biografia: string | null
          chave_pix: string | null
          cidade: string | null
          conta: string | null
          contem_mentoria: string[] | null
          cpf_cnpj: string | null
          created_at: string | null
          curriculo_url: string | null
          data_nascimento: string | null
          descricao: string | null
          descricao_contratar_mentorias: string | null
          descricao_mentorias: string | null
          digito_agencia: string | null
          digito_conta: string | null
          disciplina: string | null
          email: string | null
          estado: string | null
          facebook: string | null
          foto_capa: string | null
          foto_perfil: string | null
          id: string
          imagens_capa: string[] | null
          instagram: string | null
          nome_professor: string
          numero_casa_ap: string | null
          pagarme_receiver_id: string | null
          rua: string | null
          telefone: string | null
          tiktok: string | null
          tres_motivos_contratar: string[] | null
          updated_at: string | null
          user_id: string
          youtube: string | null
        }
        Insert: {
          agencia?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          bairro?: string | null
          banco?: string | null
          biografia?: string | null
          chave_pix?: string | null
          cidade?: string | null
          conta?: string | null
          contem_mentoria?: string[] | null
          cpf_cnpj?: string | null
          created_at?: string | null
          curriculo_url?: string | null
          data_nascimento?: string | null
          descricao?: string | null
          descricao_contratar_mentorias?: string | null
          descricao_mentorias?: string | null
          digito_agencia?: string | null
          digito_conta?: string | null
          disciplina?: string | null
          email?: string | null
          estado?: string | null
          facebook?: string | null
          foto_capa?: string | null
          foto_perfil?: string | null
          id?: string
          imagens_capa?: string[] | null
          instagram?: string | null
          nome_professor: string
          numero_casa_ap?: string | null
          pagarme_receiver_id?: string | null
          rua?: string | null
          telefone?: string | null
          tiktok?: string | null
          tres_motivos_contratar?: string[] | null
          updated_at?: string | null
          user_id: string
          youtube?: string | null
        }
        Update: {
          agencia?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          bairro?: string | null
          banco?: string | null
          biografia?: string | null
          chave_pix?: string | null
          cidade?: string | null
          conta?: string | null
          contem_mentoria?: string[] | null
          cpf_cnpj?: string | null
          created_at?: string | null
          curriculo_url?: string | null
          data_nascimento?: string | null
          descricao?: string | null
          descricao_contratar_mentorias?: string | null
          descricao_mentorias?: string | null
          digito_agencia?: string | null
          digito_conta?: string | null
          disciplina?: string | null
          email?: string | null
          estado?: string | null
          facebook?: string | null
          foto_capa?: string | null
          foto_perfil?: string | null
          id?: string
          imagens_capa?: string[] | null
          instagram?: string | null
          nome_professor?: string
          numero_casa_ap?: string | null
          pagarme_receiver_id?: string | null
          rua?: string | null
          telefone?: string | null
          tiktok?: string | null
          tres_motivos_contratar?: string[] | null
          updated_at?: string | null
          user_id?: string
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agencia: string | null
          banco: string | null
          cep: string | null
          chave_pix: string | null
          cidade: string | null
          complemento: string | null
          conta: string | null
          cpf: string | null
          created_at: string | null
          digito_opcional: string | null
          display_name: string | null
          email: string
          endereco: string | null
          estado: string | null
          id: string
          is_suspended: boolean | null
          nome_empresarial: string | null
          numero: string | null
          pagarme_address_id: string | null
          pagarme_card_id: string | null
          pagarme_customer_id: string | null
          pagarme_subscription_id: string | null
          phone_number: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          cep?: string | null
          chave_pix?: string | null
          cidade?: string | null
          complemento?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string | null
          digito_opcional?: string | null
          display_name?: string | null
          email: string
          endereco?: string | null
          estado?: string | null
          id: string
          is_suspended?: boolean | null
          nome_empresarial?: string | null
          numero?: string | null
          pagarme_address_id?: string | null
          pagarme_card_id?: string | null
          pagarme_customer_id?: string | null
          pagarme_subscription_id?: string | null
          phone_number?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          cep?: string | null
          chave_pix?: string | null
          cidade?: string | null
          complemento?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string | null
          digito_opcional?: string | null
          display_name?: string | null
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          is_suspended?: boolean | null
          nome_empresarial?: string | null
          numero?: string | null
          pagarme_address_id?: string | null
          pagarme_card_id?: string | null
          pagarme_customer_id?: string | null
          pagarme_subscription_id?: string | null
          phone_number?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publicidade_abertura: {
        Row: {
          created_at: string | null
          id: string
          imagem: string | null
          is_active: boolean | null
          link: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imagem?: string | null
          is_active?: boolean | null
          link?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imagem?: string | null
          is_active?: boolean | null
          link?: string | null
        }
        Relationships: []
      }
      publicidade_area_aluno: {
        Row: {
          created_at: string | null
          id: string
          imagem: string | null
          is_active: boolean | null
          link: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imagem?: string | null
          is_active?: boolean | null
          link?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imagem?: string | null
          is_active?: boolean | null
          link?: string | null
        }
        Relationships: []
      }
      publicidade_audio_curso: {
        Row: {
          created_at: string | null
          id: string
          imagem: string | null
          is_active: boolean | null
          link: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imagem?: string | null
          is_active?: boolean | null
          link?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imagem?: string | null
          is_active?: boolean | null
          link?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes_da_aula: {
        Row: {
          alternativas: string[]
          aula_id: string
          id: string
          pergunta: string
          resposta: string
          sort_order: number | null
          video: string | null
        }
        Insert: {
          alternativas: string[]
          aula_id: string
          id?: string
          pergunta: string
          resposta: string
          sort_order?: number | null
          video?: string | null
        }
        Update: {
          alternativas?: string[]
          aula_id?: string
          id?: string
          pergunta?: string
          resposta?: string
          sort_order?: number | null
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questoes_da_aula_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes_leis: {
        Row: {
          alternativas: string[] | null
          id: string
          lei_id: string
          pergunta: string
          resposta: string
          video: string | null
        }
        Insert: {
          alternativas?: string[] | null
          id?: string
          lei_id: string
          pergunta: string
          resposta: string
          video?: string | null
        }
        Update: {
          alternativas?: string[] | null
          id?: string
          lei_id?: string
          pergunta?: string
          resposta?: string
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questoes_leis_lei_id_fkey"
            columns: ["lei_id"]
            isOneToOne: false
            referencedRelation: "leis"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          aula_id: string
          completed_at: string | null
          id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          aula_id: string
          completed_at?: string | null
          id?: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          aula_id?: string
          completed_at?: string | null
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategorias: {
        Row: {
          categoria_id: string | null
          disciplina: string | null
          id: string
          nome: string
        }
        Insert: {
          categoria_id?: string | null
          disciplina?: string | null
          id?: string
          nome: string
        }
        Update: {
          categoria_id?: string | null
          disciplina?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      subpastas_leis: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subpastas_leis_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "subpastas_leis"
            referencedColumns: ["id"]
          },
        ]
      }
      suporte: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          descricao: string | null
          id: string
          professor_id: string | null
          titulo: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          professor_id?: string | null
          titulo?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          professor_id?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suporte_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suporte_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      textos_da_aula: {
        Row: {
          aula_id: string
          created_at: string | null
          id: string
          texto: string
        }
        Insert: {
          aula_id: string
          created_at?: string | null
          id?: string
          texto: string
        }
        Update: {
          aula_id?: string
          created_at?: string | null
          id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "textos_da_aula_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      tutoriais: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          titulo: string | null
          video: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          titulo?: string | null
          video?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          titulo?: string | null
          video?: string | null
        }
        Relationships: []
      }
      user_following_professors: {
        Row: {
          created_at: string | null
          professor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          professor_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          professor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_following_professors_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_following_professors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_course_progress: {
        Row: {
          completed_lessons: number | null
          completion_percentage: number | null
          curso_id: string | null
          total_lessons: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_my_professor_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["user_role"][]
      }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_professor_owner: { Args: { prof_id: string }; Returns: boolean }
    }
    Enums: {
      approval_status: "em_analise" | "aprovado" | "reprovado"
      order_status: "pending" | "paid" | "failed" | "refunded" | "cancelled"
      user_role: "admin" | "professor" | "colaborador" | "aluno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_status: ["em_analise", "aprovado", "reprovado"],
      order_status: ["pending", "paid", "failed", "refunded", "cancelled"],
      user_role: ["admin", "professor", "colaborador", "aluno"],
    },
  },
} as const

