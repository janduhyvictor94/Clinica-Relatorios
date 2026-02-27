import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users, UserMinus, UserPlus, UserCheck,
  DollarSign, ClipboardList,
  Megaphone, Leaf, Instagram,
  CalendarCheck,
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
  defaultData, defaultDailyGoals, defaultMonthlyGoals,
  loadDailyData, saveDailyData,
  loadDailyGoals, saveDailyGoals,
  loadMonthlyGoals, saveMonthlyGoals,
  loadDataRange, sumDataRange, syncFromCloud
} from "@/lib/storage";
import { generateDailyPDF } from "@/lib/pdfExport";

const DashboardPage = () => {
  const [isSyncing, setIsSyncing] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [data, setData] = useState<DailyData>(defaultData);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>(defaultDailyGoals);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoals>(defaultMonthlyGoals);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsSyncing(true);
        await syncFromCloud();
        setData(loadDailyData(selectedDate));
        setDailyGoals(loadDailyGoals());
        setMonthlyGoals(loadMonthlyGoals());
      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        setIsSyncing(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isSyncing) {
      setData(loadDailyData(selectedDate));
      setSaved(true);
    }
  }, [selectedDate, isSyncing]);

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

  const handleSave = useCallback(async () => {
    await saveDailyData(selectedDate, data);
    setSaved(true);
    toast.success("Dados salvos e sincronizados!");
  }, [selectedDate, data]);

  if (isSyncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground">Clínica Bruna Braga</h2>
        <p className="text-muted-foreground mt-2">Sincronizando dados com a nuvem...</p>
      </div>
    );
  }

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthEntries = loadDataRange(monthStart, monthEnd);
  const monthTotals = sumDataRange(monthEntries);

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
                  />
                </PopoverContent>
              </Popover>

              <Button onClick={handleSave} variant={saved ? "outline" : "default"} className="gap-2">
                <Save className="w-4 h-4" />
                {saved ? "Salvo" : "Salvar"}
              </Button>

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

          <TabsContent value="daily" className="space-y-10">
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
                </div>
              </div>
              <div>
                <SectionHeader title="🩺 Procedimentos" subtitle="Procedimentos realizados hoje" />
                <div className="stat-card animate-fade-in">
                  <textarea value={data.procedimentos} onChange={(e) => update("procedimentos", e.target.value)}
                    placeholder="Ex: Botox (3), Preenchimento (2)..."
                    className="w-full h-32 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
            </section>

            <section>
              <SectionHeader title="📊 Comercial e Tráfego" subtitle="Leads e investimentos" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard label="Total de Leads" value={data.leadsTotal} meta={dailyGoals.leadsTotal}
                  icon={<TrendingUp className="w-5 h-5" />} onChange={(v) => update("leadsTotal", v)}
                  onMetaChange={(v) => updateDG("leadsTotal", v)} />
                <MetricCard label="Leads Campanha" value={data.leadsCampanha}
                  icon={<Megaphone className="w-5 h-5" />} onChange={(v) => update("leadsCampanha", v)} />
                <MetricCard label="Leads Orgânico" value={data.leadsOrganico}
                  icon={<Leaf className="w-5 h-5" />} onChange={(v) => update("leadsOrganico", v)} />
                <MetricCard label="Gasto Tráfego (R$)" value={data.gastoTrafego}
                  icon={<CreditCard className="w-5 h-5" />} onChange={(v) => update("gastoTrafego", v)}
                  colorClass="text-destructive" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
                <MetricCard label="Seguidores" value={data.seguidores} meta={dailyGoals.seguidores}
                  icon={<Instagram className="w-5 h-5" />} onChange={(v) => update("seguidores", v)}
                  onMetaChange={(v) => updateDG("seguidores", v)} />
                <MetricCard label="Agendamentos" value={data.agendamentos} meta={dailyGoals.agendamentos}
                  icon={<CalendarCheck className="w-5 h-5" />} onChange={(v) => update("agendamentos", v)}
                  onMetaChange={(v) => updateDG("agendamentos", v)} />
              </div>
            </section>

            <section>
              <SectionHeader title="🎯 Metas Mensais" />
              <div className="stat-card space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {(Object.keys(monthlyGoals) as Array<keyof MonthlyGoals>).map((key) => (
                    <div key={key} className="flex flex-col gap-1 text-sm border-b pb-2">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <input type="number" value={monthlyGoals[key]}
                        onChange={(e) => {
                          const updated = { ...monthlyGoals, [key]: Number(e.target.value) };
                          setMonthlyGoals(updated);
                          saveMonthlyGoals(updated);
                        }}
                        className="input-metric font-bold" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <MonthlyGoalBar label="Pacientes" current={monthTotals.totalPacientes} goal={monthlyGoals.pacientes} />
                  <MonthlyGoalBar label="Faturamento" current={monthTotals.faturamento} goal={monthlyGoals.faturamento} />
                  <MonthlyGoalBar label="Agendamentos" current={monthTotals.agendamentos} goal={monthlyGoals.agendamentos} />
                  <div className="pt-2">
                    <p className="text-sm font-semibold">CAC Atual: R$ {cacAtual.toFixed(2)} / Meta: R$ {monthlyGoals.cac}</p>
                    <div className="progress-bar-track mt-1">
                      <div className={`h-full rounded-full ${cacAtual > monthlyGoals.cac ? 'bg-destructive' : 'bg-success'}`}
                        style={{ width: `${Math.min((cacAtual / (monthlyGoals.cac || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="period">
            <PeriodSummary dailyGoals={dailyGoals} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardPage;