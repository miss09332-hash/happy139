import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen } from "lucide-react";
import EmployeeGuide from "@/components/guide/EmployeeGuide";
import AdminGuide from "@/components/guide/AdminGuide";

export default function UserGuide() {
  const { isAdmin } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">操作指南</h1>
          <p className="text-sm text-muted-foreground">一步一步教你使用休假管理系統</p>
        </div>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="employee">
          <TabsList className="mb-4">
            <TabsTrigger value="employee">👤 員工指南</TabsTrigger>
            <TabsTrigger value="admin">🛡️ 管理員指南</TabsTrigger>
          </TabsList>
          <TabsContent value="employee">
            <EmployeeGuide />
          </TabsContent>
          <TabsContent value="admin">
            <AdminGuide />
          </TabsContent>
        </Tabs>
      ) : (
        <EmployeeGuide />
      )}
    </div>
  );
}
