export type Locale = "pt" | "en";
export type Copy = Record<Locale, string>;
export const text = (value: Copy, locale: Locale) => value[locale];
export const profile = {
  name: "Juan Sued",
  role: {
    pt: "Desenvolvedor Full Stack Web & Mobile",
    en: "Full Stack Web & Mobile Developer",
  },
  intro: {
    pt: "Construo aplicações Web e Mobile com React, React Native, TypeScript e NestJS, atuando entre produto, frontend, backend, dados, geolocalização e sistemas em tempo real.",
    en: "I build web and mobile applications with React, React Native, TypeScript and NestJS, working across product, frontend, backend, data, geolocation and real-time systems.",
  },
  location: { pt: "Rio de Janeiro, Brasil", en: "Rio de Janeiro, Brazil" },
  links: {
    bikerway: "https://bikerway.com.br/",
    eventHorizon: "https://event-horizon-by-juan-sued.vercel.app/",
    linkedin: "https://www.linkedin.com/in/juan-sued/",
    github: "https://github.com/juan-sued",
    email: "mailto:juansued19@gmail.com",
  },
};
export const experiences = [
  {
    company: "MARKTS",
    role: {
      pt: "Desenvolvedor Full Stack Web & Mobile",
      en: "Full Stack Web & Mobile Developer",
    },
    period: { pt: "Junho de 2025 - Agosto de 2026", en: "June 2025 - August 2026" },
    points: {
      pt: [
        "Web, Android e iOS com React, React Native, TypeScript, NestJS, gRPC e Socket.IO, integrados a múltiplos microserviços.",
        "Fluxo de aprovação de divergência de preço com notificação em tempo real, timeout automático e auditoria.",
        "Indexação geoespacial (H3) para mapas operacionais e classificação de risco por área.",
        "Captura offline-first com fila local, scanner de código de barras e leitura de preço por OCR.",
        "Chat em tempo real entre app e operação via gRPC, com moderação para o time de suporte.",
      ],
      en: [
        "Web, Android and iOS with React, React Native, TypeScript, NestJS, gRPC and Socket.IO, integrated with multiple microservices.",
        "Price-divergence approval flow with real-time notifications, automatic timeout and audit trail.",
        "Geospatial indexing (H3) for operational heatmaps and area-based risk classification.",
        "Offline-first capture with a local queue, barcode scanning and OCR price reading.",
        "Real-time chat between app and operations via gRPC, with moderation for the support team.",
      ],
    },
  },
  {
    company: "SALB - Indústria Cerealista",
    role: { pt: "Desenvolvedor Full Stack", en: "Full Stack Developer" },
    period: {
      pt: "Dezembro de 2024 - Maio de 2025",
      en: "December 2024 - May 2025",
    },
    points: {
      pt: [
        "Site institucional e catálogo de produtos.",
        "QR Codes em produtos, estoque, etiquetas e integrações de cadastro.",
        "Integração com roteirização de entregas usando Next.js, TypeScript, Prisma e PostgreSQL.",
      ],
      en: [
        "Institutional website and product catalog.",
        "Product QR codes, inventory, labels and product-record integrations.",
        "Delivery-routing integration using Next.js, TypeScript, Prisma and PostgreSQL.",
      ],
    },
  },
  {
    company: "Lumis",
    role: { pt: "Desenvolvedor Web/Java", en: "Web/Java Developer" },
    period: {
      pt: "Junho de 2022 - Dezembro de 2023",
      en: "June 2022 - December 2023",
    },
    points: {
      pt: [
        "Desenvolvimento e sustentação de portais corporativos.",
        "Java, LumisXP, Hibernate, JavaScript, HTML, CSS e XSL.",
        "Componentes, formulários, integrações e regras de negócio para equipes multidisciplinares.",
      ],
      en: [
        "Development and maintenance of corporate portals.",
        "Java, LumisXP, Hibernate, JavaScript, HTML, CSS and XSL.",
        "Components, forms, integrations and business rules with multidisciplinary teams.",
      ],
    },
  },
  {
    company: "Event Horizon",
    role: {
      pt: "Desenvolvedor Full Stack Freelancer e Fundador",
      en: "Freelance Full Stack Developer and Founder",
    },
    period: {
      pt: "Desde 2018, em paralelo",
      en: "Since 2018, alongside other work",
    },
    points: {
      pt: [
        "Projetos independentes: sites, landing pages e sistemas personalizados.",
        "Levantamento de requisitos, frontend, backend, integrações, deploy e suporte pós-entrega.",
      ],
      en: [
        "Independent projects: websites, landing pages and custom systems.",
        "Requirements discovery, frontend, backend, integrations, deployment and post-delivery support.",
      ],
    },
  },
];
export const cases = [
  {
    slug: "h3",
    title: {
      pt: "Mapas operacionais com H3",
      en: "Operational maps with H3",
    },
    tag: "H3 / Mapas",
    summary: {
      pt: "Agrupamento regional com detalhes sob demanda.",
      en: "Regional aggregation with on-demand detail.",
    },
    decision: { pt: "Agregados por resolução, detalhes sob demanda.", en: "Multi-resolution aggregates with on-demand detail." },
    stack: "H3 · deck.gl · Google Maps · NestJS · Prisma · gRPC",
    sections: {
      pt: [
        [
          "Contexto",
          "Dados operacionais precisam virar leitura espacial sem expor informações sensíveis.",
        ],
        [
          "Decisão",
          "H3 para agrupamentos em diferentes resoluções; dados agregados no carregamento inicial e detalhes consultados sob demanda.",
        ],
        [
          "Implementação",
          "React, deck.gl e Google Maps no cliente; NestJS, Prisma e gRPC no domínio, com endpoints dedicados para contagem por área e classificação de risco, substituindo um módulo de mapas anterior.",
        ],
        [
          "Trade-off",
          "Visão regional rápida não substitui análise de entidade individual.",
        ],
        [
          "Aprendizado",
          "Separar panorama e detalhe preserva performance e clareza — mapas de risco por resolução ajudam times de operação a agir antes que um problema pontual vire padrão.",
        ],
      ],
      en: [
        [
          "Context",
          "Operational data must become spatial insight without exposing sensitive information.",
        ],
        [
          "Decision",
          "H3 for multi-resolution grouping; aggregated data first and details on demand.",
        ],
        [
          "Implementation",
          "React, deck.gl and Google Maps on client; NestJS, Prisma and gRPC in domain, with dedicated endpoints for area counts and risk classification, replacing an earlier mapping module.",
        ],
        [
          "Trade-off",
          "Fast regional view does not replace per-entity analysis.",
        ],
        [
          "Learning",
          "Separating overview from detail preserves performance and clarity — risk maps by resolution help operations teams act before an isolated issue becomes a pattern.",
        ],
      ],
    },
  },
  {
    slug: "estado",
    title: { pt: "Fluxos distribuídos e máquina de estados", en: "Distributed flows and state machines" },
    tag: "Máquina de estados",
    summary: {
      pt: "Cliente, operação e backoffice sincronizados por estados explícitos.",
      en: "Customer, operations and back office aligned by explicit states.",
    },
    decision: { pt: "Estados explícitos previnem duplicidade e inconsistência.", en: "Explicit states prevent duplicates and inconsistency." },
    stack: "React Native · NestJS · Socket.IO · Prisma · notificações · APIs REST",
    sections: {
      pt: [
        [
          "Contexto",
          "Uma exceção durante execução exige decisão, confirmação física, auditoria e atualização em tempo real.",
        ],
        [
          "Decisão",
          "Máquina de estados explícita, prevenção de solicitações duplicadas e tratamento de eventos antigos.",
        ],
        [
          "Implementação",
          "Eventos atualizam participantes; transições válidas protegem consistência. Um job de expiração fecha pendências sem decisão em até 10 minutos, notificando por push e WhatsApp.",
        ],
        [
          "Trade-off",
          "Mais modelagem inicial em troca de fluxos críticos previsíveis.",
        ],
        [
          "Aprendizado",
          "Estado explícito transforma exceções em caminhos auditáveis. Uma condição de corrida real — dois eventos quase simultâneos sobrescrevendo o mesmo registro — mostrou que proteger a transição no backend não basta: a fila offline-first do cliente também precisa tratar erro terminal, ou trava em retry infinito.",
        ],
      ],
      en: [
        [
          "Context",
          "An exception during execution requires a decision, physical confirmation, audit trail and real-time update.",
        ],
        [
          "Decision",
          "Explicit state machine, duplicate request prevention and stale-event handling.",
        ],
        [
          "Implementation",
          "Events update participants; valid transitions protect consistency. An expiration job closes undecided pendencies within 10 minutes, notifying by push and WhatsApp.",
        ],
        [
          "Trade-off",
          "More upfront modeling in exchange for predictable critical flows.",
        ],
        ["Learning", "Explicit state turns exceptions into auditable paths. A real race condition — two near-simultaneous events overwriting the same record — showed that protecting the transition on the backend isn't enough: the client's offline-first queue also needs to handle terminal errors, or it gets stuck retrying forever."],
      ],
    },
  },
  {
    slug: "offline",
    title: { pt: "Offline-first e captura de EAN", en: "Offline-first and EAN capture" },
    tag: "Offline-first",
    summary: {
      pt: "Fila local, validação de EAN e sincronização posterior.",
      en: "Local queue, EAN validation and later synchronization.",
    },
    decision: { pt: "Validação local e fila persistida antes da sincronização.", en: "Local validation and persistent queue before synchronization." },
    stack: "React Native · BullMQ · Redis · Socket.IO · câmera · armazenamento local",
    sections: {
      pt: [
        ["Contexto", "Operação móvel não pode parar quando sinal falha."],
        [
          "Decisão",
          "Validar EAN-8/EAN-13 localmente, evitar duplicidade e persistir fila no dispositivo.",
        ],
        [
          "Implementação",
          "React Native, câmera, retry, Redis, BullMQ e Socket.IO.",
        ],
        [
          "Trade-off",
          "Sincronização posterior exige feedback claro sobre estado local.",
        ],
        ["Aprendizado", "Offline-first é desenho de produto e arquitetura."],
      ],
      en: [
        ["Context", "Mobile work cannot stop when signal fails."],
        [
          "Decision",
          "Validate EAN-8/EAN-13 locally, prevent duplicates and persist a device queue.",
        ],
        [
          "Implementation",
          "React Native, camera, retry, Redis, BullMQ and Socket.IO.",
        ],
        [
          "Trade-off",
          "Later synchronization requires clear feedback about local state.",
        ],
        ["Learning", "Offline-first is product and architecture design."],
      ],
    },
  },
  {
    slug: "localizacao",
    title: { pt: "Localização mobile resiliente", en: "Resilient mobile location" },
    tag: "Localização mobile",
    summary: {
      pt: "Permissões, fallback e recuperação fazem parte do fluxo.",
      en: "Permissions, fallback and recovery belong in flow.",
    },
    decision: { pt: "Permissões, fallback e recuperação fazem parte do fluxo.", en: "Permissions, fallback and recovery belong in the flow." },
    stack: "React Native · Google Maps · APIs de geolocalização · permissões Android e iOS · Socket.IO · tratamento de falhas",
    sections: {
      pt: [
        ["Contexto", "GPS, permissão, rede e timeout podem falhar em campo."],
        [
          "Decisão",
          "Modelar permissões foreground/background, retry, fallback e recuperação orientada ao usuário.",
        ],
        [
          "Implementação",
          "Atualização de posição, mapas e rotas com estados comunicáveis.",
        ],
        [
          "Trade-off",
          "Mais cenários e testes para evitar bloqueio silencioso.",
        ],
        ["Aprendizado", "Experiência de recuperação é parte da arquitetura."],
      ],
      en: [
        [
          "Context",
          "GPS, permissions, network and timeout can fail in the field.",
        ],
        [
          "Decision",
          "Model foreground/background permissions, retry, fallback and user-guided recovery.",
        ],
        [
          "Implementation",
          "Position updates, maps and routes with communicable states.",
        ],
        ["Trade-off", "More scenarios and tests prevent silent blocking."],
        ["Learning", "Recovery experience is architecture."],
      ],
    },
  },
  {
    slug: "chat",
    title: { pt: "Chat em tempo real entre app e operação", en: "Real-time chat between app and operations" },
    tag: "Tempo real",
    summary: {
      pt: "Canal de mensagens ao vivo entre as duas pontas de um pedido, com visibilidade para o time de suporte.",
      en: "Live messaging channel between the two sides of an order, visible to the support team.",
    },
    decision: { pt: "Canais e tokens gerenciados via gRPC, com webhook para eventos externos.", en: "Channels and tokens managed via gRPC, with webhook support for external events." },
    stack: "gRPC · WebSocket · React Native · React · Webhooks",
    sections: {
      pt: [
        ["Contexto", "As duas pontas de um pedido precisavam trocar mensagens durante a entrega, sem expor telefone pessoal nem depender de um app de terceiros."],
        ["Decisão", "Canal de chat dedicado por pedido, criado só quando necessário e visível ao suporte para mediação; desativado fora da janela de entrega."],
        ["Implementação", "gRPC para gerenciar canais e tokens no backend; interface replicada nos dois apps com identificação de remetente, mensagens rápidas e ajuste de teclado no iOS."],
        ["Trade-off", "Mais um sistema em tempo real para manter e monitorar, em troca de menos ligações e retrabalho de suporte."],
        ["Aprendizado", "Restringir quando o canal existe — só durante pedidos ativos — evita boa parte dos problemas de moderação antes que precisem de solução técnica."],
      ],
      en: [
        ["Context", "The two sides of an order needed to exchange messages during delivery, without exposing personal phone numbers or relying on a third-party app."],
        ["Decision", "A dedicated chat channel per order, created only when needed and visible to support for mediation; deactivated outside the delivery window."],
        ["Implementation", "gRPC to manage channels and tokens on the backend; the interface was replicated across both apps with sender identification, quick replies and iOS keyboard handling."],
        ["Trade-off", "One more real-time system to maintain and monitor, in exchange for fewer support calls and less rework."],
        ["Learning", "Restricting when the channel exists — only during active orders — prevents most moderation problems before they need a technical fix."],
      ],
    },
  },
  {
    slug: "ocr",
    title: { pt: "Leitura de preços por câmera com OCR", en: "Camera-based price reading with OCR" },
    tag: "OCR / Visão computacional",
    summary: {
      pt: "Leitura de preço e produto direto da câmera para agilizar o cadastro em campo.",
      en: "Reading price and product straight from the camera to speed up field registration.",
    },
    decision: { pt: "OCR por frame no dispositivo, com compressão de imagem antes do envio.", en: "On-device per-frame OCR, with image compression before upload." },
    stack: "React Native · OCR · WEBP · Câmera nativa",
    sections: {
      pt: [
        ["Contexto", "Cadastrar produto e preço manualmente em campo é lento e sujeito a erro de digitação."],
        ["Decisão", "Escanear o preço com a câmera e extrair texto por OCR, com fallback para digitação manual quando o reconhecimento falha."],
        ["Implementação", "Hook dedicado processa frames da câmera e trata estados de carregamento e falha; compressão e conversão para WEBP reduzem o tamanho do upload sem perder legibilidade."],
        ["Trade-off", "OCR não é 100% confiável em má iluminação — a entrada manual precisa continuar rápida e acessível, não só existir como plano B."],
        ["Aprendizado", "Automação de captura só compensa quando o caminho de correção manual é tão rápido quanto o automático."],
      ],
      en: [
        ["Context", "Manually registering product and price in the field is slow and error-prone."],
        ["Decision", "Scan the price with the camera and extract text via OCR, falling back to manual entry when recognition fails."],
        ["Implementation", "A dedicated hook processes camera frames and handles loading/failure states; image compression and a switch to WEBP cut upload size without losing legibility."],
        ["Trade-off", "OCR isn't fully reliable in poor lighting — manual entry needs to stay fast and accessible, not just exist as a fallback."],
        ["Learning", "Capture automation only pays off when the manual correction path is as fast as the automated one."],
      ],
    },
  },
];
export const skills = [
  [
    "Frontend & Mobile",
    "React, React Native, Next.js, TypeScript, Tailwind CSS",
  ],
  ["Backend", "Node.js, NestJS, REST, gRPC, Socket.IO, BullMQ"],
  ["Dados", "PostgreSQL, SQL Server, Prisma, Supabase, Redis"],
  ["Geolocalização", "PostGIS, H3, deck.gl, Google Maps, Google Places"],
  [
    "Qualidade & Entrega",
    "Git, Docker, GitHub Actions, Jest, Cypress, Vercel, Sentry",
  ],
];

export const education = [
  {
    institution: "Universidade Estácio",
    degree: { pt: "Bacharelado em Ciência da Computação", en: "BSc in Computer Science" },
    detail: { pt: "Fevereiro de 2025 - Fevereiro de 2028, previsão.", en: "February 2025 - February 2028, expected." },
  },
  {
    institution: "Driven Education",
    degree: { pt: "Desenvolvimento de Software - Formação Intensiva", en: "Software Development - Intensive Program" },
    detail: { pt: "1.200+ horas e 25+ projetos.", en: "1,200+ hours and 25+ projects." },
  },
];
