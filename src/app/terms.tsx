import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function TermsScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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

const TERMS_OF_USE = `TERMOS DE USO PLATAFORMA SUPERCLASSE
Vigente a partir de 30 de maio de 2026

1. ACEITAÇÃO DOS TERMOS

Ao criar uma conta, acessar ou utilizar o aplicativo SUPERCLASSE, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, não deve utilizar o aplicativo.

1.1. Estes Termos constituem um acordo vinculante entre o usuário e a NEURONTEK SOLUÇÕES EDUCACIONAIS LTDA, operadora da plataforma SUPERCLASSE, regido pela legislação brasileira, em especial o Código Civil (Lei nº 10.406/2002), o Código de Defesa do Consumidor (Lei nº 8.078/1990), o Marco Civil da Internet (Lei nº 12.965/2014), a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e demais normas brasileiras aplicáveis.

1.2. Estes Termos de Uso devem ser lidos em conjunto com a Política de Privacidade da plataforma, que integra e complementa este instrumento.

2. DEFINIÇÕES

Para fins destes Termos, aplicam-se as seguintes definições:

Plataforma / Aplicativo: ambiente digital mantido pela NEURONTEK, acessível por aplicativo móvel e/ou site, denominado SUPERCLASSE.
Neurontek: NEURONTEK SOLUÇÕES EDUCACIONAIS LTDA, CNPJ 49.275.854/0001-70, operadora do SUPERCLASSE.
Usuário: pessoa física que se cadastra e utiliza o aplicativo SUPERCLASSE para acessar cursos, conteúdos e demais recursos educacionais disponíveis.
Curso: produto educacional digital disponibilizado na plataforma para aquisição e acesso pelo usuário.
Conteúdo: todo material disponível na plataforma, incluindo aulas gravadas, audioaulas, textos, questões e demais recursos educacionais.
Serviços: conjunto de funcionalidades, recursos e ferramentas disponíveis no aplicativo SUPERCLASSE.

3. SOBRE A PLATAFORMA

3.1. O SUPERCLASSE é uma plataforma educacional que disponibiliza ao usuário acesso a conteúdos e serviços voltados à preparação para seleções públicas e ao desenvolvimento acadêmico e profissional.

3.2. Os conteúdos disponibilizados na plataforma são produzidos pela NEURONTEK e por colaboradores parceiros. A NEURONTEK zela pela qualidade e adequação dos conteúdos disponibilizados.

3.3. A NEURONTEK atua como plataforma intermediadora, conectando usuários a conteúdos educacionais de qualidade. Embora zele pelo padrão geral da plataforma, a NEURONTEK não é produtora, coproductora ou responsável editorial pelo conteúdo dos cursos produzidos por professores parceiros, cuja responsabilidade recai exclusivamente sobre seus respectivos autores.

3.4. A NEURONTEK não garante resultados específicos decorrentes do uso da plataforma, da conclusão de cursos ou do acesso a qualquer conteúdo disponibilizado. O desempenho em seleções, avaliações ou qualquer outra finalidade acadêmica e profissional depende exclusivamente do esforço, dedicação, método de estudo e circunstâncias individuais de cada usuário, fatores estes alheios ao controle da plataforma.

3.5. A plataforma SUPERCLASSE oferece recursos gratuitos, acessíveis a todos os usuários cadastrados, e recursos pagos, disponíveis mediante aquisição prévia. As condições de acesso, preços e prazos de cada recurso pago são exibidos na plataforma antes da conclusão da compra.

3.6. Em caso de falha técnica comprovada que resulte em perda ou interrupção indevida do acesso a conteúdos ou serviços da plataforma, a NEURONTEK providenciará a restauração do acesso no prazo de até 5 (cinco) dias úteis, mediante solicitação pelo canal de suporte, sem necessidade de nova cobrança. Para conteúdos e serviços pagos, caso o usuário não deseje a restauração do acesso, poderá optar por crédito equivalente para uso na plataforma ou reembolso proporcional ao período não usufruído, processado em até 10 (dez) dias úteis após a solicitação. Conteúdos gratuitos serão simplesmente restaurados, sem direito a compensação financeira.

4. CADASTRO E CONTA

4.1. Para acessar os serviços da plataforma é necessário criar uma conta, mediante fornecimento de informações verdadeiras, completas e atualizadas. O usuário é responsável pela veracidade dos dados informados, respondendo civil e criminalmente por eventuais falsidades. A NEURONTEK reserva-se o direito de verificar as informações fornecidas e solicitar documentação complementar quando necessário.

4.2. O usuário é integralmente responsável pela confidencialidade de suas credenciais de acesso (e-mail e senha) e por todas as atividades realizadas em sua conta, independentemente de terem sido praticadas por ele ou por terceiros com acesso indevido. A NEURONTEK não será responsável por danos decorrentes do uso indevido da conta por terceiros, especialmente quando o acesso ocorrer em razão de negligência do usuário na guarda de suas credenciais.

4.3. O usuário deve notificar imediatamente a NEURONTEK em caso de acesso não autorizado à sua conta, pelo canal de suporte disponível no aplicativo.

4.4. É vedado o compartilhamento de credenciais de acesso com terceiros, seja a título gratuito ou oneroso. Cada conta é estritamente pessoal e intransferível. O compartilhamento de conta caracteriza violação destes Termos e poderá acarretar o encerramento imediato da conta, sem direito a reembolso pelos valores pagos, além das demais medidas cabíveis.

4.5. A NEURONTEK reserva-se o direito de recusar, suspender ou encerrar contas que apresentem informações falsas, incompletas ou desatualizadas, que violem estes Termos de Uso ou a Política de Privacidade, ou cujo comportamento seja prejudicial à plataforma, a outros usuários ou a terceiros, sem que isso gere direito a qualquer indenização ou reembolso, salvo o previsto nestes Termos.

5. OBRIGAÇÕES E RESPONSABILIDADES DO USUÁRIO

5.1. O usuário compromete-se a:
• Utilizar a plataforma para fins educacionais, pessoais ou de desenvolvimento profissional, sendo vedado qualquer uso comercial não autorizado
• Não copiar, reproduzir, redistribuir, revender, transmitir ou disponibilizar o conteúdo dos cursos a terceiros, por qualquer meio
• Não gravar, capturar tela ou fazer download não autorizado de aulas, audioaulas ou qualquer conteúdo protegido por direitos autorais
• Manter suas informações cadastrais verdadeiras e atualizadas
• Não utilizar a plataforma para fins ilícitos, fraudulentos ou que violem direitos de terceiros
• Não compartilhar sua conta com terceiros
• Não tentar acessar áreas restritas da plataforma ou interferir em seu funcionamento técnico
• Não adotar comportamento que possa prejudicar a imagem, a reputação ou o funcionamento da plataforma SUPERCLASSE ou da NEURONTEK

5.2. O descumprimento das obrigações acima poderá acarretar advertência, suspensão ou encerramento da conta, a critério da NEURONTEK, sem direito a reembolso pelos valores pagos quando o encerramento decorrer de infração do próprio usuário, além das demais medidas cabíveis nas esferas civil e criminal.

6. CONTEÚDO E PROPRIEDADE INTELECTUAL

6.1. Todo o conteúdo disponibilizado na plataforma — incluindo aulas, textos, audioaulas, questões, imagens, logotipos, marcas e demais elementos — é protegido por direitos autorais e de propriedade intelectual. O acesso ao conteúdo não implica transferência de qualquer direito ao usuário, que poderá utilizá-lo exclusivamente nos limites desta licença.

6.2. A marca SUPERCLASSE, o logotipo, o mascote e demais elementos de identidade visual da plataforma são de titularidade exclusiva da NEURONTEK, protegidos por registro de propriedade intelectual. É vedado seu uso sem autorização expressa e por escrito, exceto para fins de divulgação positiva da plataforma, desde que preservada a integridade da marca e vedado qualquer uso que possa denegrir, distorcer ou prejudicar a imagem da NEURONTEK ou do SUPERCLASSE.

6.3. Ao adquirir um curso, o usuário recebe licença pessoal, não exclusiva e intransferível de acesso e uso, estritamente para fins educacionais, pelo prazo definido no momento da compra. Findo o prazo, o acesso ao conteúdo será automaticamente encerrado. Esta licença não transfere qualquer direito de propriedade intelectual sobre o conteúdo.

6.4. É expressamente vedado ao usuário compartilhar, redistribuir, copiar, gravar, modificar, adaptar ou criar obras derivadas a partir do conteúdo da plataforma, seja a título gratuito ou oneroso, sem autorização prévia e escrita da NEURONTEK ou do professor parceiro titular do conteúdo. A violação desta disposição sujeitará o usuário às sanções previstas na Lei de Direitos Autorais e demais normas aplicáveis, sem prejuízo do encerramento imediato da conta.

6.5. A reprodução ou distribuição não autorizada de conteúdo da plataforma, inclusive por meio de gravação de tela, download indevido ou compartilhamento em grupos de mensagens, redes sociais ou qualquer outro meio digital, caracteriza violação de direitos autorais e poderá ensejar responsabilização civil e criminal do usuário.

7. PAGAMENTOS, ASSINATURAS E REEMBOLSOS

7.1. Os pagamentos realizados na plataforma são processados pelo gateway de pagamento Pagar.me, em ambiente seguro e certificado, em conformidade com as normas do Banco Central do Brasil e da legislação de meios de pagamento vigente. A NEURONTEK não armazena dados de cartão de crédito, débito ou quaisquer outros instrumentos de pagamento do usuário, sendo esses dados tratados exclusivamente pelo gateway de pagamento responsável.

7.2. Os preços dos cursos e demais recursos pagos são exibidos na plataforma antes da conclusão da compra, de forma clara e transparente, incluindo o prazo de acesso ao conteúdo. Ao finalizar a compra, o usuário declara ter lido e concordado com o valor cobrado, o prazo de acesso definido e as condições de uso do conteúdo adquirido.

7.3. Assinaturas de planos ou pacotes são renovadas automaticamente ao final de cada período, até que o usuário solicite o cancelamento. O cancelamento pode ser realizado a qualquer momento pelo painel do usuário no aplicativo, sem cobrança adicional e sem multa, produzindo efeitos no início do próximo período de cobrança e mantendo o acesso ativo até o final do período já pago.

7.4. Política de reembolso:
• O usuário tem direito a solicitar reembolso integral no prazo de até 7 (sete) dias corridos após a compra, conforme o direito de arrependimento previsto no art. 49 do Código de Defesa do Consumidor (CDC) para compras realizadas fora do estabelecimento comercial, independentemente do percentual de conteúdo acessado nesse período
• Após o prazo de 7 dias, reembolsos poderão ser solicitados em casos de defeito comprovado, indisponibilidade prolongada do conteúdo por falha da plataforma ou não conformidade grave do produto com a descrição apresentada no momento da compra, sendo analisados caso a caso pela NEURONTEK
• Não serão concedidos reembolsos por desistência após o prazo de 7 dias, por incompatibilidade do conteúdo com expectativas pessoais do usuário não descritas na oferta, ou por descumprimento das obrigações previstas nestes Termos pelo próprio usuário
• Solicitações de reembolso devem ser realizadas pelo canal de suporte disponível no aplicativo, com descrição detalhada do motivo
• O prazo para análise e resposta da solicitação é de até 5 (cinco) dias úteis, e o prazo para processamento do reembolso aprovado é de até 10 (dez) dias úteis após a aprovação

8. DISPONIBILIDADE E MODIFICAÇÕES DA PLATAFORMA

8.1. A NEURONTEK envidará seus melhores esforços para manter a plataforma disponível de forma contínua e estável, mas não garante disponibilidade ininterrupta. Poderão ocorrer indisponibilidades decorrentes de manutenções programadas, falhas técnicas, atualizações de sistema, casos fortuitos ou força maior. Manutenções programadas serão comunicadas aos usuários com antecedência mínima de 24 (vinte e quatro) horas, sempre que possível, por avisos e/ou notificação no aplicativo ou e-mail cadastrado.

8.2. A NEURONTEK reserva-se o direito de modificar, atualizar, suspender ou descontinuar funcionalidades da plataforma a qualquer momento, comunicando os usuários com antecedência mínima de 15 (quinze) dias quando as alterações forem significativas. Em nenhuma hipótese a modificação ou descontinuação de funcionalidades poderá prejudicar o acesso a conteúdos já adquiridos pelo usuário dentro do prazo contratado, garantindo-se o cumprimento integral do serviço pelo período pago. Alterações de menor impacto, como melhorias de interface ou correções técnicas, poderão ser realizadas sem aviso prévio.

8.3. A NEURONTEK não se responsabiliza por danos decorrentes de falhas de conexão à internet, problemas no dispositivo do usuário, incompatibilidade de sistemas operacionais ou navegadores, ou interrupções em serviços de terceiros fora de seu controle direto, incluindo provedores de internet, serviços de nuvem e gateways de pagamento.

8.4. Em caso de indisponibilidade prolongada da plataforma por falha exclusivamente imputável à NEURONTEK, devidamente comprovada pelos registros técnicos da plataforma, que impeça o acesso a conteúdo pago por período superior a 72 (setenta e duas) horas consecutivas, o usuário terá direito à extensão proporcional do prazo de acesso contratado ou, a seu critério, ao reembolso proporcional ao período não usufruído, conforme previsto na Cláusula 7.4.

8.5. A NEURONTEK adota medidas técnicas de segurança para proteger a plataforma contra erros, vulnerabilidades e elementos prejudiciais. Não pode, entretanto, garantir a ausência total de falhas, comprometendo-se a agir com diligência e rapidez na identificação e resolução de qualquer problema identificado.

9. FASE BETA

9.1. A plataforma SUPERCLASSE encontra-se atualmente em fase beta, período em que a plataforma está disponível ao público em caráter experimental e com acesso limitado. O acesso nessa fase poderá ser limitado, suspenso ou encerrado a qualquer momento, a critério da NEURONTEK, sem que isso gere direito a indenização.

9.2. Durante a fase beta, funcionalidades poderão estar incompletas, em desenvolvimento, temporariamente indisponíveis ou sujeitas a alterações significativas sem aviso prévio. A NEURONTEK não garante a estabilidade ou continuidade de nenhuma funcionalidade específica nesse período.

9.3. O usuário que participa da fase beta declara estar ciente das condições descritas nesta seção e aceita eventuais instabilidades, interrupções ou limitações inerentes a essa fase, sem que isso gere direito a indenização, salvo nos casos de reembolso expressamente previstos nestes Termos.

9.4. A participação na fase beta não garante ao usuário acesso permanente à plataforma ou a qualquer funcionalidade específica após o encerramento dessa fase.

9.5. A NEURONTEK poderá coletar dados de uso e feedback dos usuários beta para fins de melhoria da plataforma, sempre em conformidade com a Política de Privacidade e a LGPD.

9.6. Ao término da fase beta, a plataforma passará ao acesso regular. A NEURONTEK poderá atualizar as condições de uso e os preços praticados, comunicando os usuários pelos canais disponíveis. Alterações que impactem diretamente direitos dos usuários serão comunicadas com antecedência mínima de 15 (quinze) dias, garantindo ao usuário o direito de encerrar sua conta sem ônus caso não concorde com as novas condições.

10. SUSPENSÃO E ENCERRAMENTO DE CONTA

10.1. O usuário pode solicitar o encerramento de sua conta a qualquer momento pelo canal de suporte disponível no aplicativo. O encerramento implica perda imediata de acesso a todos os conteúdos e dados associados à conta. O usuário será informado desta consequência antes da conclusão do encerramento e não terá direito a reembolso pelo período não utilizado, salvo dentro do prazo de 7 dias previsto na legislação brasileira. O encerramento voluntário da conta é irreversível, e os dados serão tratados conforme a Política de Privacidade.

10.2. A NEURONTEK poderá suspender ou encerrar a conta do usuário, com ou sem aviso prévio, nas seguintes hipóteses:
• Violação destes Termos de Uso ou da Política de Privacidade
• Fornecimento de informações falsas, incompletas ou desatualizadas no cadastro
• Uso da plataforma para fins ilícitos ou fraudulentos
• Comportamento abusivo, ofensivo ou que prejudique professores e outros usuários ou o funcionamento da plataforma
• Conduta pública que cause dano comprovado à imagem ou à reputação da NEURONTEK ou do SUPERCLASSE
• Uso de ferramentas automatizadas, bots ou scripts para acessar a plataforma de forma não autorizada
• Tentativa de burlar sistemas de segurança, autenticação ou controle de acesso da plataforma
• Não pagamento de valores devidos, inclusive em casos de estorno ou chargeback não autorizado pela NEURONTEK
• Determinação judicial ou de autoridade competente

10.3. Em casos graves, como fraude comprovada, violação de direitos autorais ou de terceiros, ou conduta que coloque em risco a segurança da plataforma ou de outros usuários, a suspensão ou encerramento poderá ser imediato e sem aviso prévio, sem direito a reembolso, sem prejuízo das demais medidas cabíveis nas esferas civil e criminal.

10.4. A NEURONTEK poderá aplicar suspensão preventiva da conta durante a apuração de qualquer irregularidade grave. Esta suspensão não constitui penalidade definitiva e poderá ser revertida caso a apuração não confirme a infração. Durante a suspensão preventiva, o acesso aos conteúdos da plataforma ficará temporariamente bloqueado até a conclusão da apuração.

11. LIMITAÇÃO DE RESPONSABILIDADE

11.1. A NEURONTEK não se responsabiliza por:
• Conteúdo produzido pelos professores parceiros, incluindo sua veracidade, atualidade, qualidade, adequação legal ou pedagógica. A responsabilidade editorial é exclusiva dos respectivos autores, cabendo à NEURONTEK, quando notificada ou quando identificar irregularidades, adotar as providências cabíveis, incluindo notificação ao professor, exigência de correção, suspensão ou remoção do conteúdo, conforme previsto no Contrato de Prestação de Serviços do Professor
• Resultados educacionais, aprovações em concursos, certificações ou quaisquer outros resultados profissionais obtidos ou não pelo usuário em decorrência do uso da plataforma
• Danos decorrentes de falhas em sistemas, servidores, provedores de internet ou serviços de terceiros fora do controle direto da NEURONTEK
• Danos indiretos, lucros cessantes, perda de oportunidade ou danos consequentes decorrentes do uso ou da impossibilidade de uso da plataforma
• Conteúdo de sites, aplicativos ou serviços de terceiros eventualmente referenciados ou acessados por meio da plataforma
• Danos causados por uso indevido da plataforma pelo próprio usuário ou por terceiros com acesso às suas credenciais
• Eventuais vírus, malwares ou outros elementos prejudiciais introduzidos por terceiros na plataforma, desde que a NEURONTEK tenha adotado as medidas de segurança razoáveis previstas nestes Termos
• Interrupções decorrentes de casos fortuitos ou força maior, incluindo desastres naturais, falhas generalizadas de infraestrutura digital, atos governamentais ou situações fora do controle da NEURONTEK

11.2. A responsabilidade total da NEURONTEK perante o usuário, em qualquer hipótese, fica limitada ao valor efetivamente pago pelo usuário nos 12 (doze) meses anteriores ao evento que deu origem à reclamação, exceto nos casos em que a legislação brasileira vede expressamente tal limitação, especialmente nas relações de consumo regidas pelo CDC.

11.3. A limitação de responsabilidade prevista nesta cláusula não se aplica em casos de dolo ou culpa grave comprovada da NEURONTEK, nem nos casos de violação da LGPD que causem dano ao usuário, situações em que a responsabilidade será apurada nos termos da legislação aplicável.

12. MENORES DE IDADE

12.1. A plataforma SUPERCLASSE é destinada a usuários a partir de 12 anos completos. Ao realizar o cadastro, o usuário declara enquadrar-se em uma das seguintes condições:
• Possui 18 anos ou mais e está plenamente habilitado a contratar e utilizar todos os recursos da plataforma
• Possui entre 12 anos completos e 17 anos e pode utilizar os recursos gratuitos da plataforma; a aquisição de recursos pagos somente é permitida com a participação do responsável legal

12.2. O responsável legal de usuário menor de 18 anos assume corresponsabilidade pelo uso adequado da plataforma pelo menor e pelo cumprimento integral destes Termos, incluindo as obrigações financeiras decorrentes de aquisições realizadas com sua participação.

12.3. Usuários com menos de 12 anos somente poderão realizar cadastro mediante consentimento expresso de pelo menos um dos pais ou responsável legal. Caso identificado cadastro de criança sem essa autorização, a NEURONTEK entrará em contato com o responsável legal para regularização ou, se necessário, procederá ao encerramento da conta e exclusão dos dados, em conformidade com a legislação vigente.

12.4. A NEURONTEK não utiliza dados de usuários menores de 18 anos para fins de publicidade comportamental, perfilamento comercial ou direcionamento de anúncios, em conformidade com as leis. Os dados de menores são tratados exclusivamente para as finalidades necessárias à prestação do serviço educacional, observado sempre o princípio do melhor interesse do menor.

13. ALTERAÇÕES DOS TERMOS

13.1. A NEURONTEK poderá modificar estes Termos a qualquer momento. Alterações significativas que impactem direitos dos usuários serão comunicadas com antecedência mínima de 15 (quinze) dias antes da entrada em vigor, por meio de aviso no aplicativo e/ou e-mail cadastrado. Correções de erros, melhorias técnicas e ajustes que não impactem direitos dos usuários poderão ser realizadas imediatamente, com comunicação posterior.

13.2. A continuidade do uso da plataforma após a vigência das novas condições implica concordância tácita com as alterações. Caso o usuário não concorde, poderá encerrar sua conta sem ônus dentro do prazo de comunicação.

13.3. A versão vigente destes Termos estará sempre disponível no aplicativo e no site da plataforma, com a data de última atualização indicada no cabeçalho do documento. É responsabilidade do usuário verificar periodicamente eventuais atualizações.

13.4. Em caso de alterações decorrentes de exigência legal ou regulatória, a NEURONTEK poderá implementá-las imediatamente, comunicando os usuários no menor prazo possível, sem que isso configure violação destes Termos.

14. FORO E LEI APLICÁVEL

14.1. Estes Termos são regidos exclusivamente pelas leis da República Federativa do Brasil, aplicando-se em especial o Código Civil, o Código de Defesa do Consumidor, o Marco Civil da Internet e a Lei Geral de Proteção de Dados.

14.2. Fica eleito o foro da Comarca de Brasília, Distrito Federal, para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro foro, por mais privilegiado que seja, ressalvadas as hipóteses em que a legislação consumerista determine foro diverso em favor do consumidor.

14.3. Antes de recorrer ao Poder Judiciário, as partes comprometem-se a buscar solução amigável pelo canal de suporte da plataforma, pelo prazo mínimo de 15 (quinze) dias corridos contados da abertura do chamado. O não atingimento de acordo nesse prazo libera qualquer das partes para buscar a via judicial.

14.4. O usuário também poderá registrar reclamações perante os órgãos de defesa do consumidor competentes, sem prejuízo das demais vias disponíveis.

15. CONTATO

15.1. Para dúvidas, solicitações ou reclamações relacionadas a estes Termos de Uso, o usuário pode entrar em contato pelos seguintes canais:
• Suporte ao usuário: canal de suporte disponível dentro do aplicativo
• Questões de privacidade e dados pessoais: privacidade@superclasse.com.br
• Prazo de resposta: até 5 (cinco) dias úteis para suporte ao usuário; até 15 (quinze) dias corridos para questões de privacidade, conforme exigido pela LGPD

15.2. A NEURONTEK compromete-se a responder todas as solicitações dentro dos prazos estabelecidos, adotando postura transparente, acessível e respeitosa em todas as interações com seus usuários.

15.3. A NEURONTEK tem como compromisso resolver todas as questões diretamente com o usuário pelos canais disponíveis. Caso necessário, o usuário também pode registrar reclamações junto ao Procon, à plataforma consumidor.gov.br ou à Autoridade Nacional de Proteção de Dados (ANPD) para questões de privacidade.`

const PRIVACY_POLICY = `POLÍTICA DE PRIVACIDADE
Vigente a partir de 30 de maio de 2026

1. IDENTIFICAÇÃO DO CONTROLADOR

A NEURONTEK SOLUÇÕES EDUCACIONAIS LTDA, inscrita no CNPJ sob o nº 49.275.854/0001-70, com sede no Distrito Federal, operadora da plataforma digital SUPERCLASSE, é a Controladora dos dados pessoais tratados no âmbito desta Política, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).

Esta Política de Privacidade se aplica a todos os usuários da plataforma SUPERCLASSE — alunos, professores e visitantes — e descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos seus dados pessoais, em conformidade com a LGPD, o Marco Civil da Internet (Lei nº 12.965/2014) e as diretrizes da Google Play Store.

Ao criar uma conta ou utilizar os serviços da plataforma SUPERCLASSE, o usuário declara ter lido, compreendido e concordado com os termos desta Política de Privacidade.

2. DADOS PESSOAIS COLETADOS

2.1. A NEURONTEK coleta os seguintes dados pessoais, conforme o perfil do usuário:

a) Dados fornecidos diretamente pelo usuário:
• Nome completo
• Endereço de e-mail
• CPF (Cadastro de Pessoa Física) — solicitado ao aluno no momento da aquisição de recursos pagos
• Data de nascimento
• Número de telefone
• Foto de perfil (opcional)
• Senha de acesso (armazenada de forma criptografada — nunca em texto simples)
• Mensagens enviadas via suporte, chat interno ou formulários
• Dados profissionais e acadêmicos informados voluntariamente

b) Dados coletados automaticamente:
• Endereço IP e identificadores de dispositivo
• Tipo de navegador, sistema operacional e modelo do dispositivo
• Data, hora e duração dos acessos
• Páginas e conteúdos acessados dentro da plataforma
• Progresso nos cursos e interações com o conteúdo
• Localização aproximada (baseada em IP — não coletamos localização GPS)
• Dados de desempenho e análise de uso da plataforma

c) Dados recebidos de terceiros:
• Dados de transação fornecidos pelo gateway de pagamento Pagar.me

2.2. A NEURONTEK NÃO coleta dados pessoais sensíveis, tais como dados de saúde, origem racial ou étnica, convicções religiosas, opiniões políticas, dados genéticos ou biométricos, salvo se expressamente informado em situação específica com consentimento prévio do titular.

2.3. A NEURONTEK não armazena diretamente dados de cartão de crédito, número de conta bancária completo ou senhas de internet banking. Esses dados são processados exclusivamente pelo gateway de pagamento Pagar.me, em ambiente seguro e certificado.

3. FINALIDADE DO TRATAMENTO

3.1. Os dados pessoais coletados são utilizados exclusivamente para as seguintes finalidades:
• Criação, autenticação e gestão de contas de usuários na plataforma
• Disponibilização de acesso a cursos, conteúdos e demais recursos da plataforma
• Processamento de pagamentos e repasses financeiros a professores
• Comunicações operacionais relacionadas à conta, compras, atualizações e suporte
• Cumprimento de obrigações legais, fiscais e regulatórias
• Prevenção a fraudes, garantia de segurança e autenticidade das transações
• Análise de desempenho e melhoria contínua dos serviços
• Envio de comunicações e notificações sobre novidades, cursos e promoções — sujeito à opção do usuário

3.2. Os dados NÃO serão utilizados para fins de publicidade comportamental, perfilamento comercial ou direcionamento de anúncios a menores de 18 anos, em conformidade com o ECA Digital e a LGPD.

3.3. A NEURONTEK não realiza, nesta versão da plataforma, tomada de decisão automatizada que produza efeitos jurídicos ou impactos significativos ao usuário. Caso essa funcionalidade venha a ser implementada em versões futuras, esta Política será atualizada e o usuário será notificado.

4. BASE LEGAL DO TRATAMENTO

4.1. O tratamento de dados pela NEURONTEK fundamenta-se nas seguintes hipóteses legais previstas nos arts. 7º e 11 da LGPD:
• Execução de contrato ou de procedimentos preliminares relacionados a contrato do qual o titular seja parte (art. 7º, V) — base principal para o acesso à plataforma e processamento de pagamentos
• Cumprimento de obrigação legal ou regulatória pelo controlador (art. 7º, II) — base para retenção de dados fiscais e obrigações legais
• Exercício regular de direitos em processo judicial, administrativo ou arbitral (art. 7º, VI) — base para manutenção de registros em caso de litígio
• Legítimo interesse do controlador (art. 7º, IX) — base para análise de uso, segurança e melhoria da plataforma, observados os limites da lei
• Consentimento do titular (art. 7º, I) — base para envio de comunicações promocionais e marketing, sempre com opção de revogação

4.2. Para usuários menores de 18 anos, o tratamento de dados observa sempre o princípio do melhor interesse do menor, em conformidade com a LGPD, o ECA e o ECA Digital. Para usuários com menos de 12 anos, o tratamento baseia-se adicionalmente no consentimento expresso do responsável legal, nos termos do art. 14 da LGPD.

5. COMPARTILHAMENTO E TRANSFERÊNCIA DE DADOS

5.1. A NEURONTEK não vende, aluga ou cede dados pessoais de seus usuários a terceiros para fins comerciais. O compartilhamento de dados ocorre exclusivamente nas seguintes hipóteses e com as seguintes categorias de destinatários:

a) Provedores de infraestrutura tecnológica:
• Supabase — banco de dados e autenticação, com servidores que seguem padrões internacionais de segurança (ISO 27001)
• Google Firebase / Google Cloud — armazenamento, analytics e notificações

b) Processadores de pagamento:
• Pagar.me — processamento de pagamentos e repasses financeiros a professores

c) Professores cadastrados na plataforma:
• Professores parceiros — dados mínimos necessários para viabilizar a relação entre professor e aluno no contexto do curso adquirido, como nome do aluno e progresso no curso, compartilhados exclusivamente para fins de suporte e acompanhamento.

d) Autoridades públicas:
• Quando exigido por lei, ordem judicial, decisão administrativa ou regulatória

5.2. Os dados poderão ser armazenados e processados em servidores localizados no Brasil ou no exterior (especialmente nos Estados Unidos e na Europa, onde os provedores de infraestrutura mencionados operam). Nesses casos, a NEURONTEK adota salvaguardas contratuais adequadas para garantir nível de proteção equivalente ao exigido pela LGPD, incluindo cláusulas contratuais padrão com os fornecedores.

5.3. Em caso de fusão, aquisição ou reestruturação societária da NEURONTEK, os dados poderão ser transferidos à entidade sucessora, que ficará vinculada a esta Política de Privacidade. O usuário será notificado previamente sobre qualquer transferência dessa natureza.

6. ARMAZENAMENTO, SEGURANÇA E RETENÇÃO

6.1. Os dados pessoais são armazenados em servidores com criptografia em trânsito (protocolo TLS/HTTPS) e em repouso. São adotadas medidas técnicas e organizacionais para prevenir acessos não autorizados, perdas, alterações ou vazamentos, incluindo controles de acesso, autenticação e monitoramento contínuo.

6.2. Os dados são mantidos pelo tempo necessário ao cumprimento das finalidades descritas nesta Política, observados os seguintes critérios de retenção:
• Dados de conta ativa: mantidos durante toda a vigência da conta do usuário na plataforma
• Dados de transações financeiras: mantidos por no mínimo 5 (cinco) anos, conforme exigência fiscal e contábil
• Registros de acesso (logs): mantidos por no mínimo 6 (seis) meses, conforme art. 15 do Marco Civil da Internet
• Dados para defesa em litígios: mantidos pelo prazo prescricional aplicável, que pode ser de até 5 (cinco) anos
• Dados de conta encerrada: anonimizados ou excluídos em até 90 (noventa) dias após o encerramento, salvo obrigação legal de retenção

6.3. Após o término do prazo de retenção aplicável, os dados serão anonimizados — de forma que não seja mais possível identificar o titular — ou excluídos de forma segura, com métodos que impeçam recuperação.

6.4. Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares (como vazamento de dados), a NEURONTEK adotará as seguintes medidas:
• Contenção imediata do incidente e avaliação do impacto
• Comunicação à Autoridade Nacional de Proteção de Dados (ANPD) no prazo de até 72 (setenta e duas) horas após a confirmação do incidente, conforme exigido pela LGPD
• Notificação aos titulares afetados no menor prazo possível, com descrição da natureza dos dados comprometidos, riscos envolvidos e medidas adotadas
• Registro interno do incidente e das providências tomadas

7. MENORES DE IDADE — PROTEÇÃO ESPECIAL

Esta seção é especialmente importante. Leia com atenção se você é menor de 18 anos ou responsável legal por um menor.

7.1. A plataforma SUPERCLASSE aceita usuários a partir de 12 (doze) anos de idade, em razão do público que se prepara para processos seletivos de colégios de ensino fundamental e médio, incluindo colégios militares e institutos federais.

7.2. Para usuários entre 12 e 17 anos (adolescentes), é obrigatório o consentimento expresso do responsável legal para criação de conta e utilização da plataforma. Ao realizar o cadastro, o adolescente declara possuir essa autorização, e o responsável legal poderá ser solicitado a confirmá-la a qualquer momento. O responsável legal responde solidariamente pelos atos praticados pelo menor na plataforma, nos termos da legislação civil vigente.

7.3. A NEURONTEK NÃO aceita cadastros de crianças menores de 12 anos e não coleta intencionalmente dados pessoais desse grupo, em conformidade com o art. 14 da Lei nº 13.709/2018 (LGPD) e o art. 14 da Lei nº 12.965/2014 (Marco Civil da Internet), que vedam a coleta de dados de menores sem o consentimento expresso dos responsáveis legais. Caso seja identificado cadastro de criança com menos de 12 anos, a conta será imediatamente encerrada e os dados excluídos.

7.4. Para usuários menores de 18 anos, a NEURONTEK adota as seguintes salvaguardas adicionais:
• Coleta apenas dos dados estritamente necessários para a prestação do serviço educacional;
• Vedação ao uso de dados de menores para fins de publicidade comportamental;
• Vedação ao compartilhamento de dados de menores com terceiros para fins de marketing;
• Tratamento dos dados sempre orientado pelo princípio do melhor interesse do menor, nos termos do art. 14 da LGPD e do Estatuto da Criança e do Adolescente (ECA).

7.5. O responsável legal pode, a qualquer momento, solicitar acesso, correção ou exclusão dos dados do menor sob sua responsabilidade, pelo canal de contato indicado na Seção 11.

8. DIREITOS DO TITULAR DOS DADOS

8.1. Nos termos dos arts. 17 a 22 da Lei nº 13.709/2018 (LGPD), o titular dos dados pessoais tem os seguintes direitos, que podem ser exercidos a qualquer momento:
• Confirmação da existência de tratamento de seus dados pessoais;
• Acesso aos dados pessoais tratados pela NEURONTEK;
• Correção de dados incompletos, inexatos ou desatualizados;
• Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;
• Portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa;
• Eliminação dos dados pessoais tratados com base no consentimento, exceto nas hipóteses de conservação legalmente previstas;
• Informação sobre as entidades públicas e privadas com as quais a NEURONTEK realiza uso compartilhado de dados;
• Revogação do consentimento, a qualquer momento, sem prejuízo da licitude do tratamento realizado anteriormente;
• Oposição ao tratamento realizado em desconformidade com a lei;
• Revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais que afetem seus interesses, inclusive as utilizadas para definição de perfis pessoais, profissionais, de consumo e de crédito, nos termos do art. 20 da LGPD.

8.2. Para exercer qualquer dos direitos listados, o titular deverá entrar em contato com o Encarregado de Proteção de Dados (DPO) pelo e-mail privacidade@superclasse.com.br. As solicitações serão respondidas no prazo máximo de 15 (quinze) dias úteis, em conformidade com as boas práticas recomendadas pela Autoridade Nacional de Proteção de Dados (ANPD).

8.3. Para garantir a segurança, a NEURONTEK poderá solicitar a verificação de identidade do titular antes de atender à solicitação, sendo vedada a cobrança de qualquer valor pelo exercício desses direitos.

9. COOKIES E TECNOLOGIAS DE RASTREAMENTO

9.1. A plataforma SUPERCLASSE utiliza cookies e tecnologias similares para as seguintes finalidades:
• Autenticação e manutenção da sessão do usuário (essenciais);
• Memorização de preferências e configurações (funcionais);
• Análise de desempenho e uso da plataforma — analytics (analíticos);
• Segurança e prevenção a fraudes (essenciais).

9.2. A SUPERCLASSE disponibiliza um mecanismo de gestão de consentimento que permite ao usuário aceitar, recusar ou personalizar o uso de cookies não essenciais no momento do primeiro acesso e a qualquer tempo nas configurações da plataforma. Cookies estritamente essenciais à operação do serviço não podem ser desativados, pois são necessários para o funcionamento básico da plataforma.

9.3. As principais ferramentas de analytics utilizadas são Google Firebase Analytics e tecnologias equivalentes integradas à infraestrutura da plataforma. Algumas dessas ferramentas são operadas por terceiros, como o Google LLC, que possuem suas próprias políticas de privacidade, acessíveis diretamente nos sites dos respectivos fornecedores. A NEURONTEK não controla o tratamento de dados realizado por esses terceiros em seus próprios sistemas e recomenda a leitura das respectivas políticas.

9.4. O usuário pode, a qualquer momento, configurar seu dispositivo ou navegador para bloquear ou limitar o uso de cookies, ciente de que algumas funcionalidades da plataforma poderão ser afetadas em razão dessa configuração.

10. ALTERAÇÕES DESTA POLÍTICA

10.1. Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças nos serviços, na legislação ou nas práticas de tratamento de dados.

10.2. Em caso de alterações relevantes, a NEURONTEK notificará os usuários com antecedência mínima de 15 (quinze) dias, por meio de aviso no aplicativo e/ou e-mail cadastrado, antes da entrada em vigor das novas condições.

10.3. A versão vigente desta Política estará sempre disponível no aplicativo e no site da plataforma, com a data de última atualização indicada no cabeçalho do documento.

10.4. A continuidade do uso da plataforma após a vigência das novas condições implica concordância com as alterações. Para alterações que impliquem redução de direitos do usuário ou novas hipóteses de tratamento de dados pessoais, a NEURONTEK solicitará novo consentimento expresso do usuário antes da entrada em vigor das mudanças. Caso o usuário não concorde com as alterações, poderá encerrar sua conta sem ônus, mediante solicitação pelo canal indicado na Seção 11.

11. ENCARREGADO DE PROTEÇÃO DE DADOS (DPO) E CONTATO

11.1. A NEURONTEK designou um Encarregado de Proteção de Dados (DPO), responsável por receber comunicações dos titulares, orientar sobre o tratamento de dados e atuar como canal de comunicação com a Autoridade Nacional de Proteção de Dados (ANPD), conforme exigido pelo art. 41 da LGPD.

E-mail do DPO: privacidade@superclasse.com.br. Prazo de resposta: até 15 (quinze) dias úteis contados do recebimento da solicitação. As solicitações recebidas fora do horário comercial serão respondidas no próximo dia útil, respeitado o prazo estabelecido.

11.2. Para questões de suporte técnico geral não relacionadas à privacidade de dados, o usuário deve utilizar os canais de suporte disponíveis dentro do aplicativo.

11.3. O titular que considerar que o tratamento de seus dados viola a LGPD poderá apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD), por meio do portal gov.br/anpd, sem prejuízo de outros meios legais disponíveis.`
