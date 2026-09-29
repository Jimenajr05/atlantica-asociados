import fs from 'fs';
import path from 'path';
import {
  AppointmentBooking,
  AppointmentStatus,
  CaseRecord,
  CaseStatus,
  CaseNoteRecord,
  CaseFileRecord,
} from '../types';
import { createAdminClient } from './supabase-admin';

const dataDir = path.resolve(process.cwd(), 'data');
const casesFilePath = path.join(dataDir, 'cases.json');

function ensureLocalStore(): CaseRecord[] {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(casesFilePath)) {
      fs.writeFileSync(casesFilePath, '[]', 'utf-8');
      return [];
    }
    const content = fs.readFileSync(casesFilePath, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error inicializando almacenamiento local de casos:', err);
    return [];
  }
}

function saveLocalStore(cases: CaseRecord[]) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(casesFilePath, JSON.stringify(cases, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando en archivo local de casos:', err);
  }
}

// 1. Obtener todos los casos
export async function getAllCases(): Promise<CaseRecord[]> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('cases')
        .select(`
          *,
          files:case_files(*),
          notes:case_notes(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        saveLocalStore(data as CaseRecord[]);
        return data as CaseRecord[];
      }
    } catch (e) {
      console.warn('Fallback a almacenamiento local para casos:', e);
    }
  }

  return ensureLocalStore();
}

export async function getAppointmentBookings(): Promise<AppointmentBooking[]> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    const { data, error } = await adminSupabase
      .from('cases')
      .select('id, case_code, full_name, phone, email, preferred_date, preferred_time_slot, appointment_status')
      .eq('appointment_requested', true);

    if (error) throw error;

    return (data || []).map((booking) => ({
      ...booking,
      appointment_status: booking.appointment_status || 'pendiente',
    })) as AppointmentBooking[];
  }

  return ensureLocalStore()
    .filter((record) => record.appointment_requested)
    .map((record) => ({
        id: record.id,
        case_code: record.case_code,
        full_name: record.full_name,
        phone: record.phone,
        email: record.email,
        preferred_date: record.preferred_date,
        preferred_time_slot: record.preferred_time_slot,
        appointment_status: record.appointment_status || 'pendiente',
      }));
}

// 2. Obtener un caso por ID o por Código de Caso
export async function getCaseById(idOrCode: string): Promise<CaseRecord | null> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('cases')
        .select(`
          *,
          files:case_files(*),
          notes:case_notes(*)
        `)
        .or(`id.eq.${idOrCode},case_code.eq.${idOrCode}`)
        .single();

      if (!error && data) {
        return data as CaseRecord;
      }
    } catch (e) {
      // Fallback
    }
  }

  const all = ensureLocalStore();
  const found = all.find((c) => c.id === idOrCode || c.case_code === idOrCode);
  return found || null;
}

// 3. Crear y registrar un nuevo caso
export async function createCaseRecord(
  caseData: Partial<CaseRecord>,
  filesMeta: Array<{ name: string; size: number; mimeType: string; path?: string }> = []
): Promise<CaseRecord> {
  const now = new Date().toISOString();
  const newId = `case-${Date.now()}`;

  const files: CaseFileRecord[] = filesMeta.map((f, i) => ({
    id: `file-${Date.now()}-${i}`,
    case_id: newId,
    file_name: f.name,
    file_path: f.path || `${newId}/${f.name}`,
    file_size: f.size,
    mime_type: f.mimeType,
    created_at: now,
  }));

  const newRecord: CaseRecord = {
    id: newId,
    case_code: caseData.case_code || `CAS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    created_at: now,
    full_name: caseData.full_name || '',
    phone: caseData.phone || '',
    email: caseData.email || null,
    institution: caseData.institution || null,
    description: caseData.description || '',
    privacy_accepted: Boolean(caseData.privacy_accepted),
    appointment_requested: Boolean(caseData.appointment_requested),
    appointment_status: caseData.appointment_requested
      ? caseData.appointment_status || 'pendiente'
      : null,
    preferred_date: caseData.preferred_date || null,
    preferred_time_slot: caseData.preferred_time_slot || null,
    status: caseData.status || 'nuevo',
    internal_notes: caseData.internal_notes || null,
    ip_address: caseData.ip_address || null,
    files,
    notes: [],
  };

  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data: dbCase, error: caseError } = await adminSupabase
        .from('cases')
        .insert({
          case_code: newRecord.case_code,
          full_name: newRecord.full_name,
          phone: newRecord.phone,
          email: newRecord.email,
          institution: newRecord.institution,
          description: newRecord.description,
          privacy_accepted: newRecord.privacy_accepted,
          appointment_requested: newRecord.appointment_requested,
          appointment_status: newRecord.appointment_status,
          preferred_date: newRecord.preferred_date,
          preferred_time_slot: newRecord.preferred_time_slot,
          status: newRecord.status,
          ip_address: newRecord.ip_address,
        })
        .select()
        .single();

      if (!caseError && dbCase) {
        newRecord.id = dbCase.id;
      }
    } catch (err) {
      console.error('Error insertando caso en Supabase:', err);
    }
  }

  // Guardar en el almacenamiento local persistente
  const current = ensureLocalStore();
  const updated = [newRecord, ...current.filter((c) => c.id !== newRecord.id && c.case_code !== newRecord.case_code)];
  saveLocalStore(updated);

  return newRecord;
}

// 4. Actualizar estado de caso
export async function updateCaseStatus(id: string, status: CaseStatus): Promise<boolean> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      await adminSupabase.from('cases').update({ status }).eq('id', id);
    } catch (e) {
      console.error('Error actualizando estado en Supabase:', e);
    }
  }

  const current = ensureLocalStore();
  const idx = current.findIndex((c) => c.id === id || c.case_code === id);
  if (idx !== -1) {
    current[idx].status = status;
    saveLocalStore(current);
    return true;
  }
  return false;
}

export async function updateCaseAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<boolean> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    const { error } = await adminSupabase
      .from('cases')
      .update({ appointment_status: status })
      .eq('id', id);

    if (error) throw error;
  }

  const current = ensureLocalStore();
  const record = current.find((item) => item.id === id || item.case_code === id);
  if (!record || !record.appointment_requested) return false;

  record.appointment_status = status;
  saveLocalStore(current);
  return true;
}

export async function updateCaseAppointmentTime(
  id: string,
  timeSlot: CaseRecord['preferred_time_slot']
): Promise<boolean> {
  if (!timeSlot || timeSlot === 'manana' || timeSlot === 'tarde') return false;

  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    const { data, error } = await adminSupabase
      .from('cases')
      .update({ preferred_time_slot: timeSlot })
      .eq('id', id)
      .eq('appointment_requested', true)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return false;
  }

  const current = ensureLocalStore();
  const record = current.find((item) => item.id === id || item.case_code === id);
  if (!record || !record.appointment_requested) return false;

  record.preferred_time_slot = timeSlot;
  saveLocalStore(current);
  return true;
}

// 5. Agregar nota interna a un caso
export async function addCaseNote(
  caseId: string,
  content: string,
  authorEmail: string = 'admin'
): Promise<CaseNoteRecord> {
  const now = new Date().toISOString();
  const newNote: CaseNoteRecord = {
    id: `note-${Date.now()}`,
    case_id: caseId,
    content: content.trim(),
    author_email: authorEmail,
    created_at: now,
  };

  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('case_notes')
        .insert({
          case_id: caseId,
          content: newNote.content,
          author_email: newNote.author_email,
        })
        .select()
        .single();

      if (!error && data) {
        newNote.id = data.id;
      }

      await adminSupabase
        .from('cases')
        .update({ internal_notes: newNote.content })
        .eq('id', caseId);
    } catch (e) {
      console.error('Error insertando nota en Supabase:', e);
    }
  }

  const current = ensureLocalStore();
  const idx = current.findIndex((c) => c.id === caseId || c.case_code === caseId);
  if (idx !== -1) {
    current[idx].notes = [newNote, ...(current[idx].notes || [])];
    current[idx].internal_notes = newNote.content;
    saveLocalStore(current);
  }

  return newNote;
}

// 6. Eliminar un caso
export async function deleteCaseRecord(id: string): Promise<boolean> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      await adminSupabase.from('case_notes').delete().eq('case_id', id);
      await adminSupabase.from('case_files').delete().eq('case_id', id);
      await adminSupabase.from('cases').delete().eq('id', id);
    } catch (e) {
      console.error('Error eliminando en Supabase:', e);
    }
  }

  const current = ensureLocalStore();
  const updated = current.filter((c) => c.id !== id && c.case_code !== id);
  saveLocalStore(updated);
  return true;
}
