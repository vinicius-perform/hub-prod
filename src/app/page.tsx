'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createWorker } from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Table,
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  Loader2,
  Filter,
  Briefcase,
  Clock,
  Send,
  Plus,
  Trash2,
  X,
  Copy,
  LayoutDashboard,
  Settings,
  ChevronRight,
  Image as ImageIcon,
  Target,
  Repeat,
  ListOrdered,
  Instagram,
  FileText,
  Link,
  MessageSquare,
  GraduationCap,
  User,
  ShieldCheck,
  FileSearch,
  Stethoscope,
  Grid,
  Search,
  Pencil,
  Ban,
  UserCheck,
  Zap,
  LogOut,
  Bell,
  Lock,
  Shield
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility Functions ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Defaults ---

type Role = string;

type Collaborator = {
  id: string;
  name: string;
  role: Role;
  status: 'Ativo' | 'Inativo';
  createdAt: string;
};

type ProductionItem = {
  id: string;
  collaboratorId: string;
  role: Role;
  client: string;
  activity: string;
  status: string;
  startTime: string;
  endTime: string;
  totalTime: string;
  date: string;
};

const DEFAULT_COLLABORATORS: Collaborator[] = [];

const calculateTotalTime = (start: string, end: string) => {
  if (!start || !end) return '0h';
  try {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);

    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '0h';

    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

    if (totalMinutes < 0) return 'Revisão Necessária';

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    return `${m}m`;
  } catch (e) {
    return '0h';
  }
};

const INITIAL_PRODUCTIONS: ProductionItem[] = [];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group relative",
      active
        ? "bg-[#7B61FF] text-white"
        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
    <span className="text-[13px] font-medium tracking-tight">{label}</span>
  </button>
);

const SidebarCategory = ({ label }: { label: string }) => (
  <p className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-6 mb-2">{label}</p>
);

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-[#0B0F14] tracking-tight">{title}</h2>
    {subtitle && <p className="text-zinc-500 mt-1 text-sm font-medium">{subtitle}</p>}
  </div>
);

// --- main Application ---

export default function FAHub() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [productions, setProductions] = useState<ProductionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState<Role[]>(['Social Media', 'Designer']);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Import States
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [importForm, setImportForm] = useState({ colabId: '', role: 'Social Media', date: new Date().toISOString().split('T')[0] });

  // Filter States
  const [filterColab, setFilterColab] = useState('Todos');
  const [filterRole, setFilterRole] = useState('Todos');
  const [filterDate, setFilterDate] = useState('');
  const [selectedTask, setSelectedTask] = useState<ProductionItem | null>(null);

  // Team Management States
  const [isColabModalOpen, setIsColabModalOpen] = useState(false);
  const [editingColab, setEditingColab] = useState<Collaborator | null>(null);

  // OCR Debug States
  const [ocrDebug, setOcrDebug] = useState({ rawText: '', lineCount: 0, cellCounts: [] as number[] });

  // Persistence Logic
  useEffect(() => {
    console.log("[STORAGE] Hydrating data from localStorage...");
    try {
      const storedColabs = localStorage.getItem('fa_prod_collaborators');
      const storedRoles = localStorage.getItem('fa_prod_roles');
      const storedProductions = localStorage.getItem('fa_prod_productions');

      if (storedColabs) {
        console.log("[STORAGE] Loaded collaborators:", JSON.parse(storedColabs).length);
        setCollaborators(JSON.parse(storedColabs));
      }
      if (storedRoles) {
        console.log("[STORAGE] Loaded roles:", JSON.parse(storedRoles));
        setRoles(JSON.parse(storedRoles));
      }
      if (storedProductions) {
        console.log("[STORAGE] Loaded productions:", JSON.parse(storedProductions).length);
        setProductions(JSON.parse(storedProductions));
      }
    } catch (e) {
      console.error("[STORAGE] Error hydrating data:", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fa_prod_collaborators', JSON.stringify(collaborators));
    console.log("[STORAGE] Collaborators saved/updated:", collaborators.length);
  }, [collaborators]);

  useEffect(() => {
    localStorage.setItem('fa_prod_roles', JSON.stringify(roles));
    console.log("[STORAGE] Roles saved/updated:", roles);
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('fa_prod_productions', JSON.stringify(productions));
    console.log("[STORAGE] Productions saved/updated:", productions.length);
  }, [productions]);

  // Logic: Filter Productions
  const filteredProductions = useMemo(() => {
    return productions.filter(p => {
      const matchColab = filterColab === 'Todos' || p.collaboratorId === filterColab;
      const matchRole = filterRole === 'Todos' || p.role === filterRole;
      const matchDate = !filterDate || p.date === filterDate;
      const matchSearch = !searchQuery ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.activity.toLowerCase().includes(searchQuery.toLowerCase());
      return matchColab && matchRole && matchDate && matchSearch;
    });
  }, [productions, filterColab, filterRole, filterDate, searchQuery]);

  // Logic: Collaborator Metrics
  const collaboratorMetrics = useMemo(() => {
    if (filterColab === 'Todos') return null;

    const items = filteredProductions;
    const totalTasks = items.length;

    const totalMinutes = items.reduce((acc, p) => {
      const [h, m] = p.totalTime.includes('h')
        ? [Number(p.totalTime.split('h')[0]), Number(p.totalTime.split('h')[1]?.replace('m', '') || 0)]
        : [0, Number(p.totalTime.replace('m', ''))];
      return acc + (h * 60 + m);
    }, 0);

    const totalTimeFormatted = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
    const activeDays = new Set(items.map(p => p.date)).size;
    const avgHoursPerDay = activeDays > 0 ? (totalMinutes / 60 / activeDays).toFixed(1) : '0';
    const avgTasksDay = activeDays > 0 ? (totalTasks / activeDays).toFixed(1) : '0';

    const clientCounts: Record<string, number> = {};
    const activityCounts: Record<string, number> = {};

    items.forEach(p => {
      clientCounts[p.client] = (clientCounts[p.client] || 0) + 1;
      activityCounts[p.activity] = (activityCounts[p.activity] || 0) + 1;
    });

    const recurringClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const recurringActivities = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { totalTasks, totalTimeFormatted, activeDays, avgHoursPerDay, avgTasksDay, recurringClients, recurringActivities };
  }, [filteredProductions, filterColab, filterDate]);

  // Logic: General Stats
  const stats = useMemo(() => {
    const total = productions.length;
    const activeStaff = new Set(productions.map(p => p.collaboratorId)).size;

    const totalMinutes = productions.reduce((acc, p) => {
      const [h, m] = p.totalTime.includes('h')
        ? [Number(p.totalTime.split('h')[0]), Number(p.totalTime.split('h')[1]?.replace('m', '') || 0)]
        : [0, Number(p.totalTime.replace('m', ''))];
      return acc + (h * 60 + m);
    }, 0);

    const formattedTotalTime = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

    const clientCounts: Record<string, number> = {};
    const activityCounts: Record<string, number> = {};

    productions.forEach(p => {
      clientCounts[p.client] = (clientCounts[p.client] || 0) + 1;
      activityCounts[p.activity] = (activityCounts[p.activity] || 0) + 1;
    });

    const topClient = Object.keys(clientCounts).length > 0
      ? Object.keys(clientCounts).reduce((a, b) => clientCounts[a] > clientCounts[b] ? a : b)
      : '---';

    const topActivity = Object.keys(activityCounts).length > 0
      ? Object.keys(activityCounts).reduce((a, b) => activityCounts[a] > activityCounts[b] ? a : b)
      : '---';

    return { total, activeStaff, topClient, formattedTotalTime, topActivity };
  }, [productions]);

  const handleProcess = async () => {
    if (!importForm.colabId || !pastedImage) return;
    setIsProcessing(true);
    setOcrDebug({ rawText: '', lineCount: 0, cellCounts: [] });

    try {
      const worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(pastedImage);
      await worker.terminate();

      const lines = text.split('\n').filter(line => line.trim().length > 0);
      // Skip the first line if it looks like a header (contains common header words)
      const isHeader = (l: string) => /cliente|servi[çc]o|status|fim|in[íi]cio/i.test(l);
      const dataLinesRaw = isHeader(lines[0]) ? lines.slice(1) : lines;

      const extracted = dataLinesRaw.map((line, idx) => {
        // Smarter extraction using Regex
        // Pattern: [Client/Service Text] [Status] [Time 1] [Time 2] [Time 3]

        // 1. Identify all time patterns (HH:MM:SS)
        const timePattern = /(\d{1,2}:\d{2}:\d{2})/g;
        const timesFound = line.match(timePattern) || [];

        // 2. Identify Status
        const statusPattern = /(CONCLU[ÍI]DO|PENDENTE|ANDAMENTO|EM ANDAMENTO)/i;
        const statusMatch = line.match(statusPattern);
        const status = statusMatch ? statusMatch[0] : "";

        // 3. Identification by position
        // Usually: Fim is first time, Inicio is second time (based on user request D=Fim, E=Inicio)
        // But in the sheet provided: Column 4 is Fim, 5 is Inicio, 6 is Total
        const endTime = timesFound[0] || "";
        const startTime = timesFound[1] || "";
        // If there's a 3rd time, it's the Total, but we calculate it anyway

        // 4. Get the text before the status (Client + Service)
        let textBeforeStatus = line;
        if (statusMatch && statusMatch.index !== undefined) {
          textBeforeStatus = line.substring(0, statusMatch.index).trim();
        } else if (timesFound.length > 0 && timesFound[0]) {
          // If no status, take text before first time
          const firstTime = timesFound[0];
          textBeforeStatus = line.split(firstTime)[0].trim();
        }

        // 5. Try to split Client and Service
        // Heuristic: If there are multiple spaces, or if we find a service keyword
        const serviceKeywords = ["PLANEJAMENTO", "Edição", "Postagem", "Story", "Reels", "Corte", "Copy", "Design"];
        let client = textBeforeStatus;
        let activity = "";

        for (const kw of serviceKeywords) {
          const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
          const kwMatch = textBeforeStatus.match(kwRegex);
          if (kwMatch && kwMatch.index !== undefined) {
            client = textBeforeStatus.substring(0, kwMatch.index).trim();
            activity = textBeforeStatus.substring(kwMatch.index).trim();
            break;
          }
        }

        // If no keyword match, try splitting by the last significant gap or just assume the last word(s)
        if (!activity && client.includes("  ")) {
          const parts = client.split(/\s{2,}/);
          if (parts.length > 1) {
            client = parts[0].trim();
            activity = parts.slice(1).join(" ").trim();
          }
        }

        return {
          originalLine: idx + 2,
          client: client,
          activity: activity,
          status: status,
          endTime: endTime,
          startTime: startTime,
          totalTime: calculateTotalTime(startTime, endTime)
        };
      }).filter(item => item.client || item.startTime || item.endTime);

      setOcrDebug({
        rawText: text,
        lineCount: lines.length,
        cellCounts: dataLinesRaw.map(l => l.split(/\s+/).length)
      });

      setReviewItems(extracted);
      setIsReviewing(true);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Erro ao processar imagem. Verifique o console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveReview = () => {
    const newItems: ProductionItem[] = reviewItems.map((item, idx) => ({
      id: Math.random().toString(36).substr(2, 9),
      collaboratorId: importForm.colabId,
      role: importForm.role,
      client: item.client || "---",
      activity: item.activity || "---",
      status: item.status || "CONCLUÍDO",
      startTime: item.startTime || "00:00:00",
      endTime: item.endTime || "00:00:00",
      totalTime: item.totalTime || "0m",
      date: importForm.date
    }));
    setProductions([...productions, ...newItems]);
    setIsReviewing(false);
    setPastedImage(null);
    setActiveTab('production');
  };

  const addCollaborator = (name: string, role: Role, status: 'Ativo' | 'Inativo' = 'Ativo') => {
    console.log("[TEAM] Creating collaborator:", name);
    const newColab: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      status,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCollaborators([...collaborators, newColab]);
  };

  const updateCollaborator = (id: string, updates: Partial<Collaborator>) => {
    console.log("[TEAM] Updating collaborator:", id, updates);
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const toggleCollaboratorStatus = (id: string) => {
    console.log("[TEAM] Toggling status for:", id);
    setCollaborators(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === 'Ativo' ? 'Inativo' : 'Ativo' } : c
    ));
  };

  const deleteCollaborator = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      console.log("[TEAM] Deleting collaborator:", id);
      setCollaborators(prev => prev.filter(c => c.id !== id));
      // Optionally remove their productions too
      setProductions(prev => prev.filter(p => p.collaboratorId !== id));
    }
  };

  const addRole = (role: string) => {
    if (role && !roles.includes(role)) {
      console.log("[TEAM] Adding new role:", role);
      setRoles([...roles, role]);
    }
  };

  const deleteRole = (role: string) => {
    if (confirm(`Tem certeza que deseja excluir a função "${role}"?`)) {
      console.log("[TEAM] Deleting role:", role);
      setRoles(roles.filter(r => r !== role));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-6 relative overflow-hidden font-inter">
        {/* Background Aura Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#7B61FF]/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#7B61FF]/5 blur-[120px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[440px] z-10"
        >
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[48px] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7B61FF] to-transparent" />

            <div className="flex flex-col items-center mb-10">
              <div className="w-14 h-14 rounded-2xl bg-[#7B61FF] flex items-center justify-center mb-6 shadow-lg shadow-[#7B61FF]/40">
                <span className="text-white font-black text-xl">FA</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">FA Prod</h1>
              <p className="text-zinc-400 text-sm font-medium">Acesse sua workstation premium</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (loginForm.username === 'viniciusmrh' && loginForm.password === 'admin@fa1') {
                  setIsLoggedIn(true);
                  setLoginError('');
                } else {
                  setLoginError('Credenciais inválidas. Tente novamente.');
                }
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Usuário</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#7B61FF] transition-colors" />
                  <input
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/20 focus:bg-white/10 transition-all font-medium"
                    placeholder="viniciusmrh"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#7B61FF] transition-colors" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/20 focus:bg-white/10 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginError && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-[11px] font-bold text-center bg-red-400/10 py-2 rounded-lg"
                >
                  {loginError}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full bg-white text-[#0B0F14] py-4 rounded-2xl font-black text-xs hover:bg-zinc-200 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2"
              >
                ENTRAR NO SISTEMA <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500">
            <ShieldCheck className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Acesso Restrito & Criptografado</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FFFFFF] font-inter text-[#0B0F14] overflow-hidden selection:bg-[#7B61FF]/20">
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0B0F14] flex flex-col shrink-0">
        <div className="p-6 mb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7B61FF] flex items-center justify-center">
            <span className="text-white font-black text-xs">FA</span>
          </div>
          <h1 className="text-white font-bold text-lg tracking-tight">FA Prod</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Upload} label="Importar imagem" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
          <SidebarItem icon={Clock} label="Produção do Dia" active={activeTab === 'production'} onClick={() => setActiveTab('production')} />
          <SidebarItem icon={Users} label="Equipe" active={activeTab === 'team'} onClick={() => setActiveTab('team')} />
        </div>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xs">V</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-[13px] font-bold truncate">Vinícius</p>
              <p className="text-zinc-500 text-[11px] truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-zinc-500 hover:text-red-400 transition-all text-[13px] font-medium"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* MODAL COLABORADOR (NOVO/EDITAR) */}
      <AnimatePresence>
        {isColabModalOpen && (
          <div className="fixed inset-0 bg-[#0B0F14]/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white max-w-md w-full rounded-[40px] p-10 relative shadow-2xl">
              <button
                onClick={() => setIsColabModalOpen(false)}
                className="absolute top-8 right-8 text-zinc-400 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <p className="text-[10px] font-bold text-[#7B61FF] uppercase tracking-widest mb-2">Gestão de Equipe</p>
                <h3 className="text-2xl font-black text-[#0B0F14]">{editingColab ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get('name') as string;
                const role = fd.get('role') as Role;
                const status = fd.get('status') as 'Ativo' | 'Inativo';

                if (editingColab) {
                  updateCollaborator(editingColab.id, { name, role, status });
                } else {
                  addCollaborator(name, role, status);
                }
                setIsColabModalOpen(false);
              }} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingColab?.name}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/20 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Função</label>
                  <select
                    name="role"
                    required
                    defaultValue={editingColab?.role || roles[0]}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/20 appearance-none cursor-pointer font-medium"
                  >
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Status Inicial</label>
                  <select
                    name="status"
                    required
                    defaultValue={editingColab?.status || 'Ativo'}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/20 appearance-none cursor-pointer font-medium"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsColabModalOpen(false)}
                    className="flex-1 py-4 bg-slate-50 text-zinc-500 rounded-2xl font-bold text-xs hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#0B0F14] text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all shadow-xl shadow-black/10"
                  >
                    {editingColab ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Micro-Noise */}
      <main className="flex-1 flex flex-col bg-[#FFFFFF] relative overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <Grid className="w-5 h-5 text-zinc-400 cursor-pointer" />
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar clientes, tarefas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2 text-[13px] text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/40 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <AnimatePresence mode="wait">
            {/* PAGE: DASHBOARD (OVERVIEW) */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SectionTitle title="Dashboard" subtitle="Visão geral da operação" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Tarefas do Dia</p>
                    <h4 className="text-4xl font-black text-[#0B0F14]">{stats.total}</h4>
                    <p className="text-[11px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> 12% em relação a ontem
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Horas Trabalhadas</p>
                    <h4 className="text-4xl font-black text-[#7B61FF]">{stats.formattedTotalTime}</h4>
                    <p className="text-[11px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Tempo líquido auditado
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Colaboradores Ativos</p>
                    <h4 className="text-4xl font-black text-[#0B0F14]">{collaborators.length}</h4>
                    <p className="text-[11px] text-zinc-400 mt-2 font-medium">Equipe em operação</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Clientes Atendidos</p>
                    <h4 className="text-4xl font-black text-[#0B0F14]">{new Set(productions.map(p => p.client)).size}</h4>
                    <p className="text-[11px] text-[#7B61FF] font-bold mt-2">Visão geral da base</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
                    <h5 className="font-bold text-[#0B0F14] mb-8 flex items-center justify-between">
                      <span>Produção por Colaborador</span>
                      <BarChart3 className="w-4 h-4 text-zinc-400" />
                    </h5>
                    <div className="space-y-6">
                      {collaborators.map(c => {
                        const count = productions.filter(p => p.collaboratorId === c.id).length;
                        const pct = (count / (productions.length || 1)) * 100;
                        return (
                          <div key={c.id}>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="font-bold text-[#0B0F14]">{c.name}</span>
                              <span className="text-zinc-500 font-medium">{count} tarefas</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-[#7B61FF]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
                    <h5 className="font-bold text-[#0B0F14] mb-8 flex items-center justify-between">
                      <span>Tarefas mais Repetidas</span>
                      <Repeat className="w-4 h-4 text-zinc-400" />
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {['Post Instagram', 'Edição Reel', 'Banner Evento', 'Interação Stories', 'COPY'].map(tag => (
                        <span key={tag} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-zinc-600 hover:border-[#7B61FF]/40 cursor-default transition-all uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h5 className="font-bold text-[#0B0F14]">Produção Recente</h5>
                    <span className="text-[11px] font-bold text-[#7B61FF] cursor-pointer hover:underline">Ver tudo</span>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Colaborador</th>
                        <th className="px-8 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Cliente</th>
                        <th className="px-8 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Serviço</th>
                        <th className="px-8 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Horário</th>
                        <th className="px-8 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productions.slice(0, 5).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#7B61FF] text-[10px]">{collaborators.find(c => c.id === p.collaboratorId)?.name[0]}</div>
                              <span className="text-sm font-bold text-[#0B0F14]">{collaborators.find(c => c.id === p.collaboratorId)?.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm text-zinc-500">{p.client}</td>
                          <td className="px-8 py-4 text-sm font-bold text-[#0B0F14]">{p.activity}</td>
                          <td className="px-8 py-4 text-[11px] text-zinc-400 font-mono">{p.startTime} - {p.endTime}</td>
                          <td className="px-8 py-4 text-right">
                            <span className="text-xs font-bold text-[#0B0F14]">{p.totalTime}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* PAGE: IMPORT */}
            {activeTab === 'import' && (
              <motion.div key="import" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                <SectionTitle title="Novo Registro" subtitle="Importe prints de produção da planilha corporativa" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl relative overflow-hidden group">
                      <h4 className="text-[10px] font-bold text-zinc-400 mb-8 uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5" /> Configurações
                      </h4>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Colaborador</label>
                          <select
                            value={importForm.colabId}
                            onChange={e => setImportForm({ ...importForm, colabId: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/50 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Selecionar...</option>
                            {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Função</label>
                          <div className="grid grid-cols-2 gap-2">
                            {roles.map(role => (
                              <button
                                key={role}
                                onClick={() => setImportForm({ ...importForm, role })}
                                className={cn(
                                  "py-3 rounded-xl text-[11px] font-black transition-all border-2",
                                  importForm.role === role
                                    ? "bg-[#7B61FF] text-white border-[#7B61FF] shadow-lg shadow-[#7B61FF]/20"
                                    : "bg-white text-zinc-400 border-slate-100 hover:border-[#7B61FF]/40"
                                )}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Data</label>
                          <input
                            type="date"
                            value={importForm.date}
                            onChange={e => setImportForm({ ...importForm, date: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/50"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={!pastedImage || !importForm.colabId || isProcessing}
                      onClick={handleProcess}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                        (!pastedImage || !importForm.colabId || isProcessing)
                          ? "bg-slate-100 text-zinc-400 cursor-not-allowed"
                          : "bg-[#7B61FF] text-white shadow-[#7B61FF]/20"
                      )}
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                      PROCESSAR IMAGEM
                    </button>
                  </div>

                  <div className="lg:col-span-2">
                    {!isReviewing ? (
                      <div
                        className={cn(
                          "relative h-[500px] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center transition-all group overflow-hidden bg-slate-50/50",
                          pastedImage ? "border-[#7B61FF]/50 bg-[#7B61FF]/5" : "border-slate-200 hover:border-slate-300"
                        )}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setPastedImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      >
                        {pastedImage ? (
                          <>
                            <img src={pastedImage} className="absolute inset-0 w-full h-full object-contain p-8" />
                            <div className="absolute top-6 right-6">
                              <button onClick={() => setPastedImage(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-8">
                            <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                              <Upload className="w-8 h-8 text-[#7B61FF]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0B0F14] mb-2 tracking-tight">Arraste ou Cole seu Print</h3>
                            <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8 font-medium italic leading-relaxed">Copie o print no WhatsApp e aperte CMD+V ou selecione um arquivo</p>

                            <label className="inline-flex py-3 px-8 rounded-xl bg-[#0B0F14] text-white text-xs font-bold cursor-pointer transition-all hover:bg-slate-800">
                              Selecionar Arquivo
                              <input type="file" className="hidden" accept="image/*" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setPastedImage(ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            </label>
                          </div>
                        )}

                        {pastedImage && (
                          <div className="mt-8 p-6 bg-zinc-900 rounded-[24px] border border-white/5 overflow-hidden">
                            <h5 className="text-[10px] font-bold text-[#7B61FF] uppercase tracking-widest mb-4 flex items-center gap-2">
                              <FileSearch className="w-3 h-3" /> OCR DEBUG CONSOLE
                            </h5>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Linhas Detectadas</p>
                                <p className="text-lg font-bold text-white">{ocrDebug.lineCount}</p>
                              </div>
                              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Células/Linha (Média)</p>
                                <p className="text-lg font-bold text-white">
                                  {ocrDebug.cellCounts.length > 0
                                    ? (ocrDebug.cellCounts.reduce((a, b) => a + b, 0) / ocrDebug.cellCounts.length).toFixed(1)
                                    : '0'}
                                </p>
                              </div>
                            </div>
                            <div className="bg-black p-4 rounded-xl border border-white/10 max-h-40 overflow-y-auto custom-scrollbar">
                              <p className="text-[10px] text-emerald-500 font-mono leading-relaxed whitespace-pre-wrap">
                                {ocrDebug.rawText || (isProcessing ? "Lendo imagem..." : "Aguardando processamento...")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#0B0F14] flex items-center gap-3">
                            <Grid className="w-4 h-4 text-[#7B61FF]" /> Revisão Técnica
                          </h4>
                          <button onClick={handleSaveReview} className="px-6 py-2 bg-[#7B61FF] text-white rounded-lg text-xs font-bold shadow-lg shadow-[#7B61FF]/20 hover:scale-105 transition-all">Salvar Tudo</button>
                        </div>
                        <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3 font-bold text-zinc-500 w-12 text-center">LINHA</th>
                                <th className="px-4 py-3 font-bold text-zinc-500">CLIENTE</th>
                                <th className="px-4 py-3 font-bold text-zinc-500">SERVIÇO</th>
                                <th className="px-4 py-3 font-bold text-zinc-500">STATUS</th>
                                <th className="px-4 py-3 font-bold text-zinc-500 text-center w-16">FIM</th>
                                <th className="px-4 py-3 font-bold text-zinc-500 text-center w-16">INÍCIO</th>
                                <th className="px-4 py-3 font-bold text-zinc-500 text-right w-24">TOTAL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reviewItems.map((item, idx) => (
                                <tr key={idx} className={cn(!item.client || !item.startTime || !item.endTime ? "bg-amber-50/50" : "")}>
                                  <td className="px-4 py-2 text-center text-zinc-400 font-mono">{item.originalLine}</td>
                                  <td className={cn("px-4 py-2 font-bold text-[#0B0F14]", !item.client && "bg-red-50 text-red-500 italic")}>{item.client || "Não detectado"}</td>
                                  <td className="px-4 py-2 text-zinc-500">{item.activity || "---"}</td>
                                  <td className="px-4 py-2">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-zinc-600">{item.status || "Pendente"}</span>
                                  </td>
                                  <td className={cn("px-4 py-2 text-center font-mono", !item.endTime && "text-red-500 bg-red-50")}>{item.endTime || "--:--"}</td>
                                  <td className={cn("px-4 py-2 text-center font-mono", !item.startTime && "text-red-500 bg-red-50")}>{item.startTime || "--:--"}</td>
                                  <td className="px-4 py-2 text-right font-black text-[#7B61FF]">
                                    {item.totalTime === '0h' ? '---' : item.totalTime}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PAGE: PRODUCTION (DETALHADA) */}
            {activeTab === 'production' && (
              <motion.div key="production" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <SectionTitle title="Produção do Dia" subtitle="Controle individual e detalhado da operação" />

                <div className="flex items-center gap-4 mb-10 bg-slate-50 p-2 rounded-2xl w-fit border border-slate-100 shadow-sm">
                  <div className="relative">
                    <select
                      value={filterColab}
                      onChange={e => setFilterColab(e.target.value)}
                      className="bg-white border-transparent rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0B0F14] font-bold focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/40 appearance-none min-w-[200px]"
                    >
                      <option value="Todos">Todos Colaboradores</option>
                      {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Users className="absolute left-3 top-3 w-4 h-4 text-[#7B61FF]" />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      className="bg-white border-transparent rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B0F14] font-bold focus:outline-none focus:ring-1 focus:ring-[#7B61FF]/40"
                    />
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#7B61FF]" />
                  </div>
                </div>

                {filterColab !== 'Todos' && collaboratorMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-[#FFFFFF] border-2 border-[#7B61FF]/10 p-6 rounded-3xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Total Tarefas</p>
                      <h4 className="text-4xl font-black text-[#0B0F14] tracking-tight">{collaboratorMetrics.totalTasks}</h4>
                    </div>
                    <div className="bg-[#FFFFFF] border border-slate-100 p-6 rounded-3xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Tempo Produzido</p>
                      <h4 className="text-4xl font-black text-[#7B61FF] tracking-tight">{collaboratorMetrics.totalTimeFormatted}</h4>
                    </div>
                    <div className="bg-[#FFFFFF] border border-slate-100 p-6 rounded-3xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Média Diária</p>
                      <h4 className="text-4xl font-black text-[#0B0F14] tracking-tight">{collaboratorMetrics.avgHoursPerDay}h</h4>
                    </div>
                    <div className="bg-[#FFFFFF] border border-slate-100 p-6 rounded-3xl shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Ritmo Entrega</p>
                      <h4 className="text-4xl font-black text-[#0B0F14] tracking-tight">{collaboratorMetrics.avgTasksDay}</h4>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Colaborador</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cliente</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Serviço</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Período / Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProductions.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedTask(p)}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#7B61FF] text-[10px]">{collaborators.find(c => c.id === p.collaboratorId)?.name[0]}</div>
                              <span className="text-sm font-bold text-[#0B0F14]">{collaborators.find(c => c.id === p.collaboratorId)?.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-zinc-500 font-medium">{p.client}</td>
                          <td className="px-8 py-5 text-sm font-bold text-[#0B0F14] italic">{p.activity}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="text-[11px] text-zinc-400 font-mono mb-1">{p.startTime} - {p.endTime}</div>
                            <div className="text-xs font-black text-[#7B61FF]">{p.totalTime}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* PAGE: TEAM */}
            {activeTab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex items-center justify-between mb-8">
                  <SectionTitle title="Equipe" subtitle="Gerencie os colaboradores da operação" />
                  <button
                    onClick={() => { setEditingColab(null); setIsColabModalOpen(true); }}
                    className="flex items-center gap-2 bg-[#7B61FF] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-[#7B61FF]/20 hover:scale-105 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Novo Colaborador
                  </button>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                  {collaborators.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                        <User className="w-10 h-10 text-zinc-300" />
                      </div>
                      <h3 className="text-xl font-bold text-[#0B0F14] tracking-tight">Nenhum colaborador cadastrado ainda</h3>
                      <p className="text-zinc-500 mt-2 max-w-sm font-medium leading-relaxed italic">Cadastre o primeiro colaborador para começar a gerenciar sua equipe.</p>
                      <button
                        onClick={() => { setEditingColab(null); setIsColabModalOpen(true); }}
                        className="mt-8 flex items-center gap-2 bg-[#0B0F14] text-white px-8 py-3 rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-black/10"
                      >
                        <Plus className="w-4 h-4" /> Cadastrar Primeiro Colaborador
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Função</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data de cadastro</th>
                          <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {collaborators.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#7B61FF] text-[10px]">{c.name[0]}</div>
                                <span className="text-sm font-bold text-[#0B0F14]">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-xs font-medium text-zinc-500">{c.role}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                                c.status === 'Ativo' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm text-zinc-400 font-medium">
                              {c.createdAt}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setEditingColab(c); setIsColabModalOpen(true); }}
                                  className="p-2 text-zinc-400 hover:text-[#7B61FF] hover:bg-[#7B61FF]/5 rounded-lg transition-all"
                                  title="Editar Colaborador"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleCollaboratorStatus(c.id)}
                                  className={cn(
                                    "p-2 rounded-lg transition-all",
                                    c.status === 'Ativo' ? "text-zinc-400 hover:text-red-500 hover:bg-red-50" : "text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50"
                                  )}
                                  title={c.status === 'Ativo' ? "Desativar Colaborador" : "Ativar Colaborador"}
                                >
                                  {c.status === 'Ativo' ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => deleteCollaborator(c.id)}
                                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir Colaborador"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="mt-12">
                  <SectionTitle title="Configurações de Funções" subtitle="Personalize as categorias de trabalho da operação" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Cadastrar Nova Função</p>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.roleInput as HTMLInputElement;
                        addRole(input.value);
                        input.value = '';
                      }} className="flex gap-3">
                        <input
                          name="roleInput"
                          placeholder="Ex: Editor de Vídeo"
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/20 font-medium"
                        />
                        <button type="submit" className="bg-[#0B0F14] text-white px-6 rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all">
                          Adicionar
                        </button>
                      </form>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Funções Ativas</p>
                      <div className="flex flex-wrap gap-3">
                        {roles.map(role => (
                          <div key={role} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl group transition-all hover:border-[#7B61FF]/40">
                            <span className="text-[11px] font-bold text-[#0B0F14]">{role}</span>
                            <button
                              onClick={() => deleteRole(role)}
                              className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MOCK PAGE FOR TABS NOT IMPLEMENTED */}
            {!['dashboard', 'import', 'production', 'team'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                  <Zap className="w-10 h-10 text-zinc-200" />
                </div>
                <h3 className="text-2xl font-black text-[#0B0F14] tracking-tight">Módulo em Desenvolvimento</h3>
                <p className="text-zinc-500 mt-2 max-w-sm font-medium leading-relaxed italic">Estamos preparando uma interface premium para esta seção seguindo o padrão SaaS Analytics.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODAL DETALHES */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-[#0B0F14]/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white max-w-lg w-full rounded-[40px] p-10 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#7B61FF]" />
              <button onClick={() => setSelectedTask(null)} className="absolute top-8 right-8 text-zinc-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <p className="text-[10px] font-bold text-[#7B61FF] uppercase tracking-widest mb-3">Relatório Individual</p>
                <h3 className="text-3xl font-black text-[#0B0F14] leading-tight mb-2">{selectedTask.activity}</h3>
                <p className="text-zinc-500 font-medium italic">{selectedTask.client}</p>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-10">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Staff Responsável</p>
                  <p className="text-sm font-bold text-[#0B0F14]">{collaborators.find(c => c.id === selectedTask.collaboratorId)?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Data Registro</p>
                  <p className="text-sm font-bold text-[#0B0F14]">{selectedTask.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Ciclo de Horário</p>
                  <p className="text-sm font-bold text-emerald-500 font-mono tracking-tighter">{selectedTask.startTime} → {selectedTask.endTime}</p>
                  <p className="text-xs font-black text-[#7B61FF] mt-1 italic">{selectedTask.totalTime} operados</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Status Auditado</p>
                  <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-[#0B0F14] uppercase">{selectedTask.status}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button onClick={() => {
                  setProductions(productions.filter(pr => pr.id !== selectedTask.id));
                  setSelectedTask(null);
                }} className="flex-1 py-4 bg-slate-50 text-red-500 rounded-2xl font-bold text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Excluir Registro
                </button>
                <button onClick={() => setSelectedTask(null)} className="flex-1 py-4 bg-[#0B0F14] text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all">
                  Fechar Análise
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
