import { CaseRecord, CaseStatus, CaseNoteRecord } from '@/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

// 1. Obtener todos los casos desde el backend
export async function getAllCases(): Promise<CaseRecord[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/cases`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.cases)) {
        return data.cases;
      }
    }
  } catch (err) {
    console.warn('[FRONTEND] Backend no disponible para getAllCases():', err);
  }

  return [];
}

// 2. Actualizar estado de caso
export async function updateCaseStatus(id: string, status: CaseStatus): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/cases/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.error('[FRONTEND] Error actualizando estado de caso:', err);
    return false;
  }
}

// 3. Agregar nota interna
export async function addCaseNote(caseId: string, content: string, authorEmail: string = 'admin'): Promise<CaseNoteRecord | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/cases/${encodeURIComponent(caseId)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, authorEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.note;
    }
  } catch (err) {
    console.error('[FRONTEND] Error agregando nota a caso:', err);
  }
  return null;
}

// 4. Eliminar caso
export async function deleteCaseRecord(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/cases/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('[FRONTEND] Error eliminando caso:', err);
    return false;
  }
}
