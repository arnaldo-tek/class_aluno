import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAudioPackages, useAudioBanners, useAudioFolders, useAudioLaws, useAudioLawDetail } from '@/hooks/useAudio'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

const SCREEN_WIDTH = Dimensions.get('window').width

type TabType = 1 | 2 | 3 | 4
type DrillLevel = 'packages' | 'folders' | 'laws' | 'player'

const TAB_CONFIG: Array<{ tipo: TabType; key: string; icon: string; color: string }> = [
  { tipo: 1, key: 'audio.packages', icon: 'library-outline', color: '#60a5fa' },
  { tipo: 2, key: 'audio.federalLaws', icon: 'globe-outline', color: '#34d399' },
  { tipo: 3, key: 'audio.stateLaws', icon: 'flag-outline', color: '#fbbf24' },
  { tipo: 4, key: 'audio.municipalLaws', icon: 'business-outline', color: '#c084fc' },
]

function useWebAudio() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<any>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      if (Platform.OS === 'web') {
        audioRef.current.pause()
        audioRef.current.src = ''
      } else {
        audioRef.current.stopAsync?.().catch(() => {})
        audioRef.current.unloadAsync?.().catch(() => {})
      }
      audioRef.current = null
    }
    setIsPlaying(false)
    setCurrentIndex(null)
  }, [])

  const play = useCallback(async (url: string, index: number, audios: any[]) => {
    stop()
    if (Platform.OS === 'web') {
      const audio = new window.Audio(url)
      audio.onended = () => {
        const next = index + 1
        if (next < audios.length) play(audios[next].audio_url, next, audios)
        else { setIsPlaying(false); setCurrentIndex(null) }
      }
      audioRef.current = audio
      audio.play()
    } else {
      try {
        const { Audio } = require('expo-av')
        const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true }, (s: any) => {
          if (s.isLoaded && s.didJustFinish) {
            const next = index + 1
            if (next < audios.length) play(audios[next].audio_url, next, audios)
            else { setIsPlaying(false); setCurrentIndex(null) }
          }
        })
        audioRef.current = sound
      } catch { return }
    }
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [stop])

  const toggle = useCallback(async (index: number, url: string, audios: any[]) => {
    if (currentIndex === index && isPlaying) {
      Platform.OS === 'web' ? audioRef.current?.pause() : await audioRef.current?.pauseAsync?.()
      setIsPlaying(false)
    } else if (currentIndex === index) {
      Platform.OS === 'web' ? audioRef.current?.play() : await audioRef.current?.playAsync?.()
      setIsPlaying(true)
    } else {
      await play(url, index, audios)
    }
  }, [currentIndex, isPlaying, play])

  return { currentIndex, isPlaying, play, toggle, stop }
}

export default function AudioScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>(1)
  const [level, setLevel] = useState<DrillLevel>('packages')
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedLawId, setSelectedLawId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Array<{ label: string; level: DrillLevel; id?: string }>>([])

  const { data: packages, isLoading: loadingPkg } = useAudioPackages(activeTab)
  const { data: banners } = useAudioBanners()
  const { data: folders, isLoading: loadingFolders } = useAudioFolders(selectedPackageId ?? '')
  const { data: laws, isLoading: loadingLaws } = useAudioLaws(selectedFolderId ?? '')
  const { data: lawDetail, isLoading: loadingDetail } = useAudioLawDetail(selectedLawId ?? '')
  const audio = useWebAudio()

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
    audio.stop()
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
    setBreadcrumb(prev => [...prev.slice(0, 2), { label: law.nome, level: 'laws', id: selectedFolderId! }])
  }

  function goBack() {
    if (level === 'player') {
      audio.stop()
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
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
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
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
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
            <Ionicons name={item.icon as any} size={13} color={activeTab === item.tipo ? item.color : '#6b7280'} />
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
      </View>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <View className="flex-row items-center px-4 pb-2">
          <TouchableOpacity onPress={resetToPackages}>
            <Text className="text-xs text-primary-light">Inicio</Text>
          </TouchableOpacity>
          {breadcrumb.map((b, i) => (
            <View key={i} className="flex-row items-center">
              <Ionicons name="chevron-forward" size={12} color="#6b7280" style={{ marginHorizontal: 4 }} />
              <Text className={`text-xs ${i === breadcrumb.length - 1 ? 'text-darkText font-medium' : 'text-darkText-muted'}`} numberOfLines={1}>
                {b.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Content area - changes based on level */}
      {level === 'packages' && (
        loadingPkg ? <LoadingSpinner /> : !packages?.length ? (
          <EmptyState title={t('audio.noAudio')} icon={<Ionicons name="musical-notes-outline" size={48} color="#9ca3af" />} />
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
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          />
        )
      )}

      {level === 'folders' && (
        loadingFolders ? <LoadingSpinner /> : !folders?.length ? (
          <EmptyState title="Nenhuma subpasta" icon={<Ionicons name="folder-open-outline" size={48} color="#9ca3af" />} />
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
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          />
        )
      )}

      {level === 'laws' && (
        loadingLaws ? <LoadingSpinner /> : !laws?.length ? (
          <EmptyState title="Nenhuma lei" icon={<Ionicons name="document-text-outline" size={48} color="#9ca3af" />} />
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
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          />
        )
      )}

      {level === 'player' && (
        loadingDetail ? <LoadingSpinner /> : !lawDetail?.lei ? null : (
          <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            <Text className="text-base font-bold text-darkText mb-4">{lawDetail.lei.nome}</Text>

            {lawDetail.audios.length > 0 && (
              <View className="mb-4">
                {lawDetail.audios.map((a, i) => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => audio.toggle(i, a.audio_url, lawDetail.audios)}
                    className={`flex-row items-center px-4 py-3 mb-2 rounded-2xl border ${
                      audio.currentIndex === i ? 'border-primary bg-primary-50' : 'border-darkBorder-subtle bg-dark-surface'
                    }`}
                  >
                    <View className={`w-9 h-9 rounded-full items-center justify-center ${
                      audio.currentIndex === i && audio.isPlaying ? 'bg-primary' : 'bg-dark-surfaceLight'
                    }`}>
                      <Ionicons
                        name={audio.currentIndex === i && audio.isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={audio.currentIndex === i && audio.isPlaying ? '#fff' : activeColor}
                      />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-darkText ml-3">
                      {a.titulo ?? `Audio ${i + 1}`}
                    </Text>
                    {audio.currentIndex === i && <Ionicons name="musical-notes" size={14} color="#f59e0b" />}
                  </TouchableOpacity>
                ))}

                {lawDetail.audios.length > 1 && (
                  <TouchableOpacity
                    onPress={() => audio.play(lawDetail.audios[0].audio_url, 0, lawDetail.audios)}
                    className="mt-1 bg-primary rounded-2xl py-3 items-center"
                  >
                    <Text className="text-white font-semibold text-sm">Reproduzir todos</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {lawDetail.lei.texto && (
              <View className="bg-dark-surface rounded-2xl p-4 border border-darkBorder-subtle">
                <Text className="text-sm text-darkText-secondary leading-6">{lawDetail.lei.texto}</Text>
              </View>
            )}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  )
}
