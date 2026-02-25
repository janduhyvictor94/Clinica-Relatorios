import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users, UserMinus, UserPlus, UserCheck,
  DollarSign, ClipboardList,
  Megaphone, Leaf, Link, Instagram,
  MessageCircle, MessageSquare, CalendarCheck,
  TrendingUp, FileDown, CalendarIcon, Save, BarChart3,
  CreditCard
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import SectionHeader from "@/components/SectionHeader";
import MonthlyGoalBar from "@/components/MonthlyGoalBar";
import PeriodSummary from "@/components/PeriodSummary";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DailyData, DailyGoals, MonthlyGoals,
  defaultData, loadDailyData, saveDailyData,
  loadDailyGoals, saveDailyGoals,
  loadMonthlyGoals, saveMonthlyGoals,
  loadDataRange, sumDataRange,
} from "@/lib/storage";
import { generateDailyPDF } from "@/lib/pdfExport";

const DashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [data, setData] = useState<DailyData>(defaultData);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>(loadDailyGoals());
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoals>(loadMonthlyGoals());
  const [saved, setSaved] = useState(true);

  // Load data when date changes
  useEffect(() => {
    setData(loadDailyData(selectedDate));
    setSaved(true);
  }, [selectedDate]);

  const update = <K extends keyof DailyData>(key: K, val: DailyData[K]) => {
    setData((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const updateDG = <K extends keyof DailyGoals>(key: K, val: DailyGoals[K]) => {
    setDailyGoals((prev) => {
      const updated = { ...prev, [key]: val };
      saveDailyGoals(updated);
      return updated;
    });
  };

  const handleSave = useCallback(() => {
    saveDailyData(selectedDate, data);
    setSaved(true);
    toast.success("Dados salvos com sucesso!");
  }, [selectedDate, data]);

  // Auto-save on blur
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!saved) saveDailyData(selectedDate, data);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saved, selectedDate, data]);

  // Monthly accumulation
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthEntries = loadDataRange(monthStart, monthEnd);
  const monthTotals = sumDataRange(monthEntries);

  // Cálculo do CAC Atual (Total Gasto no Mês / Total de Agendamentos no Mês)
  const cacAtual = monthTotals.agendamentos > 0 
    ? (monthTotals.gastoTrafego / monthTotals.agendamentos) 
    : 0;

  const handleExportDaily = () => {
    const dateStr = format(selectedDate, "dd/MM/yyyy", { locale: ptBR });
    generateDailyPDF({
      title: `Relatório Diário - ${dateStr}`,
      subtitle: format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      data,
      dailyGoals,
      monthlyGoals,
    });
    toast.success("PDF gerado com sucesso!");
  };

  const dateLabel = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Clínica Bruna Braga
              </h1>
              <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal gap-2")}>
                    <CalendarIcon className="w-4 h-4" />
                    {format(selectedDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    locale={ptBR}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {/* Save */}
              <Button onClick={handleSave} variant={saved ? "outline" : "default"} className="gap-2">
                <Save className="w-4 h-4" />
                {saved ? "Salvo" : "Salvar"}
              </Button>

              {/* Export PDF */}
              <Button onClick={handleExportDaily} variant="outline" className="gap-2">
                <FileDown className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="daily" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="daily" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Registro Diário
            </TabsTrigger>
            <TabsTrigger value="period" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Panorama / Período
            </TabsTrigger>
          </TabsList>

          {/* DAILY TAB */}
          <TabsContent value="daily" className="space-y-10">
            {/* Atendimentos */}
            <section>
              <SectionHeader title="📋 Atendimentos" subtitle="Controle de pacientes do dia" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Pacientes" value={data.totalPacientes} meta={dailyGoals.totalPacientes}
                  icon={<Users className="w-5 h-5" />} onChange={(v) => update("totalPacientes", v)}
                  onMetaChange={(v) => updateDG("totalPacientes", v)} />
                <MetricCard label="Desmarcaram" value={data.desmarcaram}
                  icon={<UserMinus className="w-5 h-5" />} onChange={(v) => update("desmarcaram", v)}
                  colorClass="text-destructive" />
                <MetricCard label="Pacientes Novos" value={data.novos}
                  icon={<UserPlus className="w-5 h-5" />} onChange={(v) => update("novos", v)}
                  colorClass="text-success" />
                <MetricCard label="Recorrentes" value={data.recorrentes}
                  icon={<UserCheck className="w-5 h-5" />} onChange={(v) => update("recorrentes", v)}
                  colorClass="text-info" />
              </div>
            </section>

            {/* Faturamento + Procedimentos */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <SectionHeader title="💰 Faturamento" subtitle="Receita do dia" />
                <div className="stat-card animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-success" />
                    <span className="stat-label">Faturamento do Dia (R$)</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <input type="number" min={0} value={data.faturamento}
                      onChange={(e) => update("faturamento", Math.max(0, Number(e.target.value)))}
                      className="input-metric text-2xl font-bold w-36" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Meta:</span>
                      <input type="number" min={0} value={dailyGoals.faturamento}
                        onChange={(e) => updateDG("faturamento", Math.max(0, Number(e.target.value)))}
                        className="input-metric w-20 text-xs" />
                    </div>
                  </div>
                  {dailyGoals.faturamento > 0 && (
                    <div className="mt-3">
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill"
                          style={{ width: `${Math.min((data.faturamento / dailyGoals.faturamento) * 100, 100)}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((data.faturamento / dailyGoals.faturamento) * 100).toFixed(0)}% da meta diária
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <SectionHeader title="🩺 Procedimentos" subtitle="Procedimentos realizados hoje" />
                <div className="stat-card animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <span className="stat-label">Lista de Procedimentos</span>
                  </div>
                  <textarea value={data.procedimentos} onChange={(e) => update("procedimentos", e.target.value)}
                    placeholder="Ex: Botox (3), Preenchimento (2), Limpeza de pele (5)..."
                    className="w-full h-32 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
              </div>
            </section>

            {/* Comercial */}
            <section>
              <SectionHeader title="📊 Comercial e Tráfego" subtitle="Leads, marketing e investimentos do dia" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard label="Total de Leads" value={data.leadsTotal} meta={dailyGoals.leadsTotal}
                  icon={<TrendingUp className="w-5 h-5" />} onChange={(v) => update("leadsTotal", v)}
                  onMetaChange={(v) => updateDG("leadsTotal", v)} />
                <MetricCard label="Leads Campanha" value={data.leadsCampanha}
                  icon={<Megaphone className="w-5 h-5" />} onChange={(v) => update("leadsCampanha", v)}
                  colorClass="text-warning" />
                <MetricCard label="Leads Orgânico" value={data.leadsOrganico}
                  icon={<Leaf className="w-5 h-5" />} onChange={(v) => update("leadsOrganico", v)}
                  colorClass="text-success" />
                <MetricCard label="Gasto Tráfego (R$)" value={data.gastoTrafego}
                  icon={<CreditCard className="w-5 h-5" />} onChange={(v) => update("gastoTrafego", v)}
                  colorClass="text-destructive" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <MetricCard label="Seguidores" value={data.seguidores} meta={dailyGoals.seguidores}
                  icon={<Instagram className="w-5 h-5" />} onChange={(v) => update("seguidores", v)}
                  onMetaChange={(v) => updateDG("seguidores", v)} colorClass="text-primary" />
                <MetricCard label="Conversas Iniciadas" value={data.conversasIniciadas} meta={dailyGoals.conversasIniciadas}
                  icon={<MessageCircle className="w-5 h-5" />} onChange={(v) => update("conversasIniciadas", v)}
                  onMetaChange={(v) => updateDG("conversasIniciadas", v)} colorClass="text-info" />
                <MetricCard label="Conversas Respondidas" value={data.conversasRespondidas} meta={dailyGoals.conversasRespondidas}
                  icon={<MessageSquare className="w-5 h-5" />} onChange={(v) => update("conversasRespondidas", v)}
                  onMetaChange={(v) => updateDG("conversasRespondidas", v)} colorClass="text-info" />
                <MetricCard label="Agendamentos" value={data.agendamentos} meta={dailyGoals.agendamentos}
                  icon={<CalendarCheck className="w-5 h-5" />} onChange={(v) => update("agendamentos", v)}
                  onMetaChange={(v) => updateDG("agendamentos", v)} colorClass="text-success" />
              </div>
            </section>

            {/* Metas Mensais */}
            <section>
              <SectionHeader title="🎯 Metas Mensais" subtitle={`Acumulado de ${format(selectedDate, "MMMM yyyy", { locale: ptBR })}`} />
              <div className="stat-card animate-fade-in space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-4 mb-4">
                  {(Object.keys(monthlyGoals) as Array<keyof MonthlyGoals>).map((key) => (
                    <div key={key} className="flex flex-col gap-1 text-sm border-b pb-2">
                      <span className="text-muted-foreground capitalize font-medium">{key} meta:</span>
                      <input type="number" min={0} value={monthlyGoals[key]}
                        onChange={(e) => {
                          const updated = { ...monthlyGoals, [key]: Math.max(0, Number(e.target.value)) };
                          setMonthlyGoals(updated);
                          saveMonthlyGoals(updated);
                        }}
                        className="input-metric w-full text-base font-bold text-left" />
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4 pt-4">
                  <MonthlyGoalBar label="Pacientes" current={monthTotals.totalPacientes} goal={monthlyGoals.pacientes} />
                  <MonthlyGoalBar label="Faturamento (R$)" current={monthTotals.faturamento} goal={monthlyGoals.faturamento} />
                  <MonthlyGoalBar label="Leads" current={monthTotals.leadsTotal} goal={monthlyGoals.leads} />
                  <MonthlyGoalBar label="Agendamentos" current={monthTotals.agendamentos} goal={monthlyGoals.agendamentos} />
                  <MonthlyGoalBar label="Novos Seguidores" current={monthTotals.seguidores} goal={monthlyGoals.seguidores} />
                  
                  {/* Barra Especial para CAC - Quanto menor, melhor */}
                  <div className="pt-2">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-semibold text-foreground">CAC (R$) - Idealmente abaixo da meta</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground">R$ {cacAtual.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground ml-1">/ R$ {monthlyGoals.cac}</span>
                      </div>
                    </div>
                    {monthlyGoals.cac > 0 && (
                      <div className="progress-bar-track relative">
                        <div className={`h-full rounded-full transition-all duration-500 ease-out ${cacAtual > monthlyGoals.cac ? 'bg-destructive' : 'bg-success'}`}
                          style={{ width: `${Math.min((cacAtual / monthlyGoals.cac) * 100, 100)}%` }} />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      Gasto Acumulado: R$ {monthTotals.gastoTrafego.toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">{monthTotals.diasComDados} dia(s) com dados registrados no mês</p>
              </div>
            </section>
          </TabsContent>

          {/* PERIOD TAB */}
          <TabsContent value="period">
            <PeriodSummary dailyGoals={dailyGoals} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardPage;