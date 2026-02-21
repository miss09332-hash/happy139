import { Lightbulb, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none text-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

export function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start mb-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
        {n}
      </span>
      <div className="pt-0.5">{children}</div>
    </div>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 mt-2 mb-2 text-sm">
      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
      <div>{children}</div>
    </div>
  );
}

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3 mt-2 mb-2 text-sm">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
      <div>{children}</div>
    </div>
  );
}

export function CommandBadge({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary" className="font-mono text-xs">{children}</Badge>;
}
