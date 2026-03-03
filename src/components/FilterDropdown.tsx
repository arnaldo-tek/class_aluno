import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native'
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

interface FilterDropdownMultiProps {
  label: string
  values: string[]
  options: Array<{ label: string; value: string }>
  onChange: (values: string[]) => void
}

export function FilterDropdownMulti({ label, values, options, onChange }: FilterDropdownMultiProps) {
  const [visible, setVisible] = useState(false)

  const hasSelection = values.length > 0
  const displayLabel = hasSelection
    ? values.length === 1
      ? options.find((o) => o.value === values[0])?.label ?? label
      : `${values.length} selecionadas`
    : label

  function toggleValue(val: string) {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val))
    } else {
      onChange([...values, val])
    }
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className={`flex-row items-center px-3.5 py-2 mr-2 rounded-full ${
          hasSelection ? 'bg-primary-50 border border-primary' : 'bg-dark-surfaceLight border border-darkBorder'
        }`}
      >
        <Text className={`text-sm mr-1 ${hasSelection ? 'text-primary-light font-semibold' : 'text-darkText-secondary'}`}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={14} color={hasSelection ? '#60a5fa' : '#9ca3af'} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={() => setVisible(false)} />

          {/* Sheet */}
          <View className="bg-dark-surface rounded-t-3xl" style={{ maxHeight: '80%' }}>
            <View className="w-10 h-1 bg-darkBorder rounded-full self-center mt-3 mb-2" />
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-darkBorder">
              <Text className="text-base font-bold text-darkText">{label}</Text>
              {hasSelection && (
                <TouchableOpacity onPress={() => onChange([])}>
                  <Text className="text-sm text-error font-medium">Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => {
                const selected = values.includes(item.value)
                return (
                  <TouchableOpacity
                    onPress={() => toggleValue(item.value)}
                    className={`flex-row items-center px-5 py-3.5 border-b border-darkBorder-subtle ${
                      selected ? 'bg-primary-50' : ''
                    }`}
                  >
                    <View className={`w-5 h-5 rounded mr-3 border items-center justify-center ${
                      selected ? 'bg-primary border-primary' : 'border-darkBorder'
                    }`}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text className={`flex-1 text-base ${selected ? 'text-primary-light font-semibold' : 'text-darkText'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )
              }}
            />
            <View className="px-5 pt-2 pb-6 border-t border-darkBorder">
              <TouchableOpacity
                onPress={() => setVisible(false)}
                className="bg-primary rounded-2xl py-3.5 items-center"
              >
                <Text className="text-white font-semibold text-sm">
                  {hasSelection ? `Aplicar (${values.length})` : 'Fechar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}
