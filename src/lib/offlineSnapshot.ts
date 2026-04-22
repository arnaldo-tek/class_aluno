import { supabase } from './supabase'
import {
  upsertOfflineCourse,
  upsertOfflineModule,
  upsertOfflineLesson,
} from './offlineDb'

export async function snapshotCourse(courseId: string): Promise<void> {
  const { data: course, error } = await supabase
    .from('cursos')
    .select(`
      id, nome, imagem, descricao, preco, taxa_superclasse, average_rating,
      professor:professor_profiles!inner(id, user_id, nome_professor, foto_perfil),
      modulos(id, nome, sort_order,
        aulas(id, titulo, descricao, sort_order, is_liberado, is_degustacao,
              imagem_capa, pdf, video_url, texto_aula)
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
    }
  }
}
