import { Component, type ReactNode } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { captureError } from '@/lib/sentry'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-white px-8">
          <Text className="text-5xl mb-4">😕</Text>
          <Text className="text-lg font-bold text-gray-900 text-center mb-2">
            Algo deu errado
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            Ocorreu um erro inesperado. Tente reiniciar o aplicativo.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            className="bg-blue-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold text-sm">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}
