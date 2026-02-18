import { Card, CardContent } from "@/components/ui/card";
import { FileEdit } from "lucide-react";

const Brief = () => (
  <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold">Brief Créateur</h1>
    <Card className="rounded-2xl">
      <CardContent className="p-12 text-center space-y-4">
        <FileEdit className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">Fonctionnalité à venir — créez vos briefs créatifs.</p>
      </CardContent>
    </Card>
  </div>
);

export default Brief;
