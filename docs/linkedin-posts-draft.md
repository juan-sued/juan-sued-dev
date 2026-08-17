# Rascunhos de post para LinkedIn

Textos prontos pra revisar e postar manualmente. Nenhuma empresa é nomeada — todos os detalhes de
negócio (fraude, regras específicas, nomes de sistema) foram generalizados, mesmo padrão usado nos
estudos de caso do portfólio. Ajuste o tom/tamanho como preferir antes de publicar.

---

## 1. A condição de corrida (debugging story)

Sexta-feira, sistema em produção, um comportamento estranho: um item de pedido aparecia como "não
encontrado" ao mesmo tempo que tinha uma pendência de aprovação de preço ativa — dois estados que não
deveriam coexistir.

O motivo: dois eventos quase simultâneos escrevendo no mesmo registro. Um marcava o item como ruptura,
o outro criava a pendência de preço para um produto substituto. Dependendo da ordem de chegada, um
sobrescrevia o outro sem desativar a pendência.

A correção não ficou só no backend. Descobri que o cliente tinha uma fila de sincronização offline-first
que, ao bater nesse estado inconsistente, entrava em retry infinito — porque nunca esperava um erro
"terminal", só falhas de rede. Corrigi em três frentes: proteção contra a sobrescrita no backend,
tratamento de erro terminal na fila (pra não travar retry), e blindagem da tela que dependia desse estado.

O aprendizado que fica: em sistemas distribuídos, proteger a escrita não é suficiente se quem consome o
dado não sabe lidar com um estado que "não deveria existir". Fila offline-first sem tratamento de erro
terminal é bug esperando pra acontecer.

Aberto a conversas sobre arquitetura de sistemas distribuídos e fluxos críticos. 🚀

#backend #arquiteturadesoftware #distributedsystems #debugging

---

## 2. Chat em tempo real

Um dos recursos que mais gostei de construir recentemente: um canal de chat em tempo real entre duas
pontas de um fluxo de pedido — sem expor telefone pessoal, sem depender de WhatsApp ou apps de terceiros.

Decisões que fizeram diferença:

- Canal criado só quando necessário (durante o pedido ativo) e desativado depois — reduz superfície de
  moderação sem precisar de ferramenta extra.
- Canais e tokens gerenciados via gRPC no backend, replicados em dois apps diferentes (cliente e
  operação), com suporte de webhook para eventos externos.
- Detalhes que só aparecem em produção: mensagens rápidas pra reduzir fricção, identificação clara de
  remetente, e ajuste de teclado no iOS (clássico).

O trade-off é real: mais um sistema em tempo real pra manter e monitorar. Mas o retorno em menos ligação
de suporte e menos retrabalho compensou.

Gosto de projetos que misturam tempo real, mobile e decisão de produto — se você trabalha com isso ou
quer trocar ideia, bora conversar.

#realtime #grpc #mobiledev #reactnative

---

## 3. Leitura de preço por câmera (OCR)

Cadastrar produto e preço manualmente em campo é lento e sujeito a erro de digitação. A solução: escanear
o preço com a câmera do celular e extrair o texto via OCR, direto no dispositivo.

O que aprendi construindo isso:

- OCR não é 100% confiável em má iluminação — e tudo bem. O que importa é que a entrada manual continue
  rápida e acessível, não só existir como "plano B" esquecido.
- Compressão e conversão de imagem pra WEBP reduziram bastante o tamanho de upload sem perder legibilidade
  do texto capturado.
- Processar frame a frame da câmera com estados de carregamento/falha bem tratados faz toda a diferença
  na percepção de "app travado" vs "app processando".

A conclusão que levo pra qualquer automação de captura: só compensa quando o caminho de correção manual é
tão rápido quanto o automático. Automação que obriga o usuário a "voltar pro início" quando falha é pior
que não ter automação nenhuma.

#mobiledev #computervision #reactnative #ocr

---

## Bônus: post de "aberto a oportunidades"

Não pedido, mas como a ideia é manter a conta ativa pra recrutadores — pode ser útil dado o momento atual.
Ajuste livremente ou pule se preferir não usar.

Estou aberto a novas oportunidades como desenvolvedor Full Stack Web & Mobile 🚀

Nos últimos anos venho trabalhando entre produto, frontend, backend, dados, geolocalização e sistemas em
tempo real — React, React Native, TypeScript, Node.js/NestJS, PostgreSQL e afins.

Gosto de problemas que misturam decisão técnica com decisão de produto: máquinas de estado para fluxos
críticos, offline-first pra operação em campo, tempo real pra reduzir fricção entre pessoas.

Portfólio com estudos de caso técnicos: [link do seu site]

Se você está contratando ou conhece alguém contratando, bora conversar. Comentário, mensagem ou
compartilhamento — tudo ajuda. 🙏

#opentowork #fullstack #react #reactnative #nodejs
