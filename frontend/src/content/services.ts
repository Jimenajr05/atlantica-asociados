export interface ServiceItem {
  id: string;
  title: string;
  badge: string;
  institutionExample: string;
  summary: string;
  description: string;
  whenToUse: string[];
  whatWeDeliver: string[];
  icon: 'hospital' | 'building' | 'landmark' | 'scale' | 'users' | 'shield' | 'file' | 'folder' | 'search' | 'briefcase';
}

export const SERVICES: ServiceItem[] = [
  {
    id: "elaboracion-solicitudes-instituciones",
    title: "Elaboración de solicitudes dirigidas a instituciones públicas y privadas",
    badge: "Gestión Institucional",
    institutionExample: "Ministerios, Direcciones Generales, Bancos, Entidades Autónomas",
    summary: "Redacción formal, técnica y fundamentada de solicitudes ante cualquier jerarca o departamento institucional.",
    description: "Formulamos escritos estructurados con lenguaje técnico adecuado para que su trámite sea recibido, analizado y tramitado con la debida formalidad por las autoridades correspondientes.",
    whenToUse: [
      "Necesita pedir una autorización, revisión o trámite oficial ante una entidad.",
      "Requiere que su solicitud sea entendida con claridad y rigor administrativo.",
      "Desea evitar que su gestión sea devuelta por falta de requisitos formales."
    ],
    whatWeDeliver: [
      "Documento oficial con encabezamiento, hechos, petitoria y fundamento.",
      "Instrucciones de radicación física o digital con acuse de recibido."
    ],
    icon: "file"
  },
  {
    id: "solicitudes-informacion-publica",
    title: "Solicitudes de información pública",
    badge: "Transparencia & Acceso",
    institutionExample: "Instituciones del Estado, Municipalidades, Empresas de Servicios Públicos",
    summary: "Gestión y exigencia de acceso a expedientes, informes técnicos, presupuestos y datos de interés público.",
    description: "Hacemos valer su derecho de acceso a la información pública, preparando requerimientos claros que obligan a las instituciones a entregar datos fidedignos en los plazos de ley.",
    whenToUse: [
      "Necesita copias de expedientes administrativos o resoluciones.",
      "Requiere información presupuestaria o técnica sobre obras públicas.",
      "Una entidad le niega el acceso verbalmente sin fundamento."
    ],
    whatWeDeliver: [
      "Solicitud formal fundamentada en principios constitucionales de transparencia.",
      "Monitoreo de cumplimiento del plazo perentorio de entrega."
    ],
    icon: "search"
  },
  {
    id: "cartas-oficios-gestiones-documentos",
    title: "Elaboración de cartas, oficios, gestiones y documentos institucionales",
    badge: "Redacción Técnica",
    institutionExample: "Instituciones Públicas, Gobiernos Locales, Empresas Privadas",
    summary: "Redacción de correspondencia oficial, descargos y memoriales con estilo profesional y asertivo.",
    description: "Elaboramos comunicaciones escritas de alta calidad para representar su postura de forma respetuosa, firme y contundente ante cualquier interlocutor institucional.",
    whenToUse: [
      "Debe responder a una notificación formal o emplazamiento.",
      "Desea dejar constancia escrita de un reclamo o petición.",
      "Requiere un oficio formal de parte de su organización o a título personal."
    ],
    whatWeDeliver: [
      "Oficio o carta redactada con formato estándar oficial y argumentación precisa."
    ],
    icon: "file"
  },
  {
    id: "orientacion-tramites-administrativos",
    title: "Orientación en trámites administrativos",
    badge: "Acompañamiento",
    institutionExample: "CCSS, INS, MOPT, MINAE, Ministerio de Salud, INDER",
    summary: "Guía paso a paso para saber a qué departamento acudir, qué requisitos aportar y cómo proceder.",
    description: "Le ayudamos a descifrar la ruta correcta de sus trámites, ahorrándole viajes innecesarios y trámites infructuosos.",
    whenToUse: [
      "No sabe cuál es la oficina responsable de su caso.",
      "Se siente abrumado por la cantidad de requisitos burocráticos.",
      "Le han dado indicaciones contradictorias en ventanilla."
    ],
    whatWeDeliver: [
      "Ruta técnica y cronograma de trámites recomendados con lista de comprobación."
    ],
    icon: "briefcase"
  },
  {
    id: "seguimiento-gestiones-expedientes",
    title: "Seguimiento de gestiones y expedientes",
    badge: "Control & Celeridad",
    institutionExample: "Departamentos Legales, Direcciones Administrativas, Contralorías",
    summary: "Monitoreo continuo de sus trámites para evitar demoras injustificadas o silencios administrativos.",
    description: "Damos seguimiento al avance de su expediente, verificando el cumplimiento de plazos y preparando recordatorios de celeridad procesal.",
    whenToUse: [
      "Su trámite lleva semanas o meses detenido sin justificación.",
      "Desea conocer el estado actual y funcionario a cargo del expediente.",
      "Necesita presionar formalmente para obtener una resolución."
    ],
    whatWeDeliver: [
      "Control periódico de estado y memoriales de impulso procesal."
    ],
    icon: "folder"
  },
  {
    id: "preparacion-organizacion-documental",
    title: "Preparación y organización documental",
    badge: "Gestión Documental",
    institutionExample: "Expedientes Comunitarios, Personales y Organizacionales",
    summary: "Ordenamiento, foliado y estructuración de expedientes para respaldar sus gestiones.",
    description: "Una gestión con documentos desordenados suele ser rechazada. Ordenamos cronológica y temáticamente sus pruebas y antecedentes.",
    whenToUse: [
      "Tiene gran cantidad de papeles, recibos o cartas sin clasificar.",
      "Va a someter un expediente a revisión de una comisión o jerarca.",
      "Desea tener su historial institucional perfectamente archivado."
    ],
    whatWeDeliver: [
      "Índice estructurado, foliación y carpeta documental lista para presentación."
    ],
    icon: "folder"
  },
  {
    id: "apoyo-recursos-gestiones-administrativas",
    title: "Apoyo en recursos y gestiones administrativas",
    badge: "Defensa Administrativa",
    institutionExample: "Tribunales Administrativos, Consejos Directivos, Municipalidades",
    summary: "Fundamentación técnica de recursos de revocatoria, apelación y reconsideración ante actos desfavorables.",
    description: "Si una institución le notificó un rechazo o cobro indebido, elaboramos el recurso administrativo formal dentro de los plazos de ley.",
    whenToUse: [
      "Le rechazaron una solicitud y tiene pocos días para apelar.",
      "Recibió una sanción, multa o resolución administrativa que considera injusta.",
      "Requiere agotar la vía administrativa correspondiente."
    ],
    whatWeDeliver: [
      "Escrito de impugnación motivado con hechos, agravios y petitoria."
    ],
    icon: "scale"
  },
  {
    id: "recursos-amparo-proteccion-derechos",
    title: "Apoyo documental para recursos de amparo y otras gestiones de protección de derechos",
    badge: "Protección de Derechos",
    institutionExample: "Sala Constitucional (Sala IV), Defensoría de los Habitantes",
    summary: "Redacción fundamentada para amparos ante lista de espera de cirugías (CCSS), derecho de petición o salud.",
    description: "Elaboramos el soporte documental y escrito técnico de recurso de amparo ante violación manifiesta de derechos fundamentales por parte del Estado.",
    whenToUse: [
      "Espera quirúrgica o de cita con especialista de la CCSS con riesgo evidente de salud.",
      "Vulneración del Artículo 27 constitucional (falta de respuesta en 10 días hábiles).",
      "Omisiones graves de atención ciudadana por parte de jerarcas públicos."
    ],
    whatWeDeliver: [
      "Memorial completo listo para radicar ante la Sala Constitucional.",
      "Guía detallada para presentación telemática o presencial."
    ],
    icon: "hospital"
  },
  {
    id: "elaboracion-perfiles-propuestas-proyectos",
    title: "Elaboración de perfiles y propuestas de proyectos",
    badge: "Proyectos & Desarrollo",
    institutionExample: "DINADECO, INDER, FODESAF, Ministerios, Cooperación",
    summary: "Formulación técnica de perfiles de proyectos comunales y sociales para postulación a fondos.",
    description: "Transformamos las ideas y necesidades de su grupo en documentos de proyectos estructurados con objetivos, justificación y presupuesto.",
    whenToUse: [
      "Su organización comunal necesita presentar un proyecto para financiamiento.",
      "Requiere justificar una inversión pública ante una institución o concejo.",
      "Desea postular iniciativas a fondos no reembolsables o partidas específicas."
    ],
    whatWeDeliver: [
      "Documento de perfil de proyecto con marco lógico, metas y presupuesto estimado."
    ],
    icon: "briefcase"
  },
  {
    id: "acompanamiento-comunidades-organizaciones",
    title: "Acompañamiento a comunidades y organizaciones sociales",
    badge: "Desarrollo Comunal",
    institutionExample: "Asociaciones de Desarrollo Comunal (ADI), Comités de Caminos, Juntas",
    summary: "Respaldo y asesoría continua para líderes comunales en sus luchas y gestiones públicas.",
    description: "Acompañamos a las dirigencias comunales en sus trámites para que sus demandas comunitarias reciban la atención debida del gobierno local y nacional.",
    whenToUse: [
      "Problemas graves de infraestructura, agua, caminos o servicios en su localidad.",
      "La comunidad necesita articularse para una gestión formal ante el Estado.",
      "Requieren asesoría para presentar reclamos conjuntos ante municipalidades como Pococí."
    ],
    whatWeDeliver: [
      "Estrategia de gestión institucional y redacción de memoriales vecinales colectivos."
    ],
    icon: "users"
  },
  {
    id: "apoyo-asociaciones-grupos-organizados",
    title: "Apoyo a asociaciones, grupos organizados y organizaciones comunales",
    badge: "Organizaciones",
    institutionExample: "Asociaciones sin fines de lucro, Colectivos, Grupos Comunitarios",
    summary: "Fortalecimiento documental, orden de actas y gestiones institucionales para organizaciones.",
    description: "Asesoramos a directivas y grupos organizados en la elaboración de acuerdos, solicitudes y articulación interinstitucional.",
    whenToUse: [
      "Su asociación necesita relacionarse con entes públicos para convenios de uso.",
      "Requieren redactar solicitudes complejas dirigidas a entidades financieras o ministerios.",
      "Desean mantener un canal de comunicación formal con jerarcas."
    ],
    whatWeDeliver: [
      "Modelos de acuerdos, oficios institucionales y gestión de trámites."
    ],
    icon: "users"
  },
  {
    id: "gestion-reuniones-acercamientos-instituciones",
    title: "Gestión de reuniones y acercamientos con instituciones",
    badge: "Estrategia & Enlace",
    institutionExample: "Presidencia, Despachos Ministeriales, Alcaldías, Concejos Municipales",
    summary: "Preparación de agendas, solicitudes de audiencia y memoriales previos para reuniones de alto nivel.",
    description: "Concertamos solicitudes de audiencia estructuradas dirigidas a jerarcas y preparamos la ayuda memoria para que la reunión sea productiva y resolutiva.",
    whenToUse: [
      "Requiere una reunión con una alcaldía o despacho ministerial (como Casa Presidencial).",
      "Desea que la institución asista preparada con compromisos concretos a su reunión.",
      "Necesita redactar la minuta y seguimiento posterior a la cita oficial."
    ],
    whatWeDeliver: [
      "Solicitud formal de audiencia con agenda de temas prioritarios y ayuda memoria."
    ],
    icon: "landmark"
  },
  {
    id: "recopilacion-informacion-institucional",
    title: "Recopilación de información institucional",
    badge: "Investigación Administrativa",
    institutionExample: "Archivos Nacionales, Registros Públicos, Bibliotecas Técnicas",
    summary: "Búsqueda y recopilación de antecedentes, reglamentos, acuerdos municipales y actas.",
    description: "Investigamos la normativa y acuerdos históricos que aplican a su caso para construir una argumentación sólida e indiscutible.",
    whenToUse: [
      "Necesita conocer antecedentes de acuerdos tomados por un concejo municipal.",
      "Requiere normativas institucionales o circulares internas no publicadas comúnmente.",
      "Desea sustentar un caso con base en precedentes administrativos."
    ],
    whatWeDeliver: [
      "Dossier informativo con las fuentes, acuerdos y referencias normativas halladas."
    ],
    icon: "search"
  },
  {
    id: "elaboracion-informes-expedientes",
    title: "Elaboración de informes y expedientes",
    badge: "Informes Técnicos",
    institutionExample: "Juntas Directivas, Auditorías, Comisiones Evaluadoras",
    summary: "Construcción de informes técnicos descriptivos con hechos probados y conclusiones claras.",
    description: "Elaboramos informes exhaustivos sobre situaciones de hecho para presentar ante comisiones, directivas o auditorías institucionales.",
    whenToUse: [
      "Debe rendir un informe formal sobre el estado de una gestión comunal.",
      "Necesita sistematizar hallazgos e irregularidades para someterlos a una auditoría.",
      "Requiere un balance técnico estructurado para la asamblea de su organización."
    ],
    whatWeDeliver: [
      "Informe ejecutivo o técnico con anexos, cronología y recomendaciones de acción."
    ],
    icon: "file"
  },
  {
    id: "asesoria-procesos-participacion-ciudadana",
    title: "Asesoría en procesos de participación ciudadana",
    badge: "Ciudadanía Activa",
    institutionExample: "Concejos Municipales, Cabildos Abiertos, Audiencias Públicas",
    summary: "Orientación para participar eficazmente en cabildos, audiencias públicas y plebiscitos locales.",
    description: "Le preparamos para ejercer su voz ciudadana con sustento técnico en espacios de consulta pública, garantizando que su intervención quede en actas oficiales.",
    whenToUse: [
      "Va a participar en una audiencia pública sobre tarifas o proyectos comunales.",
      "Desea solicitar el uso de la palabra en una sesión de concejo municipal.",
      "Su comunidad participará en una consulta ciudadana sobre uso de suelo o presupuesto."
    ],
    whatWeDeliver: [
      "Guía de intervención, planteamiento por escrito y solicitud de constancia en actas."
    ],
    icon: "users"
  },
  {
    id: "digitalizacion-organizacion-documentacion",
    title: "Digitalización y organización de documentación",
    badge: "Gestión Digital",
    institutionExample: "Archivos Personales, Expedientes Comunitarios",
    summary: "Digitalización ordenada, indexada y segura de archivos físicos para trámites en línea.",
    description: "Convertimos su documentación física en expedientes electrónicos perfectamente clasificados y optimizados para plataformas digitales del Estado.",
    whenToUse: [
      "Tiene documentos físicos y la institución solo recibe trámites en formato digital.",
      "Desea tener una copia de respaldo segura en la nube de sus expedientes.",
      "Requiere optimizar el tamaño y formato de sus archivos para plataformas públicas."
    ],
    whatWeDeliver: [
      "Expediente digital en PDF de alta calidad, indexado y clasificado por carpetas."
    ],
    icon: "folder"
  },
  {
    id: "acompanamiento-estrategico-iniciativas",
    title: "Acompañamiento estratégico para iniciativas comunitarias y sociales",
    badge: "Poder & Estrategia",
    institutionExample: "Iniciativas Regionales, Colectivos Ciudadanos, Alianzas Intercomunales",
    summary: "Estrategia integral para posicionar proyectos sociales ante las instituciones clave.",
    description: "Diseñamos la hoja de ruta estratégica para que las iniciativas de alto impacto ciudadano ganen viabilidad política, institucional y comunal.",
    whenToUse: [
      "Su iniciativa requiere coordinar con múltiples instituciones a la vez.",
      "Desea superar bloqueos burocráticos o falta de voluntad política.",
      "Busca consolidar una alianza estratégica entre comunidad y Estado."
    ],
    whatWeDeliver: [
      "Hoja de ruta estratégica con identificación de actores clave y plan de acción."
    ],
    icon: "landmark"
  }
];
