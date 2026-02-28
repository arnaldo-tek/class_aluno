import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useSaveQuizAttempt() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      aulaId,
      cursoId,
      score,
      totalQuestions,
      answers,
    }: {
      aulaId: string
      cursoId: string
      score: number
      totalQuestions: number
      answers: Record<string, string>
    }) => {
      if (!user) throw new Error('Not authenticated')

      // Save quiz attempt
      const { error: attemptError } = await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        aula_id: aulaId,
        score,
        total_questions: totalQuestions,
        answers,
      })
      if (attemptError) throw attemptError

      // Update lesson_progress with best score
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('quiz_best_score')
        .eq('user_id', user.id)
        .eq('aula_id', aulaId)
        .maybeSingle()

      const bestScore = Math.max(score, existing?.quiz_best_score ?? 0)

      const { error: progressError } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.id,
            aula_id: aulaId,
            curso_id: cursoId,
            quiz_score: score,
            quiz_total: totalQuestions,
            quiz_best_score: bestScore,
            last_quiz_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,aula_id' }
        )
      if (progressError) throw progressError
    },
    onSuccess: (_, { aulaId, cursoId }) => {
      qc.invalidateQueries({ queryKey: ['lesson-progress', user?.id, aulaId] })
      qc.invalidateQueries({ queryKey: ['course-progress', user?.id, cursoId] })
    },
  })
}
