import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number;
  meta?: number;
  icon: ReactNode;
  onChange: (val: number) => void;
  onMetaChange?: (val: number) => void;
  colorClass?: string;
}

const MetricCard = ({ label, value, meta, icon, onChange, onMetaChange, colorClass = "text-primary" }: MetricCardProps) => {
  const percent = meta && meta > 0 ? Math.min((value / meta) * 100, 100) : 0;

  return (
    <div className="stat-card flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <span className={colorClass}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="input-metric text-2xl font-bold w-24"
        />
        {onMetaChange !== undefined && meta !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>/</span>
            <input
              type="number"
              min={0}
              value={meta}
              onChange={(e) => onMetaChange(Math.max(0, Number(e.target.value)))}
              className="input-metric w-16 text-xs"
            />
          </div>
        )}
      </div>
      {meta !== undefined && meta > 0 && (
        <div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{percent.toFixed(0)}% da meta</p>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
