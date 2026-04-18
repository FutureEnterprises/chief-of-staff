import { View, Text, ScrollView, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'

export default function PatternsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal }}>Patterns</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 20 }}>
          Your autopilot map.
        </Text>

        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Ionicons name="eye-outline" size={48} color="#94a3b8" />
          <Text style={{ fontSize: 15, fontWeight: '600', color: BRAND.charcoal, marginTop: 12, textAlign: 'center' }}>
            Full pattern view
          </Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', maxWidth: 280 }}>
            Check back on the web for the full autopilot map, excuse heatmap, and identity trend.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
