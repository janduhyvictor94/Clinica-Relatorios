interface MonthlyGoalBarProps {
  label: string;
  current: number;
  goal: number;
}

const MonthlyGoalBar = ({ label, current, goal }: MonthlyGoalBarProps) => {
  const percent = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {current} / {goal}
        </span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default MonthlyGoalBar;
