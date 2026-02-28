import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCommunities, useIsMember, useToggleMembership } from '@/hooks/useCommunity'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function CommunityListScreen() {
  const router = useRouter()
  const { data: communities, isLoading } = useCommunities()

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('community.title')}</Text>
      </View>

      <FlatList
        data={communities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            title={t('community.noCommunities')}
            icon={<Ionicons name="people-outline" size={48} color="#9ca3af" />}
          />
        }
        renderItem={({ item }) => (
          <CommunityItem item={item} />
        )}
      />
    </SafeAreaView>
  )
}

function CommunityItem({ item }: { item: any }) {
  const router = useRouter()
  const { data: isMember } = useIsMember(item.id)
  const toggleMembership = useToggleMembership()

  return (
    <View className="bg-white rounded-xl mb-3 overflow-hidden border border-gray-100">
      <TouchableOpacity
        onPress={() => isMember ? router.push(`/community/${item.id}`) : null}
        className="flex-row p-4"
        disabled={!isMember}
      >
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} className="w-14 h-14 rounded-lg" resizeMode="cover" />
        ) : (
          <View className="w-14 h-14 bg-blue-50 rounded-lg items-center justify-center">
            <Ionicons name="people-outline" size={24} color="#2563eb" />
          </View>
        )}
        <View className="flex-1 ml-3 justify-center">
          <Text className="text-base font-semibold text-gray-900">{item.nome}</Text>
          {item.categorias?.nome && (
            <Text className="text-xs text-gray-400 mt-0.5">{item.categorias.nome}</Text>
          )}
        </View>
      </TouchableOpacity>

      <View className="flex-row border-t border-gray-50">
        <TouchableOpacity
          onPress={() => toggleMembership.mutate({ comunidadeId: item.id, isMember: !!isMember })}
          disabled={toggleMembership.isPending}
          className="flex-1 py-3 items-center"
        >
          <Text className={`text-sm font-medium ${isMember ? 'text-red-500' : 'text-blue-600'}`}>
            {isMember ? t('community.leave') : t('community.join')}
          </Text>
        </TouchableOpacity>
        {item.regras && (
          <TouchableOpacity
            onPress={() => router.push(`/community/rules/${item.id}`)}
            className="flex-1 py-3 items-center border-l border-gray-50"
          >
            <Text className="text-sm font-medium text-gray-600">{t('community.rules')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
