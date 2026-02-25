import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { DailyData, DailyGoals, MonthlyGoals } from "@/lib/storage";

interface ReportOptions {
  title: string;
  subtitle: string;
  data: DailyData;
  dailyGoals: DailyGoals;
  monthlyGoals?: MonthlyGoals;
  monthlyAccum?: Record<string, number>;
}

function pct(val: number, goal: number): string {
  if (!goal) return "-";
  return `${((val / goal) * 100).toFixed(0)}%`;
}

function avg(total: number, count: number): string {
  if (!count) return "0";
  return (total / count).toFixed(1);
}

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Nova função para calcular o CAC com segurança (evitar divisão por zero)
function calcCac(gasto: number, agendamentos: number): string {
  if (!agendamentos || agendamentos === 0) return "0,00";
  return formatCurrency(gasto / agendamentos);
}

export function generateDailyPDF(options: ReportOptions) {
  const { title, subtitle, data, dailyGoals, monthlyGoals } = options;
  const doc = new jsPDF();

  // Header (Preto e Cinza Escuro)
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0); 
  doc.text("Clínica Bruna Braga", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80); 
  doc.text(title, 105, 28, { align: "center" });
  doc.setFontSize(10);
  doc.text(subtitle, 105, 34, { align: "center" });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(20, 38, 190, 38);

  // Atendimentos
  let y = 45;
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Atendimentos", 20, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Métrica", "Valor", "Meta Diária", "% Meta"]],
    body: [
      ["Total Pacientes", String(data.totalPacientes), String(dailyGoals.totalPacientes), pct(data.totalPacientes, dailyGoals.totalPacientes)],
      ["Desmarcaram", String(data.desmarcaram), "-", "-"],
      ["Pacientes Novos", String(data.novos), "-", "-"],
      ["Recorrentes", String(data.recorrentes), "-", "-"],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    styles: { fontSize: 9, textColor: [40, 40, 40], lineColor: [220, 220, 220] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Faturamento
  doc.setFontSize(13);
  doc.text("Faturamento", 20, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [["Métrica", "Valor", "Meta Diária", "% Meta"]],
    body: [
      ["Faturamento (R$)", formatCurrency(data.faturamento), formatCurrency(dailyGoals.faturamento), pct(data.faturamento, dailyGoals.faturamento)],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    styles: { fontSize: 9, textColor: [40, 40, 40], lineColor: [220, 220, 220] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Procedimentos
  if (data.procedimentos) {
    doc.setFontSize(13);
    doc.text("Procedimentos", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(data.procedimentos, 170);
    doc.text(lines, 20, y);
    y += lines.length * 4 + 8;
    doc.setTextColor(30, 30, 30);
  }

  // Comercial e Tráfego
  if (y > 200) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.text("Comercial e Tráfego", 20, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [["Métrica", "Valor", "Meta Diária", "% Meta"]],
    body: [
      ["Total de Leads", String(data.leadsTotal), String(dailyGoals.leadsTotal), pct(data.leadsTotal, dailyGoals.leadsTotal)],
      ["Leads Campanha", String(data.leadsCampanha), "-", "-"],
      ["Leads Orgânico", String(data.leadsOrganico), "-", "-"],
      ["Leads Instagram", String(data.leadsInstagram), "-", "-"],
      ["Seguidores", String(data.seguidores), String(dailyGoals.seguidores), pct(data.seguidores, dailyGoals.seguidores)],
      ["Conversas Iniciadas", String(data.conversasIniciadas), String(dailyGoals.conversasIniciadas), pct(data.conversasIniciadas, dailyGoals.conversasIniciadas)],
      ["Conversas Respondidas", String(data.conversasRespondidas), String(dailyGoals.conversasRespondidas), pct(data.conversasRespondidas, dailyGoals.conversasRespondidas)],
      ["Agendamentos", String(data.agendamentos), String(dailyGoals.agendamentos), pct(data.agendamentos, dailyGoals.agendamentos)],
      ["Gasto Tráfego (R$)", formatCurrency(data.gastoTrafego), "-", "-"],
      ["CAC Atual (R$)", calcCac(data.gastoTrafego, data.agendamentos), monthlyGoals?.cac ? formatCurrency(monthlyGoals.cac) + " (Mensal)" : "-", "-"],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    styles: { fontSize: 9, textColor: [40, 40, 40], lineColor: [220, 220, 220] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Clínica Bruna Braga - ${subtitle}`, 20, 290);
    doc.text(`Página ${i}/${pageCount}`, 190, 290, { align: "right" });
  }

  doc.save(`relatorio_${title.replace(/\s/g, "_").toLowerCase()}.pdf`);
}

export function generatePeriodPDF(
  periodLabel: string,
  entries: { date: string; data: DailyData }[],
  totals: any,
  dailyGoals: DailyGoals,
) {
  const doc = new jsPDF("landscape");

  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text("Clínica Bruna Braga", 148, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Relatório do Período: ${periodLabel}`, 148, 22, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${entries.length} dia(s) com dados registrados`, 148, 28, { align: "center" });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(20, 32, 277, 32);

  // Tabela de Resumo (Adicionado Seguidores, Gasto e CAC)
  autoTable(doc, {
    startY: 38,
    head: [["Métrica", "Total do Período", "Média Diária"]],
    body: [
      ["Pacientes", String(totals.totalPacientes), avg(totals.totalPacientes, entries.length)],
      ["Desmarcaram", String(totals.desmarcaram), avg(totals.desmarcaram, entries.length)],
      ["Novos", String(totals.novos), avg(totals.novos, entries.length)],
      ["Recorrentes", String(totals.recorrentes), avg(totals.recorrentes, entries.length)],
      ["Faturamento (R$)", formatCurrency(totals.faturamento), formatCurrency(totals.faturamento / Math.max(entries.length, 1))],
      ["Leads Totais", String(totals.leadsTotal), avg(totals.leadsTotal, entries.length)],
      ["Seguidores", String(totals.seguidores), avg(totals.seguidores, entries.length)],
      ["Conversas Iniciadas", String(totals.conversasIniciadas), avg(totals.conversasIniciadas, entries.length)],
      ["Conversas Respondidas", String(totals.conversasRespondidas), avg(totals.conversasRespondidas, entries.length)],
      ["Agendamentos", String(totals.agendamentos), avg(totals.agendamentos, entries.length)],
      ["Gasto Tráfego (R$)", formatCurrency(totals.gastoTrafego), formatCurrency(totals.gastoTrafego / Math.max(entries.length, 1))],
      ["CAC Consolidado (R$)", calcCac(totals.gastoTrafego, totals.agendamentos), "-"],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    styles: { fontSize: 9, textColor: [40, 40, 40], lineColor: [220, 220, 220] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  let y = (doc as any).lastAutoTable.finalY + 10;

  // Detalhamento Diário (Adicionado Seg, Gasto e CAC - com abreviações para caber elegante)
  if (y > 140) { doc.addPage("landscape"); y = 20; }
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Detalhamento Diário", 20, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Data", "Pac.", "Nov.", "Fat. (R$)", "Leads", "Camp.", "Org.", "Seg.", "C.Ini", "C.Res", "Agend.", "Gasto (R$)", "CAC (R$)"]],
    body: entries.map((e) => {
      // Formata a data de '2024-05-10' para '10/05/24' para ficar compacto
      const shortDate = format(new Date(e.date + "T12:00:00"), "dd/MM/yy");
      return [
        shortDate, 
        String(e.data.totalPacientes), 
        String(e.data.novos),
        formatCurrency(e.data.faturamento), 
        String(e.data.leadsTotal),
        String(e.data.leadsCampanha), 
        String(e.data.leadsOrganico), 
        String(e.data.seguidores), 
        String(e.data.conversasIniciadas), 
        String(e.data.conversasRespondidas), 
        String(e.data.agendamentos),
        formatCurrency(e.data.gastoTrafego), 
        calcCac(e.data.gastoTrafego, e.data.agendamentos)
      ];
    }),
    theme: "grid",
    headStyles: { fillColor: [0, 0, 0], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, textColor: [40, 40, 40], lineColor: [220, 220, 220], cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Clínica Bruna Braga - Relatório ${periodLabel}`, 20, 200);
    doc.text(`Página ${i}/${pageCount}`, 277, 200, { align: "right" });
  }

  doc.save(`relatorio_periodo_${periodLabel.replace(/[\/\s]/g, "_")}.pdf`);
}