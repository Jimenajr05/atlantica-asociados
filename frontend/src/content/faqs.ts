export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "¿Qué necesito para empezar a tramitar mi caso con ustedes?",
    answer: "Solo necesita contarnos lo que le ocurrió con sus propias palabras y tener a mano los comprobantes básicos que tenga (como una orden de cita, el número de solicitud, una carta previa o notas médicas). No se preocupe si no domina leyes ni términos difíciles: nosotros nos encargamos de darle el orden y la fundamentación formal a su situación.",
  },
  {
    id: "faq-2",
    question: "¿Cuánto tarda la preparación de mi documento?",
    answer: "Por lo general, entregamos su documento redactado y revisado en un plazo de 24 a 48 horas hábiles después de recibir la información completa y aclarar cualquier duda. Si su caso involucra un riesgo inminente de salud, le damos prioridad inmediata.",
  },
  {
    id: "faq-3",
    question: "¿Qué tipo de documentos debo enviarles?",
    answer: "Puede adjuntar fotografías claras con su celular o archivos en formato PDF, Word o imágenes de cartas anteriores, colillas de citas, boletas de hospital, notas municipales o cédula de identidad. No envíe claves ni información financiera que no sea requerida.",
  },
  {
    id: "faq-4",
    question: "¿Cómo protegen mi información y documentos personales?",
    answer: "Tratamos su caso bajo estricta confidencialidad. Los archivos que sube a nuestro sistema se guardan en un almacenamiento privado y cifrado, accesible únicamente por nuestro equipo para analizar su gestión. Entendemos que muchos casos incluyen información sensible de salud o situaciones personales delicadas.",
  },
  {
    id: "faq-5",
    question: "¿Cómo solicito una cita y cuál es el horario de atención?",
    answer: "Al llenar el formulario de caso en nuestra página web, puede marcar la casilla 'Solicitar una cita' y elegir si prefiere la mañana o la tarde, de lunes a viernes entre 7:00 a.m. y 5:00 p.m. Nos comunicaremos directamente a su WhatsApp para coordinar la llamada o videollamada.",
  },
  {
    id: "faq-6",
    question: "¿Tienen oficina física o el servicio es únicamente en línea?",
    answer: "Trabajamos 100% en línea para toda Costa Rica. Esto le ahorra pasajes, filas y pérdidas de tiempo. Nos comunicamos por WhatsApp, teléfono y correo electrónico, y le enviamos sus documentos listos en formato digital para que los presente en la institución o los entregue en ventanilla.",
  },
  {
    id: "faq-7",
    question: "¿Qué pasa si no sé a cuál institución exactamente debo reclamar?",
    answer: "No se preocupe. Muchas veces las instituciones se 'pasan la pelota' de una a otra. Al explicarnos su problema, nosotros investigamos cuál es la entidad obligada por ley a responderle y elaboramos el documento dirigido al departamento o jerarca correcto.",
  },
  {
    id: "faq-8",
    question: "¿Ustedes me garantizan que la institución me dará la razón?",
    answer: "Ninguna entidad o profesional ético puede garantizar de antemano el resultado final de un proceso ante el Estado. Lo que garantizamos al 100% es un documento técnicamente redactado, claro, respetuoso y formal, que cita los plazos legales obligatorios para que no puedan ignorar su derecho legítimo.",
  },
];
