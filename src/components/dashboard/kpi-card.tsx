
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export default function KpiCard({ title, value, icon: Icon, children, className }: KpiCardProps) {
  return (
    <Card className={cn(
        "transition-shadow border border-border/50 shadow-sm",
        "bg-card",
        className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {children}
      </CardContent>
    </Card>
  );
}

    