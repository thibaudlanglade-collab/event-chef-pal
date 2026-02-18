import { Card, CardContent } from "@/components/ui/card";
import { Scale } from "lucide-react";

const Suppliers = () => (
  <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold">Comparaison Fournisseurs</h1>
    <Card className="rounded-2xl">
      <CardContent className="p-12 text-center space-y-4">
        <Scale className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">Fonctionnalité à venir — comparez vos fournisseurs.</p>
      </CardContent>
    </Card>
  </div>
);

export default Suppliers;
