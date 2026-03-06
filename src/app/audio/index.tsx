import { useState, useRef, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { useAudioPackages, useAudioBanners, useAudioFolders, useAudioLaws, useAudioLawDetail, useAudioLawQuestions, useIsAudioFavorite, useToggleAudioFavorite } from '@/hooks/useAudio'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AudioPlayerList } from '@/components/AudioPlayer'
import type { AudioItem } from '@/components/AudioPlayer'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

const SCREEN_WIDTH = Dimensions.get('window').width

type TabType = 1 | 2 | 3 | 4
type DrillLevel = 'packages' | 'folders' | 'laws' | 'player'

const TAB_CONFIG: Array<{ tipo: TabType; key: string; icon: string; color: string }> = [
  { tipo: 1, key: 'audio.packages', icon: 'library-outline', color: '#60a5fa' },
  { tipo: 2, key: 'audio.federalLaws', icon: 'globe-outline', color: '#34d399' },
  { tipo: 3, key: 'audio.stateLaws', icon: 'flag-outline', color: '#fbbf24' },
  { tipo: 4, key: 'audio.municipalLaws', icon: 'business-outline', color: '#c084fc' },
]

export default function AudioScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const [activeTab, setActiveTab] = useState<TabType>(1)
  const [level, setLevel] = useState<DrillLevel>('packages')
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedLawId, setSelectedLawId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Array<{ label: string; level: DrillLevel; id?: string }>>([])
  const [playerTab, setPlayerTab] = useState<'audio' | 'text' | 'questions'>('audio')

  const { data: packages, isLoading: loadingPkg } = useAudioPackages(activeTab)
  const { data: banners } = useAudioBanners()
  const { data: folders, isLoading: loadingFolders } = useAudioFolders(selectedPackageId ?? '')
  const { data: laws, isLoading: loadingLaws } = useAudioLaws(selectedFolderId ?? '')
  const { data: lawDetail, isLoading: loadingDetail } = useAudioLawDetail(selectedLawId ?? '')
  const { data: lawQuestions } = useAudioLawQuestions(selectedLawId ?? '')

  const bannerRef = useRef<FlatList>(null)
  const [bannerIndex, setBannerIndex] = useState(0)
  const BANNER_WIDTH = SCREEN_WIDTH - 32

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return
    const interval = setInterval(() => {
      const next = (bannerIndex + 1) % banners.length
      bannerRef.current?.scrollToOffset({ offset: next * BANNER_WIDTH, animated: true })
      setBannerIndex(next)
    }, 4000)
    return () => clearInterval(interval)
  }, [bannerIndex, banners?.length])

  function resetToPackages() {
    setLevel('packages')
    setSelectedPackageId(null)
    setSelectedFolderId(null)
    setSelectedLawId(null)
    setBreadcrumb([])
  }

  function selectPackage(pkg: any) {
    setSelectedPackageId(pkg.id)
    setLevel('folders')
    setBreadcrumb([{ label: pkg.nome, level: 'packages' }])
  }

  function selectFolder(folder: any) {
    setSelectedFolderId(folder.id)
    setLevel('laws')
    setBreadcrumb(prev => [...prev.slice(0, 1), { label: folder.nome, level: 'folders', id: selectedPackageId! }])
  }

  function selectLaw(law: any) {
    setSelectedLawId(law.id)
    setLevel('player')
    setPlayerTab('audio')
    setBreadcrumb(prev => [...prev.slice(0, 2), { label: law.nome, level: 'laws', id: selectedFolderId! }])
  }

  function goBack() {
    if (level === 'player') {
      setSelectedLawId(null)
      setLevel('laws')
      setBreadcrumb(prev => prev.slice(0, 2))
    } else if (level === 'laws') {
      setSelectedFolderId(null)
      setLevel('folders')
      setBreadcrumb(prev => prev.slice(0, 1))
    } else if (level === 'folders') {
      setSelectedPackageId(null)
      setLevel('packages')
      setBreadcrumb([])
    } else {
      router.back()
    }
  }

  function handleTabChange(tipo: TabType) {
    setActiveTab(tipo)
    resetToPackages()
  }

  const activeColor = TAB_CONFIG.find(t => t.tipo === activeTab)?.color ?? '#60a5fa'

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={goBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('audio.title')}</Text>
      </View>

      {/* Banner */}
      {banners && banners.length > 0 && (
        <View className="mb-3 px-4 pt-3">
          <FlatList
            ref={bannerRef}
            data={banners}
            horizontal
            snapToInterval={BANNER_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH))
            }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: BANNER_WIDTH }} className="h-32 rounded-2xl overflow-hidden">
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full bg-primary-50 items-center justify-center">
                    <Ionicons name="musical-notes-outline" size={32} color="#60a5fa" />
                  </View>
                )}
              </View>
            )}
          />
          {banners.length > 1 && (
            <View className="flex-row justify-center mt-2">
              {banners.map((_, i) => (
                <View key={i} className={`h-1.5 rounded-full mx-1 ${i === bannerIndex ? 'w-5 bg-accent' : 'w-1.5 bg-darkBorder'}`} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <View className="py-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {TAB_CONFIG.map((item, idx) => (
          <TouchableOpacity
            key={String(item.tipo)}
            onPress={() => handleTabChange(item.tipo)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              marginRight: idx < TAB_CONFIG.length - 1 ? 6 : 0,
              borderColor: activeTab === item.tipo ? item.color : '#e5e4e1',
              backgroundColor: activeTab === item.tipo ? '#eff6ff' : '#f0efec',
            }}
          >
            <Ionicons name={item.icon as any} size={13} color={activeTab === item.tipo ? item.color : colors.textSecondary} />
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              marginLeft: 4,
              color: activeTab === item.tipo ? '#1a1a2e' : '#9ca3af',
            }}>
              {t(item.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <View className="flex-row flex-wrap items-center px-4 pb-2">
          <TouchableOpacity onPress={resetToPackages}>
            <Text className="text-xs text-primary-light">Inicio</Text>
          </TouchableOpacity>
          {breadcrumb.map((b, i) => (
            <View key={i} className="flex-row items-center">
              <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} style={{ marginHorizontal: 4 }} />
              <Text className={`text-xs ${i === breadcrumb.length - 1 ? 'text-darkText font-medium' : 'text-darkText-muted'}`}>
                {b.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Content area - changes based on level */}
      {level === 'packages' && (
        loadingPkg ? <LoadingSpinner /> : !packages?.length ? (
          <EmptyState title={t('audio.noAudio')} icon={<Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />} />
        ) : (
          <FlatList
            data={packages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectPackage(item)}
                className="flex-row bg-dark-surface rounded-2xl mb-2.5 px-4 py-3 border border-darkBorder-subtle items-center"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${activeColor}15` }}>
                  <Ionicons name="folder" size={20} color={activeColor} />
                </View>
                <Text className="flex-1 text-sm font-medium text-darkText ml-3">{item.nome}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        )
      )}

      {level === 'folders' && (
        loadingFolders ? <LoadingSpinner /> : !folders?.length ? (
          <EmptyState title="Nenhuma subpasta" icon={<Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />} />
        ) : (
          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectFolder(item)}
                className="flex-row bg-dark-surface rounded-2xl mb-2.5 px-4 py-3 border border-darkBorder-subtle items-center"
                activeOpacity={0.7}
              >
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} className="w-10 h-10 rounded-xl" />
                ) : (
                  <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${activeColor}15` }}>
                    <Ionicons name="folder-open" size={20} color={activeColor} />
                  </View>
                )}
                <Text className="flex-1 text-sm font-medium text-darkText ml-3">{item.nome}</Text>
                {activeTab === 1 && <FavoriteHeart id={item.id} tipo="pacote_lei" />}
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        )
      )}

      {level === 'laws' && (
        loadingLaws ? <LoadingSpinner /> : !laws?.length ? (
          <EmptyState title="Nenhuma lei" icon={<Ionicons name="document-text-outline" size={48} color={colors.textMuted} />} />
        ) : (
          <FlatList
            data={laws}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectLaw(item)}
                className="flex-row bg-dark-surface rounded-2xl mb-2.5 px-4 py-3 border border-darkBorder-subtle items-center"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center bg-dark-surfaceLight">
                  <Ionicons name="play" size={16} color={activeColor} />
                </View>
                <Text className="flex-1 text-sm font-medium text-darkText ml-3" numberOfLines={2}>{item.nome}</Text>
                {activeTab !== 1 && <FavoriteHeart id={item.id} tipo="lei" />}
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        )
      )}

      {level === 'player' && (
        loadingDetail ? <LoadingSpinner /> : !lawDetail?.lei ? null : (
          <>
            {/* Player tabs: Áudio, Texto, Questões */}
            <View className="flex-row border-b border-darkBorder-subtle px-4">
              {([
                { key: 'audio' as const, label: 'Áudio', icon: 'musical-notes' },
                { key: 'text' as const, label: 'Texto', icon: 'document-text' },
                { key: 'questions' as const, label: 'Questões', icon: 'help-circle' },
              ]).map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setPlayerTab(tab.key)}
                  className={`flex-row items-center pb-3 pt-3 mr-6 ${playerTab === tab.key ? 'border-b-2 border-primary' : ''}`}
                >
                  <Ionicons name={tab.icon as any} size={16} color={playerTab === tab.key ? '#3b82f6' : colors.textSecondary} />
                  <Text className={`text-sm font-semibold ml-1.5 ${playerTab === tab.key ? 'text-primary' : 'text-darkText-muted'}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Áudio tab */}
              {playerTab === 'audio' && (
                <View className="px-4 pt-4">
                  {lawDetail.audios.length > 0 ? (
                    <>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#f0f0f0', marginBottom: 8 }}>
                        Áudios ({lawDetail.audios.length})
                      </Text>
                      <AudioPlayerList
                        audios={(lawDetail.audios as AudioItem[])}
                        accentColor={activeColor}
                      />
                    </>
                  ) : (
                    <View className="items-center py-12">
                      <Ionicons name="musical-notes-outline" size={40} color={colors.textMuted} />
                      <Text className="text-sm text-darkText-muted mt-2">Nenhum áudio disponível</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Texto tab */}
              {playerTab === 'text' && (
                <View className="px-4 pt-4">
                  {lawDetail.lei.texto ? (
                    <>
                      <Text className="text-sm font-semibold text-darkText mb-3">{lawDetail.lei.nome}</Text>
                      <Text className="text-sm text-darkText-secondary leading-6" style={{ textAlign: 'justify' }}>{lawDetail.lei.texto}</Text>
                    </>
                  ) : (
                    <View className="items-center py-12">
                      <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
                      <Text className="text-sm text-darkText-muted mt-2">Nenhum texto disponível</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Questões tab */}
              {playerTab === 'questions' && (
                <InlineQuizSection questions={lawQuestions ?? []} />
              )}
            </ScrollView>
          </>
        )
      )}
    </SafeAreaView>
  )
}

function FavoriteHeart({ id, tipo }: { id: string; tipo: string }) {
  const { data: isFav } = useIsAudioFavorite(tipo, id)
  const toggle = useToggleAudioFavorite()

  return (
    <TouchableOpacity
      onPress={(e) => {
        e.stopPropagation?.()
        toggle.mutate({ referenciaId: id, tipo, isFavorite: !!isFav })
      }}
      className="p-2 ml-1"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={isFav ? 'heart' : 'heart-outline'}
        size={20}
        color={isFav ? '#f87171' : '#9ca3af'}
      />
    </TouchableOpacity>
  )
}

function InlineQuizSection({ questions }: { questions: Array<{ id: string; pergunta: string; resposta: string; alternativas: string[]; video?: string | null }> }) {
  const colors = useThemeColors()
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  if (!questions.length) {
    return (
      <View className="items-center py-12 px-4">
        <Ionicons name="help-circle-outline" size={40} color={colors.textMuted} />
        <Text className="text-sm text-darkText-muted mt-2">Nenhuma questão disponível</Text>
      </View>
    )
  }

  const question = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  function handleSelectAnswer(answer: string) {
    if (showResult) return
    setSelectedAnswer(answer)
    setShowResult(true)
    setScore((prev) => ({
      correct: prev.correct + (answer === question.resposta ? 1 : 0),
      total: prev.total + 1,
    }))
  }

  function handleNext() {
    setCurrentIndex((i) => i + 1)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  function handlePrevious() {
    if (currentIndex === 0) return
    setCurrentIndex((i) => i - 1)
    setSelectedAnswer(null)
    setShowResult(true)
  }

  function handleRestart() {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore({ correct: 0, total: 0 })
    setFinished(false)
    setStarted(true)
  }

  if (!started) {
    return (
      <View className="px-4 pt-6">
        <TouchableOpacity
          onPress={() => setStarted(true)}
          className="flex-row items-center justify-center bg-primary rounded-2xl py-3.5"
        >
          <Ionicons name="help-circle-outline" size={20} color="#fff" />
          <Text className="text-white font-semibold text-sm ml-2">
            Responder questões ({questions.length})
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (finished) {
    return (
      <View className="px-4 pt-6 items-center">
        <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-3">
          <Ionicons name="trophy" size={32} color="#3b82f6" />
        </View>
        <Text className="text-xl font-bold text-darkText mb-1">Resultado</Text>
        <Text className="text-3xl font-bold text-primary mb-1">
          {score.correct}/{score.total}
        </Text>
        <Text className="text-sm text-darkText-secondary mb-4">
          {Math.round((score.correct / score.total) * 100)}% de acertos
        </Text>
        <TouchableOpacity onPress={handleRestart} className="w-full bg-primary rounded-2xl py-3.5 items-center">
          <Text className="text-white font-bold">Refazer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="px-4 pt-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-darkText">
          Questão {currentIndex + 1}/{questions.length}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={16} color="#34d399" />
          <Text className="text-sm font-semibold text-success ml-1">{score.correct}</Text>
        </View>
      </View>

      <View className="h-1 bg-dark-surfaceLight rounded-full mb-4">
        <View className="h-1 bg-primary rounded-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </View>

      <Text className="text-base font-semibold text-darkText mb-4 leading-7">{question.pergunta}</Text>

      {(question.alternativas ?? []).map((alt: string, i: number) => {
        const letter = String.fromCharCode(65 + i)
        const isSelected = selectedAnswer === alt
        const isCorrectAnswer = alt === question.resposta

        let bgClass = 'bg-dark-surface border-darkBorder'
        let textClass = 'text-darkText'
        let letterBg = 'bg-dark-surfaceLight'
        let letterText = 'text-darkText-secondary'

        if (showResult) {
          if (isCorrectAnswer) {
            bgClass = 'bg-success-dark border-success/40'; letterBg = 'bg-success'; textClass = 'text-success'; letterText = 'text-darkText-inverse'
          } else if (isSelected) {
            bgClass = 'bg-error-dark border-error/40'; letterBg = 'bg-error'; textClass = 'text-error'; letterText = 'text-darkText-inverse'
          }
        } else if (isSelected) {
          bgClass = 'bg-primary-50 border-primary/40'; letterBg = 'bg-primary'; letterText = 'text-white'
        }

        return (
          <TouchableOpacity
            key={i}
            onPress={() => handleSelectAnswer(alt)}
            disabled={showResult}
            className={`flex-row items-center px-4 py-4 mb-3 rounded-2xl border ${bgClass}`}
          >
            <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${letterBg}`}>
              <Text className={`text-sm font-bold ${letterText}`}>{letter}</Text>
            </View>
            <Text className={`flex-1 text-sm font-medium ${textClass}`}>{alt}</Text>
            {showResult && isCorrectAnswer && <Ionicons name="checkmark-circle" size={20} color="#34d399" />}
            {showResult && isSelected && !isCorrectAnswer && <Ionicons name="close-circle" size={20} color="#f87171" />}
          </TouchableOpacity>
        )
      })}

      {showResult && question.video && (
        <View className="mt-2 mb-2">
          <Text className="text-sm font-bold text-darkText mb-2">Explicação em vídeo:</Text>
          <View className="rounded-2xl overflow-hidden">
            <Video
              source={{ uri: question.video }}
              style={{ width: SCREEN_WIDTH - 32, height: (SCREEN_WIDTH - 32) * 9 / 16, backgroundColor: '#000' }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
            />
          </View>
        </View>
      )}

      {showResult && (
        <View className="mt-4 gap-3">
          {!isLastQuestion && (
            <TouchableOpacity onPress={handleNext} className="bg-primary rounded-2xl py-3.5 items-center">
              <Text className="text-white font-bold">Próxima questão</Text>
            </TouchableOpacity>
          )}

          {isLastQuestion && (
            <TouchableOpacity onPress={() => setFinished(true)} className="bg-accent rounded-2xl py-3.5 items-center">
              <Text className="text-dark-bg font-bold">Ver resultado</Text>
            </TouchableOpacity>
          )}

          {currentIndex > 0 && (
            <TouchableOpacity onPress={handlePrevious} className="bg-dark-surfaceLight rounded-2xl py-3.5 items-center">
              <Text className="text-darkText-secondary font-semibold">Questão anterior</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}
