/**
 * Static/institutional page content (About, Careers, Blog, Press, Partners,
 * Help, Contact, Plans, FAQ, Terms, Privacy, Cookies, DMCA), in PT and EN.
 *
 * These used to render an empty <section> for every one of these routes.
 * Content lives here (not in lib/lang.tsx's Translations interface) because
 * it's long-form prose specific to each page, not short UI strings reused
 * across components — keeping it separate avoids bloating the main
 * translations object and the client bundle for pages that don't need it.
 */

export type StaticPageSlug =
  | "about"
  | "careers"
  | "blog"
  | "press"
  | "partners"
  | "help"
  | "contact"
  | "plans"
  | "faq"
  | "terms"
  | "privacy"
  | "cookies"
  | "dmca";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StaticPageContent {
  title: string;
  subtitle?: string;
  /** Rendered as paragraphs/sections in order. */
  sections?: { heading?: string; body: string[] }[];
  faqs?: FaqItem[];
  /** Contact-specific structured info. */
  contactChannels?: { label: string; value: string; href?: string }[];
  lastUpdated?: string;
}

type Lang = "pt" | "en";

const pt: Record<StaticPageSlug, StaticPageContent> = {
  about: {
    title: "Sobre a LiveSports",
    subtitle: "A casa do desporto ao vivo, para os adeptos que não querem perder nada.",
    sections: [
      {
        body: [
          "A LiveSports nasceu com um objetivo simples: tornar mais fácil acompanhar os jogos que importam, onde quer que esteja. Reunimos transmissões em direto, resultados, calendários e notícias de futebol, basquetebol, ténis, UFC, Fórmula 1, vólei e muito mais, tudo numa única plataforma.",
          "Sabemos como é frustrante andar a saltar entre vários sites e apps só para encontrar onde assistir a um jogo. Por isso construímos uma experiência centrada no adepto: transmissões em HD, múltiplos servidores alternativos para quando um falha, e uma interface pensada para ser rápida em qualquer dispositivo.",
        ],
      },
      {
        heading: "O que nos move",
        body: [
          "Acreditamos que o desporto une pessoas, independentemente de onde estejam. A nossa equipa trabalha todos os dias para garantir cobertura das principais competições internacionais, incluindo a Copa do Mundo FIFA 2026, ligas nacionais de futebol, a NBA, torneios de Grand Slam de ténis e muito mais.",
          "Não somos apenas mais uma plataforma de streaming — somos construídos por adeptos, para adeptos. Cada funcionalidade que lançamos, desde notificações de jogos até estatísticas em tempo real, nasce de perguntar: \"isto torna a experiência de assistir desporto melhor?\"",
        ],
      },
      {
        heading: "Onde estamos",
        body: [
          "A LiveSports serve adeptos em todo o mundo lusófono — Brasil, Portugal, Angola, Cabo Verde, Moçambique, São Tomé e Príncipe, Guiné-Bissau e Timor-Leste — bem como utilizadores de língua inglesa em todo o mundo.",
        ],
      },
    ],
  },

  careers: {
    title: "Carreiras na LiveSports",
    subtitle: "Ajude-nos a construir o futuro do streaming desportivo.",
    sections: [
      {
        body: [
          "Somos uma equipa pequena e focada, apaixonada por desporto e por tecnologia. Trabalhamos de forma remota, com colegas espalhados por vários fusos horários, e valorizamos autonomia, responsabilidade e qualidade acima de horas de cadeira.",
        ],
      },
      {
        heading: "Como trabalhamos",
        body: [
          "Equipas pequenas e multidisciplinares, com forte autonomia sobre o que constroem.",
          "Comunicação assíncrona como padrão — reuniões só quando realmente necessárias.",
          "Decisões orientadas por dados e pelo feedback direto dos adeptos que usam a plataforma todos os dias.",
        ],
      },
      {
        heading: "Não há vagas abertas neste momento",
        body: [
          "Neste momento não temos posições abertas, mas estamos sempre interessados em conhecer pessoas talentosas. Se acha que pode contribuir para a LiveSports — seja em engenharia, design, operações de conteúdo ou apoio ao cliente — envie-nos uma mensagem através da nossa página de Contacto com uma breve apresentação sobre si.",
        ],
      },
    ],
  },

  blog: {
    title: "Blog LiveSports",
    subtitle: "Análises, bastidores e novidades do mundo do desporto.",
    sections: [
      {
        body: [
          "O nosso blog está em preparação. Em breve vai encontrar aqui artigos sobre os bastidores das grandes competições, guias para tirar o máximo partido da plataforma, e análises da nossa equipa sobre os principais acontecimentos desportivos.",
          "Quer ser avisado assim que publicarmos o primeiro artigo? Subscreva a nossa newsletter no rodapé do site.",
        ],
      },
    ],
  },

  press: {
    title: "Imprensa",
    subtitle: "Recursos e contactos para profissionais de comunicação social.",
    sections: [
      {
        body: [
          "Jornalistas e profissionais de comunicação social que pretendam falar connosco, pedir comentários ou obter materiais sobre a LiveSports podem contactar-nos através do email de imprensa abaixo.",
        ],
      },
      {
        heading: "Contacto de imprensa",
        body: [
          "Para pedidos de imprensa, parcerias editoriais ou pedidos de entrevista, escreva-nos através da nossa página de Contacto indicando \"Imprensa\" no assunto. Respondemos normalmente dentro de 2 a 3 dias úteis.",
        ],
      },
    ],
  },

  partners: {
    title: "Parceiros",
    subtitle: "Trabalhe connosco para levar desporto ao vivo a mais adeptos.",
    sections: [
      {
        body: [
          "Estamos sempre abertos a parcerias com ligas, clubes, emissoras, marcas desportivas e anunciantes que partilhem o nosso objetivo de tornar o desporto ao vivo mais acessível.",
        ],
      },
      {
        heading: "Tipos de parceria",
        body: [
          "Direitos de transmissão e distribuição de conteúdo desportivo.",
          "Parcerias de marca e publicidade na plataforma.",
          "Integrações de dados desportivos e estatísticas em tempo real.",
        ],
      },
      {
        heading: "Como propor uma parceria",
        body: [
          "Envie-nos uma proposta através da página de Contacto, indicando \"Parcerias\" no assunto, com uma breve descrição da sua organização e do tipo de colaboração que tem em mente.",
        ],
      },
    ],
  },

  help: {
    title: "Central de Ajuda",
    subtitle: "Respostas rápidas para as dúvidas mais comuns.",
    sections: [
      {
        body: [
          "Não encontrou o que procurava? Consulte também a nossa página de Perguntas Frequentes ou contacte diretamente a nossa equipa de suporte.",
        ],
      },
      {
        heading: "Problemas com a transmissão",
        body: [
          "Se um jogo estiver a travar ou a transmissão não carregar, experimente primeiro trocar de servidor — disponibilizamos sempre servidores alternativos para cada transmissão. Verifique também a sua ligação à internet e tente atualizar a página.",
        ],
      },
      {
        heading: "Problemas com a conta",
        body: [
          "Para questões relacionadas com início de sessão, registo ou alteração de password, utilize as opções disponíveis na página de Entrar. Se continuar com dificuldades, contacte-nos através da página de Contacto.",
        ],
      },
      {
        heading: "Reportar um problema",
        body: [
          "Encontrou um erro na plataforma, um link de transmissão indisponível, ou conteúdo incorreto? Agradecemos o seu reporte — utilize a página de Contacto para nos avisar, descrevendo o mais detalhadamente possível o que encontrou.",
        ],
      },
    ],
  },

  contact: {
    title: "Contacto",
    subtitle: "Estamos aqui para ajudar.",
    sections: [
      {
        body: [
          "Tem uma dúvida, sugestão, ou encontrou um problema na plataforma? A nossa equipa terá todo o gosto em ajudar. Escolha o canal mais adequado abaixo.",
        ],
      },
    ],
    contactChannels: [
      { label: "Apoio geral", value: "suporte@livesports.app", href: "mailto:suporte@livesports.app" },
      { label: "Imprensa", value: "imprensa@livesports.app", href: "mailto:imprensa@livesports.app" },
      { label: "Parcerias", value: "parcerias@livesports.app", href: "mailto:parcerias@livesports.app" },
      { label: "Privacidade / DPO", value: "privacidade@livesports.app", href: "mailto:privacidade@livesports.app" },
    ],
  },

  plans: {
    title: "Planos",
    subtitle: "Acesso livre a transmissões desportivas em direto.",
    sections: [
      {
        body: [
          "A LiveSports oferece atualmente acesso gratuito a todas as transmissões disponíveis na plataforma, mediante registo de uma conta. Não existem subscrições pagas em vigor neste momento.",
          "Se no futuro introduzirmos planos pagos com funcionalidades adicionais, todos os utilizadores registados serão notificados com antecedência e esta página será atualizada com os detalhes completos de preços e funcionalidades.",
        ],
      },
      {
        heading: "O que está incluído na conta gratuita",
        body: [
          "Acesso a todas as transmissões ao vivo disponíveis na plataforma.",
          "Múltiplos servidores alternativos por transmissão, em caso de instabilidade.",
          "Calendário de jogos, resultados e notícias desportivas.",
          "Notificações de jogos e eventos favoritos.",
        ],
      },
    ],
  },

  faq: {
    title: "Perguntas Frequentes",
    subtitle: "As respostas mais procuradas pelos nossos utilizadores.",
    faqs: [
      {
        question: "A LiveSports é gratuita?",
        answer:
          "Sim. Atualmente todo o conteúdo disponível na plataforma é gratuito mediante criação de uma conta.",
      },
      {
        question: "Preciso de criar uma conta para assistir?",
        answer:
          "Sim, é necessário ter uma conta registada para aceder às transmissões. O registo é rápido e gratuito.",
      },
      {
        question: "Em que dispositivos posso assistir?",
        answer:
          "A LiveSports funciona diretamente no navegador, em computadores, tablets, smartphones e Smart TVs com browser, sem necessidade de instalar aplicações adicionais.",
      },
      {
        question: "Porque é que uma transmissão está a falhar ou a travar?",
        answer:
          "Disponibilizamos sempre múltiplos servidores alternativos para cada transmissão. Se um servidor estiver instável, experimente trocar para outro na mesma página do jogo. Também recomendamos verificar a sua ligação à internet.",
      },
      {
        question: "Como posso saber quando um jogo vai começar?",
        answer:
          "Cada transmissão agendada mostra uma contagem decrescente até ao início. Pode também consultar o nosso Calendário para ver todos os jogos programados.",
      },
      {
        question: "Como reporto um problema ou erro na plataforma?",
        answer:
          "Utilize a nossa página de Contacto para nos enviar uma descrição do problema. A nossa equipa analisa todos os reportes recebidos.",
      },
      {
        question: "A LiveSports detém os direitos de transmissão dos jogos?",
        answer:
          "Consulte a nossa página de DMCA para informação completa sobre direitos de autor e o processo de denúncia de conteúdo.",
      },
      {
        question: "Como altero o idioma da plataforma?",
        answer:
          "Pode alternar entre Português e Inglês através do seletor de idioma disponível no rodapé do site.",
      },
    ],
  },

  terms: {
    title: "Termos de Utilização",
    lastUpdated: "Última atualização: junho de 2026",
    sections: [
      {
        heading: "1. Aceitação dos termos",
        body: [
          "Ao aceder ou utilizar a plataforma LiveSports (\"Plataforma\", \"Serviço\"), concorda em ficar vinculado a estes Termos de Utilização. Se não concordar com algum destes termos, não deverá utilizar o Serviço.",
        ],
      },
      {
        heading: "2. Descrição do serviço",
        body: [
          "A LiveSports é uma plataforma agregadora de conteúdo desportivo, que disponibiliza transmissões em direto, resultados, calendários e notícias relacionadas com diversas modalidades desportivas. O Serviço é fornecido \"tal como está\" e pode ser alterado, suspenso ou descontinuado a qualquer momento, total ou parcialmente.",
        ],
      },
      {
        heading: "3. Contas de utilizador",
        body: [
          "Para aceder a determinadas funcionalidades, é necessário criar uma conta, fornecendo informação verdadeira e atualizada. É responsável por manter a confidencialidade das suas credenciais de acesso e por todas as atividades realizadas através da sua conta.",
          "Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos, que sejam utilizadas para fins fraudulentos, ou que comprometam a segurança ou o funcionamento da Plataforma.",
        ],
      },
      {
        heading: "4. Conduta do utilizador",
        body: [
          "Ao utilizar o Serviço, compromete-se a não: (a) violar quaisquer leis aplicáveis; (b) tentar aceder de forma não autorizada a sistemas ou dados de outros utilizadores; (c) publicar conteúdo difamatório, ofensivo ou ilegal em áreas de interação da Plataforma, como comentários em transmissões; (d) utilizar ferramentas automatizadas para extrair dados da Plataforma sem autorização prévia.",
        ],
      },
      {
        heading: "5. Propriedade intelectual",
        body: [
          "Todo o conteúdo, marca, logótipo e design da Plataforma são propriedade da LiveSports ou dos respetivos licenciadores, sendo protegidos por leis de propriedade intelectual. O conteúdo desportivo transmitido pertence aos respetivos detentores de direitos. Consulte a nossa página de DMCA para mais informação.",
        ],
      },
      {
        heading: "6. Limitação de responsabilidade",
        body: [
          "A LiveSports não garante disponibilidade ininterrupta do Serviço nem a ausência de erros. Na medida máxima permitida por lei, a LiveSports não será responsável por danos indiretos, incidentais ou consequenciais resultantes do uso ou da impossibilidade de uso do Serviço.",
        ],
      },
      {
        heading: "7. Alterações aos termos",
        body: [
          "Podemos atualizar estes Termos periodicamente. Alterações significativas serão comunicadas através da Plataforma. A utilização continuada do Serviço após a publicação de alterações constitui aceitação dos novos Termos.",
        ],
      },
      {
        heading: "8. Lei aplicável",
        body: [
          "Estes Termos são regidos pela legislação aplicável na jurisdição em que a LiveSports opera, sem prejuízo de quaisquer direitos imperativos de proteção ao consumidor que assistam ao utilizador na sua jurisdição de residência.",
        ],
      },
    ],
  },

  privacy: {
    title: "Política de Privacidade",
    lastUpdated: "Última atualização: junho de 2026",
    sections: [
      {
        heading: "1. Introdução",
        body: [
          "Esta Política de Privacidade explica como a LiveSports recolhe, utiliza, armazena e protege os seus dados pessoais quando utiliza a nossa Plataforma.",
        ],
      },
      {
        heading: "2. Dados que recolhemos",
        body: [
          "Dados de registo: nome, email, país e password (armazenada de forma encriptada, nunca em texto simples).",
          "Dados de utilização: páginas visitadas, transmissões assistidas, preferências de idioma e interações com a Plataforma, recolhidos para melhorar a experiência e a fiabilidade do Serviço.",
          "Dados técnicos: endereço IP, tipo de dispositivo e navegador, utilizados para fins de segurança e diagnóstico de problemas técnicos.",
        ],
      },
      {
        heading: "3. Como utilizamos os seus dados",
        body: [
          "Para fornecer e manter o Serviço, incluindo autenticação e personalização da experiência.",
          "Para comunicar consigo sobre a sua conta, alterações ao Serviço ou questões de segurança.",
          "Para análise interna que nos ajuda a melhorar a fiabilidade e o desempenho da Plataforma.",
          "Não vendemos os seus dados pessoais a terceiros.",
        ],
      },
      {
        heading: "4. Partilha de dados",
        body: [
          "Podemos partilhar dados com fornecedores de serviços essenciais ao funcionamento da Plataforma (por exemplo, alojamento e infraestrutura), sujeitos a obrigações contratuais de confidencialidade, ou quando exigido por lei.",
        ],
      },
      {
        heading: "5. Os seus direitos",
        body: [
          "Tem o direito de aceder, corrigir, eliminar ou exportar os seus dados pessoais, bem como de retirar o seu consentimento a qualquer momento. Para exercer estes direitos, contacte-nos através do email de privacidade indicado na nossa página de Contacto.",
        ],
      },
      {
        heading: "6. Retenção de dados",
        body: [
          "Mantemos os seus dados pessoais apenas durante o período necessário para cumprir os fins descritos nesta política, ou conforme exigido por lei. Pode solicitar a eliminação da sua conta e dos dados associados a qualquer momento.",
        ],
      },
      {
        heading: "7. Segurança",
        body: [
          "Implementamos medidas técnicas e organizativas adequadas para proteger os seus dados, incluindo encriptação de passwords e controlos de acesso. Nenhum sistema é, no entanto, totalmente imune a riscos, pelo que recomendamos a utilização de passwords fortes e únicas.",
        ],
      },
      {
        heading: "8. Contacto",
        body: [
          "Para questões relacionadas com esta Política de Privacidade, contacte-nos através da nossa página de Contacto, indicando \"Privacidade\" no assunto.",
        ],
      },
    ],
  },

  cookies: {
    title: "Política de Cookies",
    lastUpdated: "Última atualização: junho de 2026",
    sections: [
      {
        heading: "O que são cookies",
        body: [
          "Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita a nossa Plataforma. Permitem-nos reconhecer o seu dispositivo e lembrar determinadas informações sobre a sua visita.",
        ],
      },
      {
        heading: "Como utilizamos cookies",
        body: [
          "Cookies essenciais: necessários para o funcionamento básico da Plataforma, como manter a sua sessão iniciada.",
          "Cookies de preferências: guardam definições como o idioma escolhido, para que não tenha de as configurar a cada visita.",
          "Cookies analíticos: ajudam-nos a compreender como a Plataforma é utilizada, para a podermos melhorar.",
        ],
      },
      {
        heading: "Gerir cookies",
        body: [
          "Pode gerir ou desativar cookies através das definições do seu navegador. Note que desativar cookies essenciais pode afetar o funcionamento da Plataforma, nomeadamente o início de sessão.",
        ],
      },
    ],
  },

  dmca: {
    title: "DMCA — Direitos de Autor",
    lastUpdated: "Última atualização: junho de 2026",
    sections: [
      {
        heading: "Política de direitos de autor",
        body: [
          "A LiveSports respeita os direitos de propriedade intelectual de terceiros e espera o mesmo dos seus utilizadores. Atuamos em conformidade com o Digital Millennium Copyright Act (DMCA) e legislação equivalente nas jurisdições em que operamos.",
        ],
      },
      {
        heading: "Como submeter uma denúncia",
        body: [
          "Se é detentor de direitos de autor, ou representante autorizado, e considera que conteúdo disponível na Plataforma infringe os seus direitos, pode submeter uma notificação através da nossa página de Contacto, indicando \"DMCA\" no assunto, e incluindo: (a) identificação da obra protegida; (b) localização do conteúdo na Plataforma; (c) os seus dados de contacto; (d) uma declaração de boa-fé de que a utilização não foi autorizada; (e) uma declaração, sob pena de perjúrio, de que a informação fornecida é exata e que é o detentor dos direitos ou está autorizado a agir em seu nome.",
        ],
      },
      {
        heading: "Resposta a denúncias",
        body: [
          "Mediante receção de uma notificação válida, a LiveSports analisará o pedido e poderá remover ou desativar o acesso ao conteúdo identificado, em conformidade com a legislação aplicável.",
        ],
      },
      {
        heading: "Contranotificação",
        body: [
          "Se considera que o seu conteúdo foi removido por engano ou identificação incorreta, pode submeter uma contranotificação através dos mesmos canais de contacto, fornecendo a informação necessária para análise do caso.",
        ],
      },
    ],
  },
};

const en: Record<StaticPageSlug, StaticPageContent> = {
  about: {
    title: "About LiveSports",
    subtitle: "The home of live sports, for fans who don't want to miss a thing.",
    sections: [
      {
        body: [
          "LiveSports was built with one simple goal: make it easier to follow the games that matter, wherever you are. We bring together live streams, scores, schedules and news for football, basketball, tennis, UFC, Formula 1, volleyball and more, all in a single platform.",
          "We know how frustrating it is to jump between sites and apps just to find where to watch a game. That's why we built a fan-first experience: HD streams, multiple backup servers for when one goes down, and an interface designed to be fast on any device.",
        ],
      },
      {
        heading: "What drives us",
        body: [
          "We believe sport brings people together, no matter where they are. Our team works every day to provide coverage of major international competitions, including the FIFA World Cup 2026, domestic football leagues, the NBA, tennis Grand Slam tournaments and more.",
          "We're not just another streaming platform — we're built by fans, for fans. Every feature we ship, from game notifications to live stats, starts with the question: \"does this make watching sport better?\"",
        ],
      },
      {
        heading: "Where we are",
        body: [
          "LiveSports serves fans across the Portuguese-speaking world — Brazil, Portugal, Angola, Cape Verde, Mozambique, São Tomé and Príncipe, Guinea-Bissau and Timor-Leste — as well as English-speaking users worldwide.",
        ],
      },
    ],
  },

  careers: {
    title: "Careers at LiveSports",
    subtitle: "Help us build the future of sports streaming.",
    sections: [
      {
        body: [
          "We're a small, focused team passionate about sport and technology. We work remotely, with teammates spread across time zones, and we value autonomy, ownership and quality over hours spent in a chair.",
        ],
      },
      {
        heading: "How we work",
        body: [
          "Small, cross-functional teams with strong ownership over what they build.",
          "Async-first communication — meetings only when they're truly necessary.",
          "Decisions driven by data and direct feedback from the fans who use the platform every day.",
        ],
      },
      {
        heading: "No open positions right now",
        body: [
          "We don't have any open positions at the moment, but we're always interested in meeting talented people. If you think you could contribute to LiveSports — whether in engineering, design, content operations or customer support — reach out through our Contact page with a short introduction.",
        ],
      },
    ],
  },

  blog: {
    title: "LiveSports Blog",
    subtitle: "Analysis, behind-the-scenes stories and news from the world of sport.",
    sections: [
      {
        body: [
          "Our blog is currently in the works. Soon you'll find articles here covering the behind-the-scenes of major competitions, guides to getting the most out of the platform, and our team's takes on the biggest sporting moments.",
          "Want to know as soon as we publish our first post? Subscribe to our newsletter in the site footer.",
        ],
      },
    ],
  },

  press: {
    title: "Press",
    subtitle: "Resources and contacts for media professionals.",
    sections: [
      {
        body: [
          "Journalists and media professionals looking to talk to us, request comments, or get materials about LiveSports can reach us through the press email below.",
        ],
      },
      {
        heading: "Press contact",
        body: [
          "For press inquiries, editorial partnerships or interview requests, write to us through our Contact page with \"Press\" in the subject line. We typically respond within 2-3 business days.",
        ],
      },
    ],
  },

  partners: {
    title: "Partners",
    subtitle: "Work with us to bring live sport to more fans.",
    sections: [
      {
        body: [
          "We're always open to partnerships with leagues, clubs, broadcasters, sports brands and advertisers who share our goal of making live sport more accessible.",
        ],
      },
      {
        heading: "Types of partnership",
        body: [
          "Broadcast and content distribution rights.",
          "Brand and advertising partnerships on the platform.",
          "Sports data integrations and real-time statistics.",
        ],
      },
      {
        heading: "How to propose a partnership",
        body: [
          "Send us a proposal through our Contact page with \"Partnerships\" in the subject line, including a brief description of your organization and the kind of collaboration you have in mind.",
        ],
      },
    ],
  },

  help: {
    title: "Help Center",
    subtitle: "Quick answers to the most common questions.",
    sections: [
      {
        body: [
          "Didn't find what you were looking for? Check out our FAQ page as well, or reach out directly to our support team.",
        ],
      },
      {
        heading: "Stream issues",
        body: [
          "If a game is buffering or the stream won't load, try switching servers first — we always provide backup servers for every stream. Also check your internet connection and try refreshing the page.",
        ],
      },
      {
        heading: "Account issues",
        body: [
          "For questions about logging in, registering, or changing your password, use the options available on the Login page. If you're still having trouble, reach out through our Contact page.",
        ],
      },
      {
        heading: "Reporting an issue",
        body: [
          "Found a bug on the platform, a stream link that's down, or incorrect content? We appreciate the report — use our Contact page to let us know, describing what you found in as much detail as possible.",
        ],
      },
    ],
  },

  contact: {
    title: "Contact",
    subtitle: "We're here to help.",
    sections: [
      {
        body: [
          "Have a question, a suggestion, or found an issue on the platform? Our team is happy to help. Pick the most relevant channel below.",
        ],
      },
    ],
    contactChannels: [
      { label: "General support", value: "support@livesports.app", href: "mailto:support@livesports.app" },
      { label: "Press", value: "press@livesports.app", href: "mailto:press@livesports.app" },
      { label: "Partnerships", value: "partners@livesports.app", href: "mailto:partners@livesports.app" },
      { label: "Privacy / DPO", value: "privacy@livesports.app", href: "mailto:privacy@livesports.app" },
    ],
  },

  plans: {
    title: "Plans",
    subtitle: "Free access to live sports streaming.",
    sections: [
      {
        body: [
          "LiveSports currently offers free access to all streams available on the platform, with a registered account. There are no paid subscriptions in effect at this time.",
          "If we introduce paid plans with additional features in the future, all registered users will be notified in advance and this page will be updated with full pricing and feature details.",
        ],
      },
      {
        heading: "What's included with a free account",
        body: [
          "Access to all live streams available on the platform.",
          "Multiple backup servers per stream, in case of instability.",
          "Game schedule, scores and sports news.",
          "Notifications for favorite games and events.",
        ],
      },
    ],
  },

  faq: {
    title: "Frequently Asked Questions",
    subtitle: "The questions our users ask us the most.",
    faqs: [
      {
        question: "Is LiveSports free?",
        answer: "Yes. All content currently available on the platform is free with a registered account.",
      },
      {
        question: "Do I need an account to watch?",
        answer: "Yes, a registered account is required to access streams. Registration is quick and free.",
      },
      {
        question: "What devices can I watch on?",
        answer:
          "LiveSports works directly in the browser, on computers, tablets, smartphones and Smart TVs with a browser, with no need to install additional apps.",
      },
      {
        question: "Why is a stream buffering or not loading?",
        answer:
          "We always provide multiple backup servers for every stream. If one server is unstable, try switching to another one on the same game page. We also recommend checking your internet connection.",
      },
      {
        question: "How do I know when a game is starting?",
        answer:
          "Every scheduled stream shows a countdown to kickoff. You can also check our Calendar to see all scheduled games.",
      },
      {
        question: "How do I report a bug or issue on the platform?",
        answer: "Use our Contact page to send us a description of the issue. Our team reviews every report we receive.",
      },
      {
        question: "Does LiveSports hold the broadcast rights to the games?",
        answer: "See our DMCA page for full information on copyright and the takedown notice process.",
      },
      {
        question: "How do I change the platform language?",
        answer: "You can switch between Portuguese and English using the language selector in the site footer.",
      },
    ],
  },

  terms: {
    title: "Terms of Use",
    lastUpdated: "Last updated: June 2026",
    sections: [
      {
        heading: "1. Acceptance of terms",
        body: [
          "By accessing or using the LiveSports platform (\"Platform\", \"Service\"), you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you must not use the Service.",
        ],
      },
      {
        heading: "2. Description of service",
        body: [
          "LiveSports is a sports content aggregation platform that provides live streams, scores, schedules and news related to various sports. The Service is provided \"as is\" and may be changed, suspended or discontinued at any time, in whole or in part.",
        ],
      },
      {
        heading: "3. User accounts",
        body: [
          "To access certain features, you must create an account and provide accurate, up-to-date information. You are responsible for keeping your login credentials confidential and for all activity carried out through your account.",
          "We reserve the right to suspend or terminate accounts that violate these Terms, are used for fraudulent purposes, or compromise the security or operation of the Platform.",
        ],
      },
      {
        heading: "4. User conduct",
        body: [
          "By using the Service, you agree not to: (a) violate any applicable laws; (b) attempt unauthorized access to other users' systems or data; (c) post defamatory, offensive or unlawful content in interactive areas of the Platform, such as stream comments; (d) use automated tools to scrape data from the Platform without prior authorization.",
        ],
      },
      {
        heading: "5. Intellectual property",
        body: [
          "All content, branding, logos and design of the Platform are the property of LiveSports or its respective licensors and are protected by intellectual property law. Sports content streamed belongs to its respective rights holders. See our DMCA page for more information.",
        ],
      },
      {
        heading: "6. Limitation of liability",
        body: [
          "LiveSports does not guarantee uninterrupted availability of the Service or that it will be error-free. To the maximum extent permitted by law, LiveSports will not be liable for indirect, incidental or consequential damages arising from the use or inability to use the Service.",
        ],
      },
      {
        heading: "7. Changes to these terms",
        body: [
          "We may update these Terms from time to time. Material changes will be communicated through the Platform. Continued use of the Service after changes are posted constitutes acceptance of the new Terms.",
        ],
      },
      {
        heading: "8. Governing law",
        body: [
          "These Terms are governed by the applicable law of the jurisdiction in which LiveSports operates, without prejudice to any mandatory consumer protection rights available to you in your jurisdiction of residence.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: June 2026",
    sections: [
      {
        heading: "1. Introduction",
        body: [
          "This Privacy Policy explains how LiveSports collects, uses, stores and protects your personal data when you use our Platform.",
        ],
      },
      {
        heading: "2. Data we collect",
        body: [
          "Account data: name, email, country, and password (stored encrypted, never in plain text).",
          "Usage data: pages visited, streams watched, language preferences and interactions with the Platform, collected to improve the experience and reliability of the Service.",
          "Technical data: IP address, device and browser type, used for security purposes and technical troubleshooting.",
        ],
      },
      {
        heading: "3. How we use your data",
        body: [
          "To provide and maintain the Service, including authentication and personalization.",
          "To communicate with you about your account, changes to the Service, or security matters.",
          "For internal analytics that help us improve the reliability and performance of the Platform.",
          "We do not sell your personal data to third parties.",
        ],
      },
      {
        heading: "4. Data sharing",
        body: [
          "We may share data with service providers essential to running the Platform (for example, hosting and infrastructure), subject to contractual confidentiality obligations, or when required by law.",
        ],
      },
      {
        heading: "5. Your rights",
        body: [
          "You have the right to access, correct, delete or export your personal data, and to withdraw your consent at any time. To exercise these rights, contact us via the privacy email listed on our Contact page.",
        ],
      },
      {
        heading: "6. Data retention",
        body: [
          "We retain your personal data only for as long as necessary to fulfill the purposes described in this policy, or as required by law. You may request deletion of your account and associated data at any time.",
        ],
      },
      {
        heading: "7. Security",
        body: [
          "We implement appropriate technical and organizational measures to protect your data, including password encryption and access controls. No system is fully immune to risk, however, so we recommend using strong, unique passwords.",
        ],
      },
      {
        heading: "8. Contact",
        body: [
          "For questions about this Privacy Policy, contact us through our Contact page with \"Privacy\" in the subject line.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    lastUpdated: "Last updated: June 2026",
    sections: [
      {
        heading: "What are cookies",
        body: [
          "Cookies are small text files stored on your device when you visit our Platform. They let us recognize your device and remember certain information about your visit.",
        ],
      },
      {
        heading: "How we use cookies",
        body: [
          "Essential cookies: required for the Platform's basic functioning, such as keeping you signed in.",
          "Preference cookies: store settings like your chosen language, so you don't have to set them on every visit.",
          "Analytics cookies: help us understand how the Platform is used, so we can improve it.",
        ],
      },
      {
        heading: "Managing cookies",
        body: [
          "You can manage or disable cookies through your browser settings. Note that disabling essential cookies may affect the Platform's functionality, including signing in.",
        ],
      },
    ],
  },

  dmca: {
    title: "DMCA — Copyright",
    lastUpdated: "Last updated: June 2026",
    sections: [
      {
        heading: "Copyright policy",
        body: [
          "LiveSports respects the intellectual property rights of third parties and expects the same from its users. We act in accordance with the Digital Millennium Copyright Act (DMCA) and equivalent legislation in the jurisdictions where we operate.",
        ],
      },
      {
        heading: "How to submit a takedown notice",
        body: [
          "If you are a copyright holder, or an authorized representative, and believe content available on the Platform infringes your rights, you may submit a notice through our Contact page with \"DMCA\" in the subject line, including: (a) identification of the protected work; (b) the location of the content on the Platform; (c) your contact information; (d) a good-faith statement that the use was not authorized; (e) a statement, under penalty of perjury, that the information provided is accurate and that you are the rights holder or authorized to act on their behalf.",
        ],
      },
      {
        heading: "Response to notices",
        body: [
          "Upon receiving a valid notice, LiveSports will review the request and may remove or disable access to the identified content, in accordance with applicable law.",
        ],
      },
      {
        heading: "Counter-notice",
        body: [
          "If you believe your content was removed by mistake or misidentification, you may submit a counter-notice through the same contact channels, providing the information necessary to review the case.",
        ],
      },
    ],
  },
};

const content: Record<Lang, Record<StaticPageSlug, StaticPageContent>> = { pt, en };

export function getStaticPageContent(slug: StaticPageSlug, lang: Lang): StaticPageContent {
  return content[lang][slug];
}

export const staticPageSlugs: StaticPageSlug[] = [
  "about", "careers", "blog", "press", "partners", "help",
  "contact", "plans", "faq", "terms", "privacy", "cookies", "dmca",
];
