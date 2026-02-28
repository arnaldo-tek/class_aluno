import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'

export default function TermsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('terms.title')}</Text>
      </View>

      {/* Tab toggle */}
      <View className="flex-row mx-4 mt-4 bg-dark-surfaceLight rounded-2xl p-1">
        <TouchableOpacity
          onPress={() => setActiveTab('terms')}
          className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'terms' ? 'bg-dark-surface' : ''}`}
        >
          <Text className={`text-sm font-medium ${activeTab === 'terms' ? 'text-darkText' : 'text-darkText-muted'}`}>
            {t('terms.termsOfUse')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('privacy')}
          className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'privacy' ? 'bg-dark-surface' : ''}`}
        >
          <Text className={`text-sm font-medium ${activeTab === 'privacy' ? 'text-darkText' : 'text-darkText-muted'}`}>
            {t('terms.privacyPolicy')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'terms' ? (
          <Text className="text-sm text-darkText-secondary leading-6">
            {TERMS_OF_USE}
          </Text>
        ) : (
          <Text className="text-sm text-darkText-secondary leading-6">
            {PRIVACY_POLICY}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const TERMS_OF_USE = `TERMOS DE USO - SUPERCLASSE

1. ACEITAÇÃO DOS TERMOS
Ao acessar e usar o aplicativo Superclasse, você concorda em cumprir estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar o aplicativo.

2. DESCRIÇÃO DO SERVIÇO
O Superclasse é uma plataforma educacional que oferece cursos online, materiais didáticos, áudio cursos e outros conteúdos educacionais produzidos por professores cadastrados na plataforma.

3. CADASTRO E CONTA
Para acessar os serviços, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.

4. USO DO CONTEÚDO
Todo o conteúdo disponibilizado na plataforma é protegido por direitos autorais. O acesso é pessoal e intransferível. É proibido copiar, distribuir, modificar ou comercializar qualquer conteúdo sem autorização prévia.

5. PAGAMENTOS E ASSINATURAS
Os pagamentos são processados através da plataforma Pagar.me. As assinaturas de pacotes são renovadas automaticamente até que sejam canceladas pelo usuário. O cancelamento pode ser feito a qualquer momento através do aplicativo.

6. POLÍTICA DE REEMBOLSO
Solicitações de reembolso devem ser feitas dentro de 7 dias após a compra, desde que o conteúdo não tenha sido acessado em mais de 30%.

7. RESPONSABILIDADES DO USUÁRIO
O usuário se compromete a: usar o aplicativo apenas para fins educacionais; não compartilhar sua conta com terceiros; manter suas informações atualizadas; respeitar os demais usuários nas comunidades.

8. ALTERAÇÕES NOS TERMOS
Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através do aplicativo.

9. CONTATO
Para dúvidas sobre estes termos, entre em contato através do suporte no aplicativo.`

const PRIVACY_POLICY = `POLÍTICA DE PRIVACIDADE - SUPERCLASSE

1. COLETA DE DADOS
Coletamos as seguintes informações: nome completo, endereço de e-mail, foto de perfil (opcional), dados de uso do aplicativo e progresso nos cursos.

2. USO DOS DADOS
Seus dados são utilizados para: fornecer e melhorar nossos serviços; personalizar sua experiência; processar pagamentos; enviar notificações relevantes; análise estatística de uso.

3. ARMAZENAMENTO
Seus dados são armazenados em servidores seguros com criptografia. Utilizamos o Supabase como provedor de infraestrutura, que segue padrões internacionais de segurança.

4. COMPARTILHAMENTO
Não vendemos ou compartilhamos seus dados pessoais com terceiros, exceto: processadores de pagamento (Pagar.me); quando exigido por lei; para proteção de nossos direitos legais.

5. COOKIES E RASTREAMENTO
O aplicativo pode utilizar tecnologias de rastreamento para melhorar a experiência do usuário e análise de uso.

6. DIREITOS DO USUÁRIO
Você tem direito a: acessar seus dados pessoais; solicitar correção de dados incorretos; solicitar exclusão de sua conta e dados; exportar seus dados em formato legível.

7. SEGURANÇA
Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.

8. MENORES DE IDADE
O uso do aplicativo por menores de 18 anos deve ser supervisionado por um responsável legal.

9. ALTERAÇÕES
Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas através do aplicativo.

10. CONTATO
Para questões relacionadas à privacidade, entre em contato através do suporte no aplicativo ou pelo e-mail disponível na seção de suporte.`
