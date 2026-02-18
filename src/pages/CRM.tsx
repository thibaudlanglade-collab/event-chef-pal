import { Card, CardContent } from "@/components/ui/card";
import { ContactRound } from "lucide-react";

const CRM = () => (
  <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold">CRM</h1>
    <p className="text-muted-foreground text-sm">Gérez vos contacts clients, suivez l'historique des interactions et pilotez vos prospects. (Bientôt disponible)</p>
    <Card className="rounded-2xl">
      <CardContent className="p-12 text-center space-y-4">
        <ContactRound className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground">Fonctionnalité à venir — gestion de la relation client.</p>
      </CardContent>
    </Card>
  </div>
);

export default CRM;
