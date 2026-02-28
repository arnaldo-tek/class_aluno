import { useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAudioLawDetail } from '@/hooks/useAudio'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

// Web-compatible audio player
function useAudioPlayer() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<any>(null)

  const play = useCallback(async (url: string, index: number, audios: any[], onFinish?: () => void) => {
    // Stop current
    if (audioRef.current) {
      if (Platform.OS === 'web') {
        audioRef.current.pause()
        audioRef.current.src = ''
      } else {
        try {
          const { Audio } = require('expo-av')
          await audioRef.current.stopAsync?.()
          await audioRef.current.unloadAsync?.()
        } catch {}
      }
      audioRef.current = null
    }

    if (Platform.OS === 'web') {
      const audio = new window.Audio(url)
      audio.onended = () => {
        const nextIdx = index + 1
        if (nextIdx < audios.length) {
          play(audios[nextIdx].audio_url, nextIdx, audios, onFinish)
        } else {
          setIsPlaying(false)
          setCurrentIndex(null)
        }
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentIndex(null)
      }
      audioRef.current = audio
      audio.play()
      setCurrentIndex(index)
      setIsPlaying(true)
    } else {
      try {
        const { Audio } = require('expo-av')
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              const nextIdx = index + 1
              if (nextIdx < audios.length) {
                play(audios[nextIdx].audio_url, nextIdx, audios, onFinish)
              } else {
                setIsPlaying(false)
                setCurrentIndex(null)
              }
            }
          },
        )
        audioRef.current = sound
        setCurrentIndex(index)
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
        setCurrentIndex(null)
      }
    }
  }, [])

  const togglePlayPause = useCallback(async (index: number, url: string, audios: any[]) => {
    if (currentIndex === index && isPlaying) {
      if (Platform.OS === 'web') {
        audioRef.current?.pause()
      } else {
        await audioRef.current?.pauseAsync?.()
      }
      setIsPlaying(false)
    } else if (currentIndex === index && !isPlaying) {
      if (Platform.OS === 'web') {
        audioRef.current?.play()
      } else {
        await audioRef.current?.playAsync?.()
      }
      setIsPlaying(true)
    } else {
      await play(url, index, audios)
    }
  }, [currentIndex, isPlaying, play])

  return { currentIndex, isPlaying, play, togglePlayPause }
}

export default function AudioPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useAudioLawDetail(id!)
  const { currentIndex, isPlaying, play, togglePlayPause } = useAudioPlayer()

  const audios = data?.audios ?? []

  if (isLoading) return <LoadingSpinner />
  if (!data?.lei) return null

  const { lei } = data

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1" numberOfLines={1}>
          {lei.nome}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Audio player */}
        {audios.length > 0 && (
          <View className="px-4 pt-4">
            <Text className="text-sm font-semibold text-darkText mb-3">
              {t('audio.title')} ({audios.length})
            </Text>
            {audios.map((audio, i) => (
              <TouchableOpacity
                key={audio.id}
                onPress={() => togglePlayPause(i, audio.audio_url, audios)}
                className={`flex-row items-center px-4 py-3 mb-2 rounded-2xl border ${
                  currentIndex === i
                    ? 'border-primary bg-primary-50'
                    : 'border-darkBorder bg-dark-surface'
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  currentIndex === i && isPlaying ? 'bg-primary' : 'bg-dark-surfaceLight'
                }`}>
                  <Ionicons
                    name={currentIndex === i && isPlaying ? 'pause' : 'play'}
                    size={18}
                    color={currentIndex === i && isPlaying ? '#fff' : '#60a5fa'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-darkText">
                    {audio.titulo ?? `${t('audio.title')} ${i + 1}`}
                  </Text>
                </View>
                {currentIndex === i && (
                  <Ionicons name="musical-notes" size={16} color="#f59e0b" />
                )}
              </TouchableOpacity>
            ))}

            {audios.length > 1 && (
              <TouchableOpacity
                onPress={() => play(audios[0].audio_url, 0, audios)}
                className="mt-2 bg-primary rounded-2xl py-3.5 items-center"
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
            <Text className="text-sm font-semibold text-darkText mb-2">{lei.nome}</Text>
            <Text className="text-sm text-darkText-secondary leading-6">{lei.texto}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
