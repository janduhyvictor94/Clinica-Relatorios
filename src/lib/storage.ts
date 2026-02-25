import { format, eachDayOfInterval } from "date-fns";

export interface DailyData {
  totalPacientes: number;
  desmarcaram: number;
  novos: number;
  recorrentes: number;
  faturamento: number;
  procedimentos: string;
  leadsTotal: number;
  leadsCampanha: number;
  leadsOrganico: number;
  leadsInstagram: number;
  seguidores: number;
  conversasIniciadas: number;
  conversasRespondidas: number;
  agendamentos: number;
  gastoTrafego: number;
}

export interface DailyGoals {
  totalPacientes: number;
  faturamento: number;
  leadsTotal: number;
  conversasIniciadas: number;
  conversasRespondidas: number;
  agendamentos: number;
  seguidores: number; // AGORA TEM META DIÁRIA
}

export interface MonthlyGoals {
  pacientes: number;
  faturamento: number;
  leads: number;
  agendamentos: number;
  seguidores: number;
  cac: number;
}

export const defaultData: DailyData = {
  totalPacientes: 0,
  desmarcaram: 0,
  novos: 0,
  recorrentes: 0,
  faturamento: 0,
  procedimentos: "",
  leadsTotal: 0,
  leadsCampanha: 0,
  leadsOrganico: 0,
  leadsInstagram: 0,
  seguidores: 0,
  conversasIniciadas: 0,
  conversasRespondidas: 0,
  agendamentos: 0,
  gastoTrafego: 0,
};

export const defaultDailyGoals: DailyGoals = {
  totalPacientes: 0,
  faturamento: 0,
  leadsTotal: 0,
  conversasIniciadas: 0,
  conversasRespondidas: 0,
  agendamentos: 0,
  seguidores: 0, // VALOR PADRÃO ZERO
};

export const defaultMonthlyGoals: MonthlyGoals = {
  pacientes: 0,
  faturamento: 0,
  leads: 0,
  agendamentos: 0,
  seguidores: 0,
  cac: 0,
};

export function loadDailyData(date: Date | string): DailyData {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
  const saved = localStorage.getItem(`daily_data_${dateStr}`);
  return saved ? { ...defaultData, ...JSON.parse(saved) } : { ...defaultData };
}

export function saveDailyData(date: Date | string, data: DailyData) {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
  localStorage.setItem(`daily_data_${dateStr}`, JSON.stringify(data));
}

export function loadDailyGoals(): DailyGoals {
  const saved = localStorage.getItem("daily_goals");
  return saved ? { ...defaultDailyGoals, ...JSON.parse(saved) } : { ...defaultDailyGoals };
}

export function saveDailyGoals(goals: DailyGoals) {
  localStorage.setItem("daily_goals", JSON.stringify(goals));
}

export function loadMonthlyGoals(): MonthlyGoals {
  const saved = localStorage.getItem("monthly_goals");
  return saved ? { ...defaultMonthlyGoals, ...JSON.parse(saved) } : { ...defaultMonthlyGoals };
}

export function saveMonthlyGoals(goals: MonthlyGoals) {
  localStorage.setItem("monthly_goals", JSON.stringify(goals));
}

export function loadDataRange(start: Date, end: Date): { date: string; data: DailyData }[] {
  const days = eachDayOfInterval({ start, end });
  return days.map(d => {
    const dateStr = format(d, "yyyy-MM-dd");
    return { date: dateStr, data: loadDailyData(dateStr) };
  }).filter(e => {
    const d = e.data;
    return d.totalPacientes > 0 || d.faturamento > 0 || d.leadsTotal > 0 || d.agendamentos > 0 || d.procedimentos.length > 0;
  });
}

export function sumDataRange(entries: { date: string; data: DailyData }[]) {
  const totals = {
    totalPacientes: 0,
    desmarcaram: 0,
    novos: 0,
    recorrentes: 0,
    faturamento: 0,
    leadsTotal: 0,
    leadsCampanha: 0,
    leadsOrganico: 0,
    leadsInstagram: 0,
    seguidores: 0,
    conversasIniciadas: 0,
    conversasRespondidas: 0,
    agendamentos: 0,
    gastoTrafego: 0,
    diasComDados: entries.length,
  };

  entries.forEach(e => {
    totals.totalPacientes += Number(e.data.totalPacientes) || 0;
    totals.desmarcaram += Number(e.data.desmarcaram) || 0;
    totals.novos += Number(e.data.novos) || 0;
    totals.recorrentes += Number(e.data.recorrentes) || 0;
    totals.faturamento += Number(e.data.faturamento) || 0;
    totals.leadsTotal += Number(e.data.leadsTotal) || 0;
    totals.leadsCampanha += Number(e.data.leadsCampanha) || 0;
    totals.leadsOrganico += Number(e.data.leadsOrganico) || 0;
    totals.leadsInstagram += Number(e.data.leadsInstagram) || 0;
    totals.seguidores += Number(e.data.seguidores) || 0;
    totals.conversasIniciadas += Number(e.data.conversasIniciadas) || 0;
    totals.conversasRespondidas += Number(e.data.conversasRespondidas) || 0;
    totals.agendamentos += Number(e.data.agendamentos) || 0;
    totals.gastoTrafego += Number(e.data.gastoTrafego) || 0;
  });

  return totals;
}