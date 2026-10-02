'use client';

import { AppointmentAgenda } from '@/components/AppointmentAgenda';
import { PageHero } from '@/components/PageHero';
import { adminFetch } from '@/lib/admin-fetch';
import { createClient } from '@/lib/supabase/client';
import { AppointmentStatus, AppointmentTimePreference, BlogPost, CaseRecord, CaseStatus, TimeSlot } from '@/types';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Building,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Info,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

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

function formatCaseAppointmentTime(value?: AppointmentTimePreference | null) {
  const legacyValue = String(value || '');
  if (legacyValue === 'manana') return 'Mañana · hora por asignar';
  if (legacyValue === 'tarde') return 'Tarde · hora por asignar';
  if (!legacyValue) return 'Hora por asignar';
  const [hour, minute] = legacyValue.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 'Hora por confirmar';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'cases' | 'blog' | 'agenda'>('cases');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    router.prefetch('/admin/login');
  }, [router]);

  // Estados de Casos
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [appointmentFilter, setAppointmentFilter] = useState<string>('todos');
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [agendaInitialDate, setAgendaInitialDate] = useState('');

  // Paginación: 5 elementos en teléfono y 10 en pantallas más amplias.
  const [casesPage, setCasesPage] = useState(1);
  const [blogPage, setBlogPage] = useState(1);
  const [ITEMS_PER_PAGE, setItemsPerPage] = useState(5);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 639px)');
    const updatePageSize = () => {
      setItemsPerPage(mobileQuery.matches ? 5 : 10);
      setCasesPage(1);
      setBlogPage(1);
    };
    updatePageSize();
    mobileQuery.addEventListener('change', updatePageSize);
    return () => mobileQuery.removeEventListener('change', updatePageSize);
  }, []);

  useEffect(() => {
    setCasesPage(1);
  }, [searchQuery, statusFilter, appointmentFilter]);

  // Estados para notas internas
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Estados de Blog
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postCategory, setPostCategory] = useState<'blog' | 'noticias'>('blog');

  useEffect(() => { setBlogPage(1); }, [postCategory]);

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
    if (!searchParams) return;
    const tabParam = searchParams.get('tab');
    setPostCategory(searchParams.get('category') === 'noticias' ? 'noticias' : 'blog');
    if (tabParam === 'blog') {
      setActiveTab('blog');
    } else if (tabParam === 'agenda') {
      setActiveTab('agenda');
    } else if (tabParam === 'cases') {
      setActiveTab('cases');
    }

    if (searchParams.get('created') === 'true') {
      showToast('¡Publicación guardada exitosamente!', 'success');
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
      const postsRes = await adminFetch('/api/admin/posts');
      if (postsRes.status === 401) { router.replace('/admin/login'); return; }
      if (!postsRes.ok) throw new Error('No se pudieron cargar las publicaciones.');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        if (postsData.posts) {
          setPosts(postsData.posts);
        }
      }

      // 2. Obtener casos desde la API unificada (soporta local y Supabase)
      const casesRes = await adminFetch('/api/admin/cases');
      if (!casesRes.ok) throw new Error('No se pudieron cargar los casos.');
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
      showToast('No se pudieron cargar los datos. Revise su sesión y conexión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/admin/login');
    } catch {
      setSigningOut(false);
      showToast('No se pudo cerrar la sesión. Inténtelo de nuevo.', 'error');
    }
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

  const totalCasesPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE) || 1;
  const paginatedCases = filteredCases.slice(
    (casesPage - 1) * ITEMS_PER_PAGE,
    casesPage * ITEMS_PER_PAGE
  );

  const filteredPosts = posts.filter((post) => (post.category || 'blog') === postCategory);
  const totalBlogPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) || 1;
  const currentBlogPage = Math.min(blogPage, totalBlogPages);
  const paginatedPosts = filteredPosts.slice(
    (currentBlogPage - 1) * ITEMS_PER_PAGE,
    currentBlogPage * ITEMS_PER_PAGE
  );

  const activeAppointmentCount = cases.filter((caseItem) =>
    caseItem.appointment_requested && caseItem.appointment_status !== 'cancelada'
  ).length;

  // Cambiar estado de caso
  const handleStatusChange = async (caseId: string, newStatus: CaseStatus) => {
    try {
      const response = await adminFetch(`/api/admin/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el estado.');

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

  const handleAppointmentStatusChange = async (caseId: string, status: AppointmentStatus) => {
    const response = await adminFetch(`/api/admin/cases/${caseId}/appointment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo actualizar la cita.');

    setCases((prev) => prev.map((caseItem) =>
      caseItem.id === caseId ? { ...caseItem, appointment_status: status } : caseItem
    ));
    setSelectedCase((prev) => prev?.id === caseId ? { ...prev, appointment_status: status } : prev);
    showToast(
      status === 'confirmada'
        ? 'Cita confirmada. Las notificaciones se procesarán automáticamente.'
        : status === 'cancelada'
          ? 'Solicitud cancelada y franja liberada.'
          : 'Estado de la cita actualizado.',
      'success'
    );
  };

  const handleAppointmentTimeChange = async (caseId: string, timeSlot: TimeSlot) => {
    const response = await adminFetch(`/api/admin/cases/${caseId}/appointment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredTimeSlot: timeSlot }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo asignar la hora.');

    setCases((prev) => prev.map((caseItem) =>
      caseItem.id === caseId ? { ...caseItem, preferred_time_slot: timeSlot } : caseItem
    ));
    setSelectedCase((prev) => prev?.id === caseId ? { ...prev, preferred_time_slot: timeSlot } : prev);
    showToast(`Hora asignada: ${formatCaseAppointmentTime(timeSlot)}.`, 'success');
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
          const response = await adminFetch(`/api/admin/cases/${caseItem.id}/delete`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('No se pudo eliminar el caso.');

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
      const res = await adminFetch(`/api/admin/cases/${selectedCase.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteContent,
          authorEmail: userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la nota.');
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
      const res = await adminFetch(`/api/admin/cases/${caseId}/signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      if (data.signedUrl && data.signedUrl !== '#') {
        if (data.signedUrl.startsWith('/api/')) {
          const download = await adminFetch(data.signedUrl);
          if (!download.ok) throw new Error('No se pudo descargar el documento.');
          const url = URL.createObjectURL(await download.blob());
          const link = document.createElement('a');
          link.href = url;
          link.download = decodeURIComponent(download.headers.get('X-File-Name') || 'documento');
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
          window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        }
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
      const response = await adminFetch(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, published: newPublished }),
      });
      if (!response.ok) throw new Error('No se pudo cambiar el estado de publicación.');

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
      title: '¿Eliminar esta publicación?',
      description: 'El artículo será retirado definitivamente del catálogo público y del panel de administración.',
      itemHighlight: post.title,
      confirmText: 'Sí, Eliminar Artículo',
      cancelText: 'Cancelar',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await adminFetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('No se pudo eliminar la publicación.');
          setPosts((prev) => prev.filter((p) => p.id !== post.id));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast('Publicación eliminada.', 'success');
        } catch {
          showToast('Error eliminando el artículo.', 'error');
        }
      },
    });
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin" /><span className="sr-only">Cargando administración</span></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
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
      <nav className="sticky top-0 z-30 border-b border-white/10 border-t-2 border-t-dorado/80 bg-[#101d2d] px-4 py-3 text-white shadow-md shadow-slate-900/10 sm:px-8">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              aria-label="Atlántica & Asociados, panel de administración"
              className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-white"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dorado/30 bg-white/5 p-1">
                <Image
                  src="/assets/logo-icono.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="min-w-0 leading-none">
                <span className="block whitespace-nowrap font-serif text-[12px] font-bold tracking-wider text-white sm:text-sm">
                  ATLÁNTICA <span className="text-dorado">&amp; ASOCIADOS</span>
                </span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-slate-400">
                  Poder y Estrategia
                </span>
              </span>
            </Link>
            <span className="hidden items-center gap-1.5 rounded border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-dorado" />
              Administración
            </span>
          </div>

          <div className="flex w-full min-w-0 items-center justify-between gap-3 border-t border-white/10 pt-3 sm:w-auto sm:justify-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-dorado">
                <User className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                  Cuenta activa
                </span>
                <span className="block max-w-[58vw] truncate text-xs font-medium text-white sm:max-w-[220px]">
                  {userEmail || 'Sesión de administración'}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-busy={signingOut}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-200 disabled:cursor-wait disabled:opacity-60"
              title="Cerrar sesión"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span aria-live="polite">{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </div>
      </nav>

      <PageHero
        eyebrow="Panel de administración"
        title="Centro de gestión"
        description="Seguimiento de expedientes y publicaciones."
        asideValue={String(cases.length).padStart(2, '0')}
        asideLabel="casos recibidos"
      />

      {/* Contenedor Principal */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-9 space-y-7">

        {/* Pestañas de Navegación del Panel */}
        <div className="flex items-center gap-2 sm:justify-between sm:gap-3">
          <div className="inline-flex min-w-0 flex-1 items-center gap-1 overflow-x-auto border-b border-slate-200">
            <button
              onClick={() => setActiveTab('cases')}
              aria-label={`Casos Recibidos (${cases.length})`}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[11px] font-bold transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                activeTab === 'cases'
                  ? 'border-azul-rey text-azul-rey'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className={`w-4 h-4 ${activeTab === 'cases' ? 'text-dorado' : 'text-slate-400'}`} />
              <span className="sm:hidden">Casos</span>
              <span className="hidden sm:inline">Casos Recibidos ({cases.length})</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none sm:hidden ${activeTab === 'cases' ? 'bg-azul-rey/10 text-azul-rey' : 'bg-slate-100 text-slate-600'}`}>
                {cases.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              aria-label={`Blog y noticias (${posts.length})`}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[11px] font-bold transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                activeTab === 'blog'
                  ? 'border-azul-rey text-azul-rey'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'blog' ? 'text-dorado' : 'text-slate-400'}`} />
              <span className="sm:hidden">Blog & noticias</span>
              <span className="hidden sm:inline">Blog & noticias ({posts.length})</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none sm:hidden ${activeTab === 'blog' ? 'bg-azul-rey/10 text-azul-rey' : 'bg-slate-100 text-slate-600'}`}>
                {posts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              aria-label={`Agenda de citas (${activeAppointmentCount})`}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[11px] font-bold transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                activeTab === 'agenda'
                  ? 'border-azul-rey text-azul-rey'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className={`h-4 w-4 ${activeTab === 'agenda' ? 'text-dorado' : 'text-slate-400'}`} />
              <span className="sm:hidden">Agenda</span>
              <span className="hidden sm:inline">Agenda de citas ({activeAppointmentCount})</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none sm:hidden ${activeTab === 'agenda' ? 'bg-azul-rey/10 text-azul-rey' : 'bg-slate-100 text-slate-600'}`}>
                {activeAppointmentCount}
              </span>
            </button>
          </div>
          <button
            onClick={checkSessionAndFetchData}
            aria-label="Actualizar datos"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white p-0 text-slate-700 shadow-sm transition-colors hover:border-azul-rey/40 hover:bg-azul-rey-50 hover:text-azul-rey sm:h-auto sm:w-auto sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-xs sm:font-semibold"
            title="Recargar datos"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* ====================================================================
            SECCIÓN 1: GESTIÓN DE CASOS
            ==================================================================== */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            {/* Contadores y Métricas */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 xl:p-5">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block break-words text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px]">Total de casos</span>
                    <span className="mt-1 block text-2xl font-semibold tabular-nums leading-none text-slate-900 sm:text-3xl">{cases.length}</span>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-azul-rey-50 text-azul-rey sm:h-9 sm:w-9">
                    <FileText className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 xl:p-5">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block break-words text-[9px] font-bold uppercase tracking-wider text-sky-700 sm:text-[11px]">Nuevos</span>
                    <span className="mt-1 block text-2xl font-semibold tabular-nums leading-none text-sky-800 sm:text-3xl">
                      {cases.filter((c) => c.status === 'nuevo').length}
                    </span>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700 sm:h-9 sm:w-9">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 xl:p-5">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block break-words text-[9px] font-bold uppercase tracking-wider text-amber-700 sm:text-[11px]">Citas solicitadas</span>
                    <span className="mt-1 block text-2xl font-semibold tabular-nums leading-none text-amber-800 sm:text-3xl">
                      {cases.filter((c) => c.appointment_requested).length}
                    </span>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 sm:h-9 sm:w-9">
                    <Calendar className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4 xl:p-5">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block break-words text-[9px] font-bold uppercase tracking-wider text-emerald-700 sm:text-[11px]">En seguimiento</span>
                    <span className="mt-1 block text-2xl font-semibold tabular-nums leading-none text-emerald-800 sm:text-3xl">
                      {cases.filter((c) => c.status === 'en_proceso' || c.status === 'en_analisis').length}
                    </span>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 sm:h-9 sm:w-9">
                    <Clock className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-md border border-slate-300 bg-slate-50/60 focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
                />
              </div>

              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                <div className="flex w-full min-w-0 items-center gap-2 text-xs text-slate-600 md:w-auto">
                  <label htmlFor="case-status-filter" className="flex w-[72px] shrink-0 items-center gap-1.5 md:w-auto">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span>Estado:</span>
                  </label>
                  <select
                    id="case-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium md:w-auto"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="nuevo">Nuevos</option>
                    <option value="en_analisis">En análisis</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="finalizado">Finalizados</option>
                  </select>
                </div>

                <div className="flex w-full min-w-0 items-center gap-2 text-xs text-slate-600 md:w-auto">
                  <label htmlFor="case-appointment-filter" className="w-[72px] shrink-0 md:w-auto">
                    Cita:
                  </label>
                  <select
                    id="case-appointment-filter"
                    value={appointmentFilter}
                    onChange={(e) => setAppointmentFilter(e.target.value)}
                    className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium md:w-auto"
                  >
                    <option value="todos">Todas</option>
                    <option value="si">Solo con cita solicitada</option>
                    <option value="no">Sin cita</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de Casos */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
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
                      paginatedCases.map((c) => (
                        <tr key={c.id} className="hover:bg-azul-rey-50/50 transition-colors">
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
                                Cita: {formatCaseAppointmentTime(c.preferred_time_slot)}
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
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedCase(c)}
                              className="h-11 shrink-0 px-2.5 rounded-lg bg-azul-rey text-white hover:bg-azul-rey-dark font-semibold text-xs transition-colors inline-flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Ver
                            </button>
                            <button
                              onClick={() => promptDeleteCase(c)}
                              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar caso"
                              aria-label="Eliminar caso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controles de paginación de casos */}
              {totalCasesPages > 1 && (
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                  <span>
                    Mostrando <strong>{(casesPage - 1) * ITEMS_PER_PAGE + 1}</strong> - <strong>{Math.min(casesPage * ITEMS_PER_PAGE, filteredCases.length)}</strong> de <strong>{filteredCases.length}</strong> casos
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCasesPage((p) => Math.max(p - 1, 1))}
                      disabled={casesPage === 1}
                      className="px-3 py-1.5 rounded border bg-white border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="font-bold text-azul-rey">
                      Página {casesPage} de {totalCasesPages}
                    </span>
                    <button
                      onClick={() => setCasesPage((p) => Math.min(p + 1, totalCasesPages))}
                      disabled={casesPage === totalCasesPages}
                      className="px-3 py-1.5 rounded border bg-white border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            SECCIÓN 2: GESTIÓN DE BLOG
            ==================================================================== */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-azul-rey font-serif">Blog & noticias</h2>
                <p className="text-xs text-slate-500">Cree, edite y publique artículos para el sitio.</p>
              </div>

              <Link
                href={`/admin/blog/new?category=${postCategory}`}
                className="inline-flex items-center justify-center gap-2 bg-azul-rey hover:bg-azul-rey-dark text-white px-4 py-2.5 rounded-md text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 text-dorado" />
                <span>Nueva publicación</span>
              </Link>
            </div>

            <div role="group" aria-label="Tipo de publicaciones" className="flex flex-wrap gap-2">
              {(['blog', 'noticias'] as const).map((type) => (
                <button key={type} type="button" aria-pressed={postCategory === type} onClick={() => setPostCategory(type)} className={`rounded-lg border px-4 py-2 text-sm font-bold ${postCategory === type ? 'border-azul-rey bg-azul-rey text-white' : 'border-slate-200 bg-white text-azul-rey'}`}>
                  {type === 'blog' ? 'Blog' : 'Noticias'} ({posts.filter((post) => (post.category || 'blog') === type).length})
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full table-fixed text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Título</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-14 text-center text-sm text-slate-500">
                        {postCategory === 'noticias' ? 'Aún no hay noticias.' : 'Aún no hay artículos en el blog.'}
                      </td>
                    </tr>
                  ) : paginatedPosts.map((post) => (
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
                            href={`/admin/blog/edit?id=${encodeURIComponent(post.id)}`}
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

              {/* Controles de paginación del blog */}
              {totalBlogPages > 1 && (
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                  <span>
                    Mostrando <strong>{(currentBlogPage - 1) * ITEMS_PER_PAGE + 1}</strong> - <strong>{Math.min(currentBlogPage * ITEMS_PER_PAGE, filteredPosts.length)}</strong> de <strong>{filteredPosts.length}</strong> publicaciones
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBlogPage(Math.max(currentBlogPage - 1, 1))}
                      disabled={currentBlogPage === 1}
                      className="px-3 py-1.5 rounded border bg-white border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="font-bold text-azul-rey">
                      Página {blogPage} de {totalBlogPages}
                    </span>
                    <button
                      onClick={() => setBlogPage(Math.min(currentBlogPage + 1, totalBlogPages))}
                      disabled={blogPage === totalBlogPages}
                      className="px-3 py-1.5 rounded border bg-white border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <AppointmentAgenda
            cases={cases}
            initialDate={agendaInitialDate}
            onAppointmentStatusChange={handleAppointmentStatusChange}
            onAppointmentTimeChange={handleAppointmentTimeChange}
          />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 lg:p-8 space-y-6 max-h-[calc(100dvh-1rem)] overflow-y-auto shadow-2xl border border-slate-200">
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
              <div className="min-w-0 space-y-1.5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-700">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-azul-rey" />
                  <span className="shrink-0 font-bold">Teléfono/WhatsApp:</span>
                  <a
                    href={`https://wa.me/${selectedCase.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-bold text-emerald-700 hover:underline"
                  >
                    {selectedCase.phone}
                  </a>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-700">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-azul-rey" />
                  <span className="shrink-0 font-bold">Correo:</span>
                  <span className="min-w-0 break-all">{selectedCase.email || 'No proporcionado'}</span>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-700">
                  <Building className="w-3.5 h-3.5 shrink-0 text-azul-rey" />
                  <span className="shrink-0 font-bold">Institución:</span>
                  <span className="min-w-0 break-words">{selectedCase.institution || 'No indicada'}</span>
                </div>
              </div>

              {/* Solicitud de Cita */}
              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 space-y-1.5">
                <span className="font-bold text-slate-900 block">Solicitud de Cita:</span>
                {selectedCase.appointment_requested ? (
                  <div className="min-w-0 rounded-lg border border-amber-300 bg-amber-100/70 p-2.5 text-amber-900 space-y-1">
                    <p className="flex flex-wrap items-start gap-x-1 font-bold break-words">
                      <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Día solicitado: {selectedCase.preferred_date || 'A convenir'}
                    </p>
                    <p className="text-[11px]">
                      {selectedCase.preferred_time_slot === 'manana' || selectedCase.preferred_time_slot === 'tarde'
                        ? `Horario preferido: ${formatCaseAppointmentTime(selectedCase.preferred_time_slot)}`
                        : `Hora: ${formatCaseAppointmentTime(selectedCase.preferred_time_slot)} · Cita de una hora`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAgendaInitialDate(selectedCase.preferred_date || '');
                        setSelectedCase(null);
                        setActiveTab('agenda');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold text-azul-rey hover:bg-amber-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul-rey"
                    >
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      Ir a agenda
                    </button>
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
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
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
                      className="flex min-w-0 flex-col gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2 pr-2">
                        <FileText className="w-4 h-4 text-azul-rey flex-shrink-0" />
                        <span className="min-w-0 truncate font-medium text-slate-800">{file.file_name}</span>
                        <span className="shrink-0 text-slate-400 text-[10px]">
                          ({(file.file_size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadSignedUrl(selectedCase.id, file.file_path)}
                        className="inline-flex shrink-0 items-center justify-center gap-1 self-end rounded-lg bg-azul-rey px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-azul-rey-dark sm:self-auto"
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
                      <div className="mb-1 flex flex-col gap-1 text-[10px] text-slate-500 sm:flex-row sm:justify-between">
                        <span className="font-bold">{note.author_email || 'Admin'}</span>
                        <span>{new Date(note.created_at).toLocaleString('es-CR')}</span>
                      </div>
                      <p className="break-words text-slate-800">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddNote} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Escriba una nota interna sobre este expediente..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs sm:w-auto"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNoteContent.trim()}
                  className="w-full rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-negro disabled:opacity-60 sm:w-auto"
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
