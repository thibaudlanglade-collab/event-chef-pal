import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Receipt, FileText, ArrowRight, Clock } from "lucide-react";

interface QuoteItem {
  name?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
}

interface AnnouncementCardProps {
  event: any;
  quote: any;
  onManageStaffing: (eventId: string) => void;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  sent: { label: "Envoyé", variant: "outline" },
  validated: { label: "Validé", variant: "default" },
  accepted: { label: "Validé", variant: "default" },
};

const typeLabels: Record<string, string> = {
  wedding: "Mariage", mariage: "Mariage", corporate: "Corporate",
  birthday: "Anniversaire", anniversaire: "Anniversaire", other: "Événement",
};

const AnnouncementCard = ({ event, quote, onManageStaffing }: AnnouncementCardProps) => {
  const clientName = (event.clients as any)?.name || "—";
  const dateStr = new Date(event.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const quoteStatus = statusLabels[quote?.status] || statusLabels.draft;
  const items: QuoteItem[] = Array.isArray(quote?.items) ? quote.items : [];

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-border">
      <CardContent className="p-5 space-y-4">
        {/* Event name + type badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
              {event.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{clientName}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {typeLabels[event.type] || event.type}
          </Badge>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateStr}
          </div>
          {event.venue && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.venue}
            </div>
          )}
          {event.guest_count > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5">
              <Users className="h-3.5 w-3.5" />
              {event.guest_count} convives
            </div>
          )}
          {event.time && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" />
              {event.time}
            </div>
          )}
        </div>

        {/* Quote summary */}
        {quote && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">
                {quote.total_ttc ? `${Number(quote.total_ttc).toLocaleString("fr-FR")} € TTC` : "—"}
              </span>
            </div>
            <Badge variant={quoteStatus.variant} className="text-xs">
              {quoteStatus.label}
            </Badge>
          </div>
        )}

        {/* Prestations list */}
        {items.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Prestations
            </p>
            <div className="grid gap-1">
              {items.slice(0, 5).map((item, i) => (
                <div key={i} className="text-sm text-foreground flex justify-between items-center bg-muted/40 rounded-md px-3 py-1.5">
                  <span>{item.name || item.description || `Item ${i + 1}`}</span>
                  {item.quantity && <span className="text-muted-foreground text-xs">×{item.quantity}</span>}
                </div>
              ))}
              {items.length > 5 && (
                <p className="text-xs text-muted-foreground pl-3">+{items.length - 5} autres prestations</p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {quote?.notes && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
            {quote.notes}
          </p>
        )}

        {/* CTA */}
        <Button
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => onManageStaffing(event.id)}
        >
          Gérer le staffing <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;
