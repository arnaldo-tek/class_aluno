import { supabase } from './supabase'
import {
  upsertOfflineCourse,
  upsertOfflineModule,
  upsertOfflineLesson,
  upsertOfflineAudio,
  upsertOfflineText,
  upsertOfflineQuestion,
  upsertOfflineFlashcard,
} from './offlineDb'

export async function snapshotCourse(courseId: string): Promise<void> {
  const { data: course, error } = await supabase
    .from('cursos')
    .select(`
      id, nome, imagem, descricao, preco, taxa_superclasse, average_rating,
      professor:professor_profiles!inner(id, user_id, nome_professor, foto_perfil),
      modulos(id, nome, sort_order,
        aulas(id, titulo, descricao, sort_order, is_liberado, is_degustacao,
              imagem_capa, pdf, video_url, texto_aula,
              audios_da_aula(id, titulo, audio_url),
              textos_da_aula(id, texto),
              questoes_da_aula(id, pergunta, resposta, alternativas, video, resposta_escrita, sort_order),
              flashcards(id, pergunta, resposta, professor_id, aluno_id))
      )
    `)
    .eq('id', courseId)
    .single()

  if (error || !course) {
    console.warn('[offlineSnapshot] Falha ao buscar curso para snapshot:', error?.message)
    return
  }

  const professor = course.professor as any

  await upsertOfflineCourse({
    id: course.id,
    nome: course.nome ?? '',
    imagem: course.imagem ?? null,
    descricao: course.descricao ?? null,
    preco: course.preco ?? null,
    taxa_superclasse: course.taxa_superclasse ?? null,
    average_rating: course.average_rating ?? null,
    professor_id: professor?.id ?? null,
    professor_user_id: professor?.user_id ?? null,
    professor_nome: professor?.nome_professor ?? null,
    professor_foto: professor?.foto_perfil ?? null,
  })

  const modulos = (course.modulos as any[]) ?? []

  for (const mod of modulos) {
    await upsertOfflineModule({
      id: mod.id,
      course_id: courseId,
      nome: mod.nome ?? '',
      sort_order: mod.sort_order ?? 0,
    })

    const aulas = (mod.aulas as any[]) ?? []
    for (const aula of aulas) {
      await upsertOfflineLesson({
        id: aula.id,
        module_id: mod.id,
        course_id: courseId,
        titulo: aula.titulo ?? '',
        descricao: aula.descricao ?? null,
        sort_order: aula.sort_order ?? 0,
        is_liberado: aula.is_liberado ? 1 : 0,
        is_degustacao: aula.is_degustacao ? 1 : 0,
        imagem_capa: aula.imagem_capa ?? null,
        pdf_url: aula.pdf ?? null,
        video_url: aula.video_url ?? null,
        texto_aula: aula.texto_aula ?? null,
      })

      const audios = (aula.audios_da_aula as any[]) ?? []
      for (const audio of audios) {
        await upsertOfflineAudio({
          id: audio.id,
          lesson_id: aula.id,
          titulo: audio.titulo ?? null,
          audio_url: audio.audio_url,
        })
      }

      const textos = (aula.textos_da_aula as any[]) ?? []
      for (const texto of textos) {
        await upsertOfflineText({ id: texto.id, lesson_id: aula.id, texto: texto.texto ?? '' })
      }

      const questoes = (aula.questoes_da_aula as any[]) ?? []
      for (const q of questoes) {
        await upsertOfflineQuestion({
          id: q.id,
          lesson_id: aula.id,
          pergunta: q.pergunta ?? '',
          resposta: q.resposta ?? '',
          alternativas: q.alternativas ? JSON.stringify(q.alternativas) : null,
          video: q.video ?? null,
          resposta_escrita: q.resposta_escrita ? 1 : 0,
          sort_order: q.sort_order ?? 0,
        })
      }

      const flashcards = (aula.flashcards as any[]) ?? []
      for (const fc of flashcards) {
        if (fc.aluno_id !== null) continue
        await upsertOfflineFlashcard({
          id: fc.id,
          lesson_id: aula.id,
          pergunta: fc.pergunta ?? '',
          resposta: fc.resposta ?? '',
          professor_id: fc.professor_id ?? null,
        })
      }
    }
  }
}
