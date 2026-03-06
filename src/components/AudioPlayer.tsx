import { useState, useRef, useCallback, useEffect } from 'react'
import { View, Text, TouchableOpacity, Platform, Dimensions, PanResponder } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const THUMB_SIZE = 16
const TRACK_H = 6
const SEEK_BAR_H_PAD = 16

// --- Types ---

export type AudioItem = {
  id: string
  titulo: string | null
  audio_url: string
}

// --- Hook: useAudioPlayer ---

export function useAudioPlayer() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const soundRef = useRef<Audio.Sound | null>(null)
  const playRef = useRef<(index: number) => Promise<void>>()

  const play = useCallback(async (index: number, audios: AudioItem[]) => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
      } catch {}
      soundRef.current = null
    }

    const audio = audios[index]
    if (!audio) return

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audio.audio_url },
        { shouldPlay: true, rate: speed, shouldCorrectPitch: true },
      )
      soundRef.current = sound
      setCurrentIndex(index)
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
      setCurrentIndex(null)
    }
  }, [speed])

  playRef.current = (index: number) => play(index, []) // placeholder, overridden by caller

  const togglePlayPause = useCallback(async (index: number, audios: AudioItem[]) => {
    if (currentIndex === index && isPlaying) {
      await soundRef.current?.pauseAsync()
      setIsPlaying(false)
    } else if (currentIndex === index && !isPlaying) {
      await soundRef.current?.playAsync()
      setIsPlaying(true)
    } else {
      await play(index, audios)
    }
  }, [currentIndex, isPlaying, play])

  const changeSpeed = useCallback(async (s: number) => {
    setSpeed(s)
    if (soundRef.current) {
      await soundRef.current.setRateAsync(s, true)
    }
  }, [])

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
      } catch {}
      soundRef.current = null
    }
    setIsPlaying(false)
    setCurrentIndex(null)
  }, [])

  // Cleanup on unmount — stop audio when leaving the screen
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {})
        soundRef.current.unloadAsync().catch(() => {})
        soundRef.current = null
      }
    }
  }, [])

  return { currentIndex, isPlaying, speed, soundRef, play, togglePlayPause, changeSpeed, stop }
}

// --- Helpers ---

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// --- SeekBar (inline styles, safe from NativeWind re-render bugs) ---

function AudioSeekBar({ progress, positionMs, durationMs, onSeekStart, onSeek, accentColor = '#3b82f6' }: {
  progress: number
  positionMs: number
  durationMs: number
  onSeekStart: () => void
  onSeek: (ratio: number) => void
  accentColor?: string
}) {
  const barWidth = SCREEN_WIDTH - 32 - SEEK_BAR_H_PAD * 2
  const [dragging, setDragging] = useState(false)
  const [dragRatio, setDragRatio] = useState(0)
  const barRef = useRef<View>(null)
  const barX = useRef(0)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        onSeekStart()
        setDragging(true)
        barRef.current?.measureInWindow((x) => {
          barX.current = x
          const ratio = Math.max(0, Math.min(1, (e.nativeEvent.pageX - x) / barWidth))
          setDragRatio(ratio)
        })
      },
      onPanResponderMove: (e) => {
        const ratio = Math.max(0, Math.min(1, (e.nativeEvent.pageX - barX.current) / barWidth))
        setDragRatio(ratio)
      },
      onPanResponderRelease: (e) => {
        const ratio = Math.max(0, Math.min(1, (e.nativeEvent.pageX - barX.current) / barWidth))
        setDragging(false)
        onSeek(ratio)
      },
    })
  ).current

  const displayProgress = dragging ? dragRatio : progress
  const displayPosition = dragging ? dragRatio * durationMs : positionMs

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <View
        ref={barRef}
        {...panResponder.panHandlers}
        style={{ height: THUMB_SIZE + 8, justifyContent: 'center' }}
      >
        <View style={{ height: TRACK_H, width: '100%', backgroundColor: '#252538', borderRadius: 3 }}>
          <View style={{ height: TRACK_H, width: `${displayProgress * 100}%`, backgroundColor: accentColor, borderRadius: 3 }} />
        </View>
        <View
          style={{
            position: 'absolute',
            left: displayProgress * barWidth - THUMB_SIZE / 2,
            top: (THUMB_SIZE + 8 - THUMB_SIZE) / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: accentColor,
            borderWidth: 2,
            borderColor: '#ffffff',
            ...(dragging ? {
              transform: [{ scale: 1.25 }],
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 4,
            } : {}),
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ fontSize: 10, color: '#6b7280' }}>{formatTime(displayPosition)}</Text>
        <Text style={{ fontSize: 10, color: '#6b7280' }}>{formatTime(durationMs)}</Text>
      </View>
    </View>
  )
}

// --- SpeedControl ---

export function AudioSpeedControl({ speed, onSpeedChange, accentColor = '#3b82f6' }: {
  speed: number
  onSpeedChange: (s: number) => void
  accentColor?: string
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 }}>
      {SPEED_OPTIONS.map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => onSpeedChange(s)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: speed === s ? accentColor : '#252538',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: speed === s ? '#fff' : '#6b7280' }}>
            {s}x
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// --- AudioItemCard (isolated re-renders for position tracking) ---

export function AudioItemCard({
  audio,
  index,
  isActive,
  isPlaying,
  soundRef,
  onToggle,
  onFinished,
  accentColor = '#3b82f6',
  renderRight,
}: {
  audio: AudioItem
  index: number
  isActive: boolean
  isPlaying: boolean
  soundRef: React.MutableRefObject<Audio.Sound | null>
  onToggle: () => void
  onFinished: (nextIndex: number) => void
  accentColor?: string
  renderRight?: () => React.ReactNode
}) {
  const [positionMs, setPositionMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const isSeeking = useRef(false)
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished

  useEffect(() => {
    if (!isActive || !isPlaying) return
    setPositionMs(0)
    setDurationMs(0)

    const timer = setInterval(async () => {
      if (!soundRef.current || isSeeking.current) return
      try {
        const status = await soundRef.current.getStatusAsync()
        if (!status.isLoaded) return
        setPositionMs(status.positionMillis ?? 0)
        if (status.durationMillis) setDurationMs(status.durationMillis)
        if (status.didJustFinish) {
          clearInterval(timer)
          onFinishedRef.current(index + 1)
        }
      } catch {}
    }, 300)

    return () => clearInterval(timer)
  }, [isActive, isPlaying, index, soundRef])

  const handleSeek = useCallback(async (ratio: number) => {
    if (soundRef.current && durationMs > 0) {
      const seekTo = ratio * durationMs
      await soundRef.current.setPositionAsync(seekTo)
      setPositionMs(seekTo)
    }
    isSeeking.current = false
  }, [durationMs, soundRef])

  const progress = durationMs > 0 ? positionMs / durationMs : 0

  return (
    <View
      style={{
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isActive ? accentColor + '4D' : '#2a2a3a',
        backgroundColor: isActive ? accentColor + '14' : '#1e1e2e',
      }}
    >
      <TouchableOpacity
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
      >
        <View style={{
          width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isPlaying ? accentColor : '#252538',
        }}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={isPlaying ? '#fff' : accentColor}
          />
        </View>
        <Text style={{ flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '500', color: '#f0f0f0' }} numberOfLines={2}>
          {audio.titulo ?? `Áudio ${index + 1}`}
        </Text>
        {isActive && (
          <Ionicons name="musical-notes" size={16} color={accentColor} />
        )}
        {renderRight?.()}
      </TouchableOpacity>

      {isActive && (
        <AudioSeekBar
          progress={progress}
          positionMs={positionMs}
          durationMs={durationMs}
          accentColor={accentColor}
          onSeekStart={() => { isSeeking.current = true }}
          onSeek={handleSeek}
        />
      )}
    </View>
  )
}

// --- AudioPlayerList (full player with speed, list, play-all) ---

export function AudioPlayerList({
  audios,
  accentColor = '#3b82f6',
  renderItemRight,
}: {
  audios: AudioItem[]
  accentColor?: string
  renderItemRight?: (audio: AudioItem, index: number) => React.ReactNode
}) {
  const { currentIndex, isPlaying, speed, soundRef, play, togglePlayPause, changeSpeed, stop } = useAudioPlayer()

  return (
    <View>
      <AudioSpeedControl speed={speed} onSpeedChange={changeSpeed} accentColor={accentColor} />
      <View style={{ marginTop: 8 }}>
        {audios.map((audio, i) => (
          <AudioItemCard
            key={audio.id}
            audio={audio}
            index={i}
            isActive={currentIndex === i}
            isPlaying={currentIndex === i && isPlaying}
            soundRef={soundRef}
            accentColor={accentColor}
            onToggle={() => togglePlayPause(i, audios)}
            onFinished={(nextIdx) => {
              if (nextIdx < audios.length) {
                play(nextIdx, audios)
              } else {
                stop()
              }
            }}
            renderRight={renderItemRight ? () => renderItemRight(audio, i) : undefined}
          />
        ))}
      </View>

      {audios.length > 1 && (
        <TouchableOpacity
          onPress={() => play(0, audios)}
          style={{
            marginTop: 8,
            backgroundColor: accentColor,
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Reproduzir todos sequencialmente</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
