'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  BookOpen,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  LogOut,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  FileCheck,
  User,
  X,
  Phone,
  Mail,
  Building,
  Loader2,
  Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CaseRecord, CaseStatus, BlogPost } from '@/types';

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  description: string;
  itemHighlight?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'cases' | 'blog'>('cases');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  // Estados de Casos
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [appointmentFilter, setAppointmentFilter] = useState<string>('todos');
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  // Estados para notas internas
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Estados de Blog
  const [posts, setPosts] = useState<BlogPost[]>([]);

  // Modal de confirmación personalizado (reemplaza confirm() y alert() nativos del navegador)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Notificación Toast in-app
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Escuchar parámetros de URL para activar la pestaña de Blog y mostrar alertas
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'blog') {
      setActiveTab('blog');
    } else if (tabParam === 'cases') {
      setActiveTab('cases');
    }

    if (searchParams.get('created') === 'true') {
      showToast('¡Artículo publicado exitosamente en el blog!', 'success');
    } else if (searchParams.get('updated') === 'true') {
      showToast('¡Artículo actualizado correctamente!', 'success');
    }
  }, [searchParams]);

  // Carga inicial y verificación de sesión
  useEffect(() => {
    checkSessionAndFetchData();
  }, []);

  const checkSessionAndFetchData = async () => {
    setLoading(true);
    try {
      // 1. Obtener artículos del blog desde la API unificada
      const postsRes = await fetch('/api/admin/posts');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        if (postsData.posts) {
          setPosts(postsData.posts);
        }
      }

      // 2. Obtener casos desde la API unificada (soporta local y Supabase)
      const casesRes = await fetch('/api/admin/cases');
      if (casesRes.ok) {
        const casesData = await casesRes.json();
        if (Array.isArray(casesData.cases)) {
          setCases(casesData.cases as CaseRecord[]);
        }
      }

      // 3. Obtener correo del usuario autenticado si hay sesión
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || '');
      }
    } catch {
      // Fallback amigable
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    router.push('/admin/login');
  };

  // Filtrado reactivo de casos
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.case_code && c.case_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.institution && c.institution.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;
    const matchesAppointment =
      appointmentFilter === 'todos' ||
      (appointmentFilter === 'si' && c.appointment_requested) ||
      (appointmentFilter === 'no' && !c.appointment_requested);

    return matchesSearch && matchesStatus && matchesAppointment;
  });

  // Cambiar estado de caso
  const handleStatusChange = async (caseId: string, newStatus: CaseStatus) => {
    try {
      await fetch(`/api/admin/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
      );

      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      showToast(`Estado del caso actualizado a "${newStatus}".`, 'success');
    } catch (err) {
      showToast('Error actualizando estado.', 'error');
    }
  };

  // Abrir modal para eliminar caso
  const promptDeleteCase = (caseItem: CaseRecord) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar este caso?',
      description: 'Esta acción eliminará de forma permanente el expediente ciudadano, su historial de notas internas y todos los archivos adjuntos vinculados. Esta operación no se puede deshacer.',
      itemHighlight: `${caseItem.case_code || 'Caso'} — ${caseItem.full_name}`,
      confirmText: 'Sí, Eliminar Caso',
      cancelText: 'Cancelar',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/cases/${caseItem.id}/delete`, {
            method: 'DELETE',
          });

          setCases((prev) => prev.filter((c) => c.id !== caseItem.id));
          if (selectedCase?.id === caseItem.id) {
            setSelectedCase(null);
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast('El caso y sus documentos han sido eliminados.', 'success');
        } catch {
          showToast('Error eliminando el caso.', 'error');
        }
      },
    });
  };

  // Agregar nota interna
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNoteContent.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/cases/${selectedCase.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteContent,
          authorEmail: userEmail,
        }),
      });

      const data = await res.json();
      if (data.note) {
        const updatedNotes = [...(selectedCase.notes || []), data.note];
        setSelectedCase({ ...selectedCase, notes: updatedNotes, internal_notes: newNoteContent });
        setCases((prev) =>
          prev.map((c) =>
            c.id === selectedCase.id
              ? { ...c, notes: updatedNotes, internal_notes: newNoteContent }
              : c
          )
        );
        setNewNoteContent('');
        showToast('Nota interna registrada exitosamente.', 'success');
      }
    } catch {
      showToast('Error guardando la nota.', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  // Descargar archivo mediante enlace firmado
  const handleDownloadSignedUrl = async (caseId: string, filePath: string) => {
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      if (data.signedUrl && data.signedUrl !== '#') {
        window.open(data.signedUrl, '_blank');
      } else {
        showToast(data.note || 'No fue posible generar el enlace de descarga.', 'info');
      }
    } catch {
      showToast('Error solicitando enlace de descarga.', 'error');
    }
  };

  // Toggle publicar / despublicar artículo
  const handleTogglePublish = async (post: BlogPost) => {
    const newPublished = !post.published;
    try {
      await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, published: newPublished }),
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: newPublished } : p))
      );
      showToast(
        newPublished ? 'Artículo publicado en el sitio web.' : 'Artículo cambiado a borrador.',
        'success'
      );
    } catch {
      showToast('Error cambiando estado de publicación.', 'error');
    }
  };

  // Abrir modal para eliminar artículo
  const promptDeletePost = (post: BlogPost) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar este artículo del blog?',
      description: 'El artículo será retirado definitivamente del catálogo público y del panel de administración.',
      itemHighlight: post.title,
      confirmText: 'Sí, Eliminar Artículo',
      cancelText: 'Cancelar',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
          setPosts((prev) => prev.filter((p) => p.id !== post.id));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast('Artículo eliminado del blog.', 'success');
        } catch {
          showToast('Error eliminando el artículo.', 'error');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafc] pb-20">
      {/* Toast Notification Flotante */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-red-50 border-red-700'
                : 'bg-azul-rey text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-dorado flex-shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white ml-2 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Barra superior de administración */}
      <nav className="sticky top-0 z-30 bg-[#0b1522] text-white border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-base tracking-widest text-white">
            ATLÁNTICA
          </span>
          <span className="font-serif font-bold text-xs tracking-wider text-dorado">
            &amp; ASOCIADOS
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            Panel Admin
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 hidden sm:inline">Usuario:</span>
          <span className="text-slate-200 font-semibold">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-400 p-1 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      {/* Contenedor Principal */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-9 space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500">Administración / Atlántica &amp; Asociados</span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-slate-900">Centro de gestión</h1>
            <p className="mt-1 text-sm text-slate-500">Seguimiento de expedientes y publicaciones.</p>
          </div>
          <button
            onClick={checkSessionAndFetchData}
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-azul-rey"
            title="Recargar datos"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('cases')}
              className={`shrink-0 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'cases'
                  ? 'bg-azul-rey text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileCheck className="w-4 h-4 text-dorado" />
              <span>Casos Recibidos ({cases.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`shrink-0 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'blog'
                  ? 'bg-azul-rey text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-dorado" />
              <span>Gestión del Blog ({posts.length})</span>
            </button>
          </div>

        </div>

        {/* ====================================================================
            SECCIÓN 1: GESTIÓN DE CASOS
            ==================================================================== */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            {/* Contadores y Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-azul-rey shadow-sm">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold">Total Casos</span>
                <span className="text-2xl font-bold text-azul-rey">{cases.length}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm">
                <span className="text-[11px] text-blue-600 uppercase tracking-wider block font-bold">Nuevos</span>
                <span className="text-2xl font-bold text-blue-700">
                  {cases.filter((c) => c.status === 'nuevo').length}
                </span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm">
                <span className="text-[11px] text-amber-600 uppercase tracking-wider block font-bold">Citas Solicitadas</span>
                <span className="text-2xl font-bold text-amber-700">
                  {cases.filter((c) => c.appointment_requested).length}
                </span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-sm">
                <span className="text-[11px] text-purple-600 uppercase tracking-wider block font-bold">En Proceso / Análisis</span>
                <span className="text-2xl font-bold text-purple-700">
                  {cases.filter((c) => c.status === 'en_proceso' || c.status === 'en_analisis').length}
                </span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Estado:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="nuevo">Nuevos</option>
                    <option value="en_analisis">En análisis</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="finalizado">Finalizados</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Cita:</span>
                  <select
                    value={appointmentFilter}
                    onChange={(e) => setAppointmentFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="todos">Todas</option>
                    <option value="si">Solo con cita solicitada</option>
                    <option value="no">Sin cita</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de Casos */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Código / Fecha</th>
                      <th className="py-3.5 px-4">Ciudadano</th>
                      <th className="py-3.5 px-4">Institución</th>
                      <th className="py-3.5 px-4">Cita Solicitada</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          No se encontraron casos con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-azul-rey block">
                              {c.case_code || 'CAS-S/N'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.created_at).toLocaleDateString('es-CR')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{c.full_name}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{c.phone}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                            {c.institution || 'No indicada'}
                          </td>
                          <td className="py-3.5 px-4">
                            {c.appointment_requested ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Calendar className="w-3 h-3 text-amber-600" />
                                Cita: {c.preferred_time_slot === 'manana' ? 'Mañana' : 'Tarde'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={c.status}
                              onChange={(e) => handleStatusChange(c.id, e.target.value as CaseStatus)}
                              className="text-xs rounded-lg border border-slate-300 py-1 px-2 font-medium bg-white"
                            >
                              <option value="nuevo">Nuevo</option>
                              <option value="en_analisis">En análisis</option>
                              <option value="en_proceso">En proceso</option>
                              <option value="finalizado">Finalizado</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedCase(c)}
                              className="px-2.5 py-1 rounded-lg bg-azul-rey text-white hover:bg-azul-rey-dark font-semibold text-xs transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Ver
                            </button>
                            <button
                              onClick={() => promptDeleteCase(c)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar caso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            SECCIÓN 2: GESTIÓN DE BLOG
            ==================================================================== */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-azul-rey font-serif">Artículos del Blog</h2>
                <p className="text-xs text-slate-500">Cree, edite y publique artículos para el sitio.</p>
              </div>

              <Link
                href="/admin/blog/new"
                className="inline-flex items-center gap-2 bg-azul-rey hover:bg-azul-rey-dark text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
              >
                <Plus className="w-4 h-4 text-dorado" />
                <span>Nuevo Artículo</span>
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Título</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-14 text-center text-sm text-slate-500">
                        Aún no hay artículos en el blog.
                      </td>
                    </tr>
                  ) : posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-sm">
                        {post.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                            post.published
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {post.published ? 'Publicado' : 'Borrador'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(post.created_at).toLocaleDateString('es-CR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-azul-rey"
                            title="Ver en el sitio"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => promptDeletePost(post)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL DE CONFIRMACIÓN ELEGANTE (REEMPLAZA CONFIRM() DEL NAVEGADOR)
          ==================================================================== */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  confirmModal.isDestructive ? 'bg-red-50 text-red-600' : 'bg-azul-rey/10 text-azul-rey'
                }`}
              >
                {confirmModal.isDestructive ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            {confirmModal.itemHighlight && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-medium text-slate-800 break-all">
                {confirmModal.itemHighlight}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {confirmModal.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition-all ${
                  confirmModal.isDestructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-azul-rey hover:bg-azul-rey-dark'
                }`}
              >
                {confirmModal.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DETALLADO DE CASO
          ==================================================================== */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-azul-rey bg-azul-rey/10 px-2 py-0.5 rounded">
                  {selectedCase.case_code || 'CASO'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedCase.full_name}
                </h3>
                <span className="text-xs text-slate-400">
                  Recibido el {new Date(selectedCase.created_at).toLocaleString('es-CR')}
                </span>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos de contacto y cita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-azul-rey" />
                  <span className="font-bold">Teléfono/WhatsApp:</span>
                  <a
                    href={`https://wa.me/${selectedCase.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    {selectedCase.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-azul-rey" />
                  <span className="font-bold">Correo:</span>
                  <span>{selectedCase.email || 'No proporcionado'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Building className="w-3.5 h-3.5 text-azul-rey" />
                  <span className="font-bold">Institución:</span>
                  <span>{selectedCase.institution || 'No indicada'}</span>
                </div>
              </div>

              {/* Solicitud de Cita */}
              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 space-y-1.5">
                <span className="font-bold text-slate-900 block">Solicitud de Cita:</span>
                {selectedCase.appointment_requested ? (
                  <div className="bg-amber-100/70 p-2.5 rounded-lg border border-amber-300 text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Día solicitado: {selectedCase.preferred_date || 'A convenir'}
                    </p>
                    <p className="text-[11px]">
                      Franja: {selectedCase.preferred_time_slot === 'manana' ? 'Mañana (7am - 12md)' : 'Tarde (1pm - 5pm)'}
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-400">El usuario no solicitó cita previa.</span>
                )}
              </div>
            </div>

            {/* Descripción completa de los hechos */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Descripción del Caso
              </h4>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedCase.description}
              </div>
            </div>

            {/* Documentos Adjuntos y URLs firmadas de corta duración */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Documentos Adjuntos ({selectedCase.files?.length || 0})
              </h4>
              {!selectedCase.files || selectedCase.files.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No se adjuntaron documentos con este caso.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedCase.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-azul-rey flex-shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{file.file_name}</span>
                        <span className="text-slate-400 text-[10px]">
                          ({(file.file_size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadSignedUrl(selectedCase.id, file.file_path)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-azul-rey hover:bg-azul-rey-dark text-white rounded-lg font-bold text-[11px] shadow-sm transition-colors flex-shrink-0"
                      >
                        <Download className="w-3 h-3 text-dorado" />
                        <span>Descargar</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Sección de Notas Internas */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Notas Internas del Equipo
              </h4>

              {selectedCase.notes && selectedCase.notes.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {selectedCase.notes.map((note) => (
                    <div key={note.id} className="p-2.5 bg-slate-100 rounded-lg text-xs border border-slate-200">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold">{note.author_email || 'Admin'}</span>
                        <span>{new Date(note.created_at).toLocaleString('es-CR')}</span>
                      </div>
                      <p className="text-slate-800">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escriba una nota interna sobre este expediente..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNoteContent.trim()}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-negro text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                >
                  {addingNote ? 'Guardando...' : 'Agregar Nota'}
                </button>
              </form>
            </div>

            {/* Acciones de pie de modal */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => promptDeleteCase(selectedCase)}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Expediente</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafc] flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-azul-rey" />
            <span>Cargando panel de administración...</span>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
