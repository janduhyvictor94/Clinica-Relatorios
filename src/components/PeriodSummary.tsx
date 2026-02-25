import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import MonthlyGoalBar from "@/components/MonthlyGoalBar";
import SectionHeader from "@/components/SectionHeader";
import { DailyGoals, loadDataRange, sumDataRange } from "@/lib/storage";
import { generatePeriodPDF } from "@/lib/pdfExport";
import { toast } from "sonner";

interface PeriodSummaryProps {
  dailyGoals: DailyGoals;
}

type PresetKey = "today" | "7d" | "15d" | "30d" | "week" | "month" | "custom";

const PeriodSummary = ({ dailyGoals }: PeriodSummaryProps) => {
  const [preset, setPreset] = useState<PresetKey>("month");
  const [customStart, setCustomStart] = useState<Date>(subDays(new Date(), 30));
  const [customEnd, setCustomEnd] = useState<Date>(new Date());

  const { start, end } = useMemo(() => {
    const today = new Date();
    switch (preset) {
      case "today": return { start: today, end: today };
      case "7d": return { start: subDays(today, 6), end: today };
      case "15d": return { start: subDays(today, 14), end: today };
      case "30d": return { start: subDays(today, 29), end: today };
      case "week": return { start: startOfWeek(today, { locale: ptBR }), end: endOfWeek(today, { locale: ptBR }) };
      case "month": return { start: startOfMonth(today), end: endOfMonth(today) };
      case "custom": return { start: customStart, end: customEnd };
    }
  }, [preset, customStart, customEnd]);

  const entries = useMemo(() => loadDataRange(start, end), [start, end]);
  const totals = useMemo(() => sumDataRange(entries), [entries]);

  const periodLabel = `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;

  const handleExportPDF = () => {
    if (entries.length === 0) {
      toast.error("Nenhum dado encontrado no período.");
      return;
    }
    generatePeriodPDF(periodLabel, entries, totals, dailyGoals);
    toast.success("Relatório PDF gerado!");
  };

  const presets: { key: PresetKey; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "15d", label: "15 dias" },
    { key: "30d", label: "30 dias" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mês" },
    { key: "custom", label: "Personalizado" },
  ];

  const metrics = [
    { label: "Total Pacientes", value: totals.totalPacientes },
    { label: "Desmarcaram", value: totals.desmarcaram },
    { label: "Pacientes Novos", value: totals.novos },
    { label: "Recorrentes", value: totals.recorrentes },
    { label: "Faturamento (R$)", value: totals.faturamento, currency: true },
    { label: "Total de Leads", value: totals.leadsTotal },
    { label: "Leads Campanha", value: totals.leadsCampanha },
    { label: "Leads Orgânico", value: totals.leadsOrganico },
    { label: "Leads Instagram", value: totals.leadsInstagram },
    { label: "Seguidores (últ.)", value: totals.seguidores },
    { label: "Conversas Iniciadas", value: totals.conversasIniciadas },
    { label: "Conversas Respondidas", value: totals.conversasRespondidas },
    { label: "Agendamentos", value: totals.agendamentos },
    // NOVAS MÉTRICAS INJETADAS AQUI
    { label: "Gasto Tráfego", value: totals.gastoTrafego || 0, currency: true },
    { label: "CAC", value: totals.agendamentos > 0 ? (totals.gastoTrafego || 0) / totals.agendamentos : 0, currency: true },
  ];

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="stat-card">
        <SectionHeader title="📅 Selecione o Período" />
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((p) => (
            <Button key={p.key} variant={preset === p.key ? "default" : "outline"} size="sm"
              onClick={() => setPreset(p.key)}>
              {p.label}
            </Button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">De:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="w-3 h-3" />
                    {format(customStart, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart}
                    onSelect={(d) => d && setCustomStart(d)} locale={ptBR}
                    className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Até:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="w-3 h-3" />
                    {format(customEnd, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEnd}
                    onSelect={(d) => d && setCustomEnd(d)} locale={ptBR}
                    className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Período: <span className="font-medium text-foreground">{periodLabel}</span>
            {" · "}{entries.length} dia(s) com dados
          </p>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2">
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Summary Grid */}
      {entries.length === 0 ? (
        <div className="stat-card text-center py-12">
          <p className="text-muted-foreground">Nenhum dado registrado neste período.</p>
          <p className="text-sm text-muted-foreground mt-1">Preencha os dados na aba "Registro Diário".</p>
        </div>
      ) : (
        <>
          <div>
            <SectionHeader title="📊 Resumo do Período" subtitle={`${entries.length} dia(s) · Média diária entre parênteses`} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="stat-card">
                  <p className="stat-label">{m.label}</p>
                  <p className="stat-value text-xl mt-1">
                    {m.currency ? `R$ ${m.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : m.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Média: {m.currency
                      ? `R$ ${(m.value / entries.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : (m.value / entries.length).toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily table */}
          <div>
            <SectionHeader title="📋 Detalhamento Diário" />
            <div className="stat-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Data</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Pacientes</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Desm.</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Novos</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Recorr.</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Faturamento</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Leads</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Agend.</th>
                    {/* NOVAS COLUNAS INJETADAS AQUI */}
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Seg.</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Gasto</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">CAC</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.date} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2 font-medium">{e.date}</td>
                      <td className="py-2 px-2 text-right">{e.data.totalPacientes}</td>
                      <td className="py-2 px-2 text-right">{e.data.desmarcaram}</td>
                      <td className="py-2 px-2 text-right">{e.data.novos}</td>
                      <td className="py-2 px-2 text-right">{e.data.recorrentes}</td>
                      <td className="py-2 px-2 text-right">R$ {e.data.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-2 text-right">{e.data.leadsTotal}</td>
                      <td className="py-2 px-2 text-right">{e.data.agendamentos}</td>
                      {/* NOVOS DADOS DIÁRIOS AQUI */}
                      <td className="py-2 px-2 text-right">{e.data.seguidores || 0}</td>
                      <td className="py-2 px-2 text-right">R$ {(e.data.gastoTrafego || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-2 text-right">R$ {(e.data.agendamentos > 0 ? (e.data.gastoTrafego || 0) / e.data.agendamentos : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-muted/20">
                    <td className="py-2 px-2">TOTAL</td>
                    <td className="py-2 px-2 text-right">{totals.totalPacientes}</td>
                    <td className="py-2 px-2 text-right">{totals.desmarcaram}</td>
                    <td className="py-2 px-2 text-right">{totals.novos}</td>
                    <td className="py-2 px-2 text-right">{totals.recorrentes}</td>
                    <td className="py-2 px-2 text-right">R$ {totals.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2 text-right">{totals.leadsTotal}</td>
                    <td className="py-2 px-2 text-right">{totals.agendamentos}</td>
                    {/* NOVOS TOTAIS AQUI */}
                    <td className="py-2 px-2 text-right">{totals.seguidores}</td>
                    <td className="py-2 px-2 text-right">R$ {(totals.gastoTrafego || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2 text-right">R$ {(totals.agendamentos > 0 ? (totals.gastoTrafego || 0) / totals.agendamentos : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PeriodSummary;