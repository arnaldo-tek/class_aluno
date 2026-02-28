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
        className={`flex-row items-center px-3.5 py-2 mr-2 rounded-full ${
          value ? 'bg-primary-50 border border-primary' : 'bg-dark-surfaceLight border border-darkBorder'
        }`}
      >
        <Text className={`text-sm mr-1 ${value ? 'text-primary-light font-semibold' : 'text-darkText-secondary'}`}>
          {selectedLabel ?? label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={value ? '#60a5fa' : '#9ca3af'} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-end"
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View className="bg-dark-surface rounded-t-3xl max-h-[60%]">
            <View className="w-10 h-1 bg-darkBorder rounded-full self-center mt-3 mb-2" />
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-darkBorder">
              <Text className="text-base font-bold text-darkText">{label}</Text>
              {value && (
                <TouchableOpacity onPress={() => { onChange(null); setVisible(false) }}>
                  <Text className="text-sm text-error font-medium">Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onChange(item.value); setVisible(false) }}
                  className={`flex-row items-center px-5 py-4 border-b border-darkBorder-subtle ${
                    item.value === value ? 'bg-primary-50' : ''
                  }`}
                >
                  <Text className={`flex-1 text-base ${item.value === value ? 'text-primary-light font-semibold' : 'text-darkText'}`}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark-circle" size={20} color="#60a5fa" />
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
