import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Cargar variables de .env.local si existen
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').replace(/(^["']|["']$)/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val.trim();
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder')) {
  console.log('⚠️ [SEED] Advertencia: Las credenciales de Supabase no están configuradas en .env.local.');
  console.log('Para sembrar la base de datos real, configure NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 3 Artículos de Ejemplo Ficticios
const SEED_POSTS = [
  {
    slug: 'que-hacer-si-la-ccss-no-le-da-fecha-de-cirugia',
    title: '¿Qué hacer si la CCSS no le da fecha para su cirugía o cita de especialista?',
    excerpt: 'Conozca los pasos concretos y fundamentados para exigir la aceleración de su atención médica en hospitales públicos de Costa Rica sin perderse en el intento.',
    meta_description: 'Guía paso a paso sobre cómo reclamar ante la CCSS por retrasos en listas de espera quirúrgicas y citas de especialistas en Costa Rica.',
    published: true,
    published_at: new Date('2026-09-15T10:00:00Z').toISOString(),
    reading_time_minutes: 5,
    content: `## El derecho a la salud no puede esperar en una lista infinita

En Costa Rica, miles de asegurados enfrentan angustia cuando, tras recibir un diagnóstico médico delicado, se les asigna una cita para dentro de dos o tres años, o simplemente quedan en una lista de espera indefinida para una intervención quirúrgica.

Esta situación no solo deteriora su calidad de vida, sino que vulnera derechos constitucionales fundamentales consagrados en el artículo 21 de nuestra Constitución Política: **el derecho a la vida y a la salud**.

---

### 1. Reúna su expediente y constancias médicas recientes
El primer paso indispensable consiste en documentar la evolución de su condición:
- Solicite a su médico tratante (sea del EBAIS, clínica o médico privado) un dictamen o nota clínica donde se describa si su estado ha empeorado o si existe riesgo de secuelas permanentes.
- Guarde la colilla o comprobante original con la fecha en que ingresó formalmente a la lista de espera quirúrgica.

---

### 2. Presente una gestión formal ante la Dirección Médica y Contraloría de Servicios
Antes de acudir a instancias judiciales, es altamente recomendable agotar la vía interna:
1. Redacte un memorial dirigido a la **Dirección Médica** del hospital respectivo con copia a la **Contraloría de Servicios**.
2. Exponga con fechas claras los hechos y solicite formalmente la reprogramación o priorización de la cirugía.
3. Exija que le sellen una copia con fecha y hora de recibido.

---

### 3. El Recurso de Amparo ante la Sala Constitucional
Si transcurren los plazos legales o la respuesta es una negativa evasiva, la Sala Constitucional ha reiterado en copiosa jurisprudencia que las limitaciones presupuestarias o de infraestructura hospitalaria **no justifican poner en peligro la vida humana**.`,
  },
  {
    slug: 'derecho-de-peticion-articulo-27-costa-rica',
    title: 'El Artículo 27 de la Constitución: su mejor arma cuando una institución pública lo ignora',
    excerpt: 'Si presentó una solicitud o reclamo ante una municipalidad o ministerio y no le responden, la ley le otorga un mecanismo directo para exigir respuesta.',
    meta_description: 'Aprenda cómo funciona el derecho de petición y pronta resolución en Costa Rica y qué hacer si la institución no responde en 10 días.',
    published: true,
    published_at: new Date('2026-09-10T14:30:00Z').toISOString(),
    reading_time_minutes: 4,
    content: `## ¿Qué dice el Artículo 27 de nuestra Constitución Política?

El artículo 27 establece textualmente:
> *"Se garantiza la libertad de petición, en forma individual o colectiva, ante cualquier funcionario público o entidad oficial, y el derecho a obtener pronta resolución."*

Esto significa que ningún funcionario público ni departamento tiene la potestad de engavetar su consulta, archivar su nota sin responder o decirle verbalmente que "vuelva el otro mes".

---

### ¿Cuál es el plazo legal que tiene la institución para contestar?
Por regla general establecida en la Ley General de la Administración Pública y ratificada por la Sala IV, las instituciones disponen de **10 días hábiles** para responder de manera clara y congruente a las peticiones ciudadanas.`,
  },
  {
    slug: 'como-redactar-un-reclamo-ante-la-municipalidad',
    title: 'Guía práctica: Cómo presentar un reclamo efectivo ante su Municipalidad',
    excerpt: 'Aprenda cómo estructurar una solicitud vecinal o comunal para evitar que su trámite quede estancado en la burocracia del concejo o la alcaldía.',
    meta_description: 'Estructura correcta para presentar reclamos por caminos, alcantarillados o cobros ante municipalidades en Costa Rica.',
    published: true,
    published_at: new Date('2026-09-02T11:00:00Z').toISOString(),
    reading_time_minutes: 4,
    content: `## La importancia de la forma en las gestiones municipales

Muchas quejas comunales en distritos como Pococí, San Carlos, Puntarenas o Limón no prosperan porque se presentan como simples desahogos informales o mediante publicaciones en redes sociales que ningún departamento municipal está obligado procesalmente a atender.

Para que una gestión obligue legalmente a la administración local a actuar, debe seguir un orden técnico riguroso.`,
  },
];

// 3 Casos de Ejemplo Ficticios
const SEED_CASES = [
  {
    case_code: 'CAS-2026-1042',
    full_name: 'Carlos Alberto Mora Vargas',
    phone: '87123456',
    email: 'carlos.mora.cr@ejemplo.com',
    institution: 'CCSS - Hospital Rafael Ángel Calderón Guardia',
    description: 'Tengo 1 año y 8 meses esperando fecha de cirugía de reemplazo de rodilla. Mi condición ha empeorado notablemente y ya casi no puedo caminar sin apoyo. En la clínica me dicen que no hay ortopedistas disponibles.',
    privacy_accepted: true,
    appointment_requested: true,
    preferred_date: '2026-10-02',
    preferred_time_slot: 'manana',
    status: 'nuevo',
    internal_notes: 'Paciente aportó dictamen médico de especialista privado donde consta riesgo de inmovilidad.',
  },
  {
    case_code: 'CAS-2026-1088',
    full_name: 'Lorena Jiménez Fallas',
    phone: '61459980',
    email: 'lorena.jimen@ejemplo.com',
    institution: 'Municipalidad de Pococí',
    description: 'La alcantarilla principal frente a nuestra calle comunal en Guápiles se desbordó hace 3 meses con las lluvias. Presentamos una carta firmada por 14 vecinos y en la Unidad Técnica no nos dan razón ni contestan el correo.',
    privacy_accepted: true,
    appointment_requested: false,
    status: 'en_analisis',
    internal_notes: 'Plazo de 10 días hábiles vencido con creces. Procede memorial con citación del Art. 27.',
  },
  {
    case_code: 'CAS-2026-1120',
    full_name: 'Minor Quesada Rojas',
    phone: '83901122',
    email: null,
    institution: 'Casa Presidencial / Despacho de Atención Ciudadana',
    description: 'Solicitud colectiva de revisión del estado de abandono del puente vecinal que conecta a tres comunidades rurales. Requerimos formular un documento de alto impacto para la Dirección de Gestión Presidencial.',
    privacy_accepted: true,
    appointment_requested: true,
    preferred_date: '2026-10-05',
    preferred_time_slot: 'tarde',
    status: 'en_proceso',
    internal_notes: 'Borrador de memorial en revisión con el solicitante vía WhatsApp.',
  },
];

async function runSeed() {
  console.log('🌱 [SEED] Iniciando siembra de datos en Supabase...');

  // 1. Sembrar Artículos de Blog
  for (const post of SEED_POSTS) {
    const { error } = await supabase
      .from('posts')
      .upsert(post, { onConflict: 'slug' });

    if (error) {
      console.error(`❌ Error sembrando artículo "${post.title}":`, error.message);
    } else {
      console.log(`✅ Artículo sembrado: ${post.title}`);
    }
  }

  // 2. Sembrar Casos de Ejemplo
  for (const c of SEED_CASES) {
    const { data: insertedCase, error } = await supabase
      .from('cases')
      .upsert(c, { onConflict: 'case_code' })
      .select('id')
      .single();

    if (error) {
      console.error(`❌ Error sembrando caso "${c.case_code}":`, error.message);
    } else {
      console.log(`✅ Caso sembrado: ${c.case_code} (${c.full_name})`);

      // Crear una nota interna inicial
      if (insertedCase?.id && c.internal_notes) {
        await supabase.from('case_notes').insert({
          case_id: insertedCase.id,
          author_email: 'admin@atlanticayasociados.com',
          content: c.internal_notes,
        });
      }
    }
  }

  console.log('🎉 [SEED] Proceso completado exitosamente.');
}

runSeed().catch(console.error);
