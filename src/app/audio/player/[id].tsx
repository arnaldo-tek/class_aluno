import { useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { useAudioLawDetail } from '@/hooks/useAudio'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function AudioPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useAudioLawDetail(id!)

  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const soundRef = useRef<Audio.Sound | null>(null)

  const audios = data?.audios ?? []

  const playAudio = useCallback(async (index: number) => {
    if (soundRef.current) {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
    }

    const audio = audios[index]
    if (!audio) return

    const { sound } = await Audio.Sound.createAsync(
      { uri: audio.audio_url },
      { shouldPlay: true },
      (status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          const nextIndex = index + 1
          if (nextIndex < audios.length) {
            playAudio(nextIndex)
          } else {
            setIsPlaying(false)
            setCurrentIndex(null)
          }
        }
      },
    )

    soundRef.current = sound
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [audios])

  const togglePlayPause = useCallback(async (index: number) => {
    if (currentIndex === index && isPlaying) {
      await soundRef.current?.pauseAsync()
      setIsPlaying(false)
    } else if (currentIndex === index && !isPlaying) {
      await soundRef.current?.playAsync()
      setIsPlaying(true)
    } else {
      await playAudio(index)
    }
  }, [currentIndex, isPlaying, playAudio])

  if (isLoading) return <LoadingSpinner />
  if (!data?.lei) return null

  const { lei } = data

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>
          {lei.nome}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Audio player */}
        {audios.length > 0 && (
          <View className="px-4 pt-4">
            <Text className="text-sm font-semibold text-gray-900 mb-3">
              {t('audio.title')} ({audios.length})
            </Text>
            {audios.map((audio, i) => (
              <TouchableOpacity
                key={audio.id}
                onPress={() => togglePlayPause(i)}
                className={`flex-row items-center px-4 py-3 mb-2 rounded-xl border ${
                  currentIndex === i ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  currentIndex === i && isPlaying ? 'bg-blue-600' : 'bg-gray-100'
                }`}>
                  <Ionicons
                    name={currentIndex === i && isPlaying ? 'pause' : 'play'}
                    size={18}
                    color={currentIndex === i && isPlaying ? 'white' : '#2563eb'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-gray-900">
                    {audio.titulo ?? `${t('audio.title')} ${i + 1}`}
                  </Text>
                </View>
                {currentIndex === i && (
                  <Ionicons name="musical-notes" size={16} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}

            {audios.length > 1 && (
              <TouchableOpacity
                onPress={() => playAudio(0)}
                className="mt-2 bg-blue-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold text-sm">
                  Reproduzir todos sequencialmente
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Law text */}
        {lei.texto && (
          <View className="px-4 pt-6">
            <Text className="text-sm font-semibold text-gray-900 mb-2">{lei.nome}</Text>
            <Text className="text-sm text-gray-700 leading-6">{lei.texto}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
