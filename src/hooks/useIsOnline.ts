import NetInfo from '@react-native-community/netinfo'
import { useState, useEffect } from 'react'

let _isOnline = true

/** Singleton para uso fora de componentes (ex: downloadManager) */
export function getIsOnline(): boolean {
  return _isOnline
}

/** Hook React para uso dentro de componentes */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(_isOnline)

  useEffect(() => {
    // Leitura inicial imediata
    NetInfo.fetch().then((state) => {
      const online = (state.isConnected ?? false) && (state.isInternetReachable !== false)
      _isOnline = online
      setIsOnline(online)
    })

    return NetInfo.addEventListener((state) => {
      const online = (state.isConnected ?? false) && (state.isInternetReachable !== false)
      _isOnline = online
      setIsOnline(online)
    })
  }, [])

  return isOnline
}
