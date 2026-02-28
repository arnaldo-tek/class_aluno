import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface FilterDropdownProps {
  label: string
  value: string | null
  options: Array<{ label: string; value: string }>
  onChange: (value: string | null) => void
}

export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [visible, setVisible] = useState(false)

  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className={`flex-row items-center px-3 py-2 mr-2 rounded-full border ${
          value ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
        }`}
      >
        <Text className={`text-sm mr-1 ${value ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
          {selectedLabel ?? label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={value ? '#1d4ed8' : '#9ca3af'} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View className="bg-white rounded-t-2xl max-h-[60%]">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
              <Text className="text-base font-bold text-gray-900">{label}</Text>
              {value && (
                <TouchableOpacity onPress={() => { onChange(null); setVisible(false) }}>
                  <Text className="text-sm text-red-500">Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onChange(item.value); setVisible(false) }}
                  className={`flex-row items-center px-4 py-3.5 border-b border-gray-50 ${
                    item.value === value ? 'bg-blue-50' : ''
                  }`}
                >
                  <Text className={`flex-1 text-base ${item.value === value ? 'text-blue-700 font-medium' : 'text-gray-900'}`}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}
