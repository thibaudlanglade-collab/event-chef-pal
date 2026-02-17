import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChefHat,
  CalendarDays,
  FileText,
  Users,
  Package,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Star,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// hero dashboard image removed — now using Spline 3D

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">CaterPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Avantages</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Témoignages</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Connexion
            </Button>
            <Button variant="accent" size="sm" onClick={() => navigate("/register")} className="gap-1.5">
              Commencer <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Spline 3D Hero */}
      <section className="pt-24 pb-20 relative overflow-hidden min-h-screen flex items-center" style={{ background: 'hsl(var(--secondary) / 0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div className="flex flex-col gap-6 z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium w-fit border border-primary/15">
                <Sparkles className="h-4 w-4" />
                Nouveau — Assistant opérationnel pour traiteurs
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
                Gérez vos événements,{" "}
                <span className="bg-gradient-to-r from-primary to-[hsl(263,70%,58%)] bg-clip-text text-transparent">
                  simplifiez
                </span>{" "}
                votre quotidien
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                CaterPilot centralise vos devis, événements, équipes et stocks en une seule interface.
                Fini les fichiers Excel éparpillés et les oublis de dernière minute.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="gap-2 text-base px-8 py-6"
                >
                  Essayer gratuitement <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="gap-2 text-base px-8 py-6"
                >
                  Voir les fonctionnalités
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9/5 — 120+ utilisateurs</span>
              </div>
            </div>

            {/* Right: Spline Robot */}
            <div className="relative w-full h-[500px] lg:h-[600px]">
              {/* @ts-ignore */}
              <spline-viewer
                url="https://prod.spline.design/XeeA0FbGSlUxmOGI/scene.splinecode"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-secondary/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Tout ce qu'il vous faut, à portée de clic
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Des outils pensés pour les traiteurs indépendants qui veulent passer moins de temps sur l'admin.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarDays,
                title: "Calendrier événements",
                desc: "Vue mensuelle et hebdomadaire avec statuts colorés. Tout votre planning en un coup d'œil.",
                color: "bg-status-appointment/12 text-status-appointment",
              },
              {
                icon: FileText,
                title: "Devis Express",
                desc: "Créez des devis professionnels en moins de 5 minutes avec suggestions d'upsell intelligentes.",
                color: "bg-primary/12 text-primary",
              },
              {
                icon: Users,
                title: "Gestion d'équipe",
                desc: "Affectez votre staff par événement, suivez les confirmations et envoyez des invitations WhatsApp.",
                color: "bg-status-confirmed/12 text-status-confirmed",
              },
              {
                icon: Package,
                title: "Suivi des stocks",
                desc: "Alertes automatiques quand vos stocks passent sous le seuil. Fini les mauvaises surprises.",
                color: "bg-status-in-progress/12 text-status-in-progress",
              },
              {
                icon: Zap,
                title: "Alertes intelligentes",
                desc: "Devis sans réponse, staff manquant, stock bas — tout est signalé sur votre tableau de bord.",
                color: "bg-destructive/12 text-destructive",
              },
              {
                icon: TrendingUp,
                title: "Vue financière",
                desc: "Suivez votre chiffre d'affaires hebdomadaire et le statut de vos devis en temps réel.",
                color: "bg-status-completed/12 text-status-completed",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border-border/40 rounded-2xl"
              >
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  <button className="mt-4 text-sm font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    En savoir plus <ChevronRight className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Des résultats concrets dès le premier mois
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "5h", label: "gagnées par semaine", sub: "sur les tâches administratives" },
              { value: "50%", label: "de devis en plus", sub: "grâce aux suggestions d'upsell" },
              { value: "0", label: "oubli de stock", sub: "avec les alertes automatiques" },
              { value: "< 5 min", label: "par devis", sub: "création et envoi inclus" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-primary to-[hsl(263,70%,58%)] bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">{stat.label}</p>
                <p className="text-sm text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-secondary/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Un tarif simple et transparent
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choisissez la formule adaptée à votre activité.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <Card className="border-border/40 hover:shadow-card-hover transition-all rounded-2xl">
              <CardContent className="p-8">
                <h3 className="text-lg font-bold">Découverte</h3>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">0 €</span>
                  <span className="text-muted-foreground text-sm"> /mois</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Jusqu'à 5 événements par mois</p>
                <Button variant="outline" className="w-full mt-6" onClick={() => navigate("/register")}>
                  Commencer <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <ul className="mt-6 space-y-3 text-sm">
                  {["Tableau de bord", "Calendrier", "5 devis / mois", "Gestion d'équipe basique"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-status-confirmed shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-primary/40 shadow-card-hover relative scale-105 rounded-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[hsl(263,70%,58%)] text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                Populaire
              </div>
              <CardContent className="p-8">
                <h3 className="text-lg font-bold">Professionnel</h3>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">29 €</span>
                  <span className="text-muted-foreground text-sm"> /mois</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Événements illimités</p>
                <Button variant="accent" className="w-full mt-6" onClick={() => navigate("/register")}>
                  Essai gratuit 14 jours <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Tout de Découverte",
                    "Devis illimités + PDF",
                    "Upsell intelligent",
                    "Suivi des stocks",
                    "Invitations WhatsApp",
                    "Export Excel",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-status-confirmed shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-border/40 hover:shadow-card-hover transition-all rounded-2xl">
              <CardContent className="p-8">
                <h3 className="text-lg font-bold">Entreprise</h3>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">Sur mesure</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Pour les équipes de traiteurs</p>
                <Button variant="outline" className="w-full mt-6">
                  Nous contacter <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Tout de Professionnel",
                    "Multi-utilisateurs",
                    "Rapports avancés",
                    "Support prioritaire",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-status-confirmed shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Ils nous font confiance
            </h2>
            <p className="mt-4 text-muted-foreground">Ce qu'en disent les traiteurs qui l'utilisent au quotidien.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sophie M.",
                role: "Traiteur indépendant, Lyon",
                quote: "CaterPilot a révolutionné ma gestion. Je gagne 2h par jour sur l'administratif et mes devis sont envoyés en 3 minutes.",
              },
              {
                name: "Marc D.",
                role: "Chef traiteur, Paris",
                quote: "Les alertes de stock m'ont sauvé plusieurs fois. Plus jamais de serviettes manquantes le jour J !",
              },
              {
                name: "Claire B.",
                role: "Traiteur événementiel, Bordeaux",
                quote: "L'interface est tellement intuitive que toute mon équipe l'a adoptée en une journée. Zéro formation nécessaire.",
              },
            ].map((t, i) => (
              <Card key={i} className="border-border/40 hover:shadow-card-hover transition-all rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">"{t.quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-[hsl(263,70%,58%)] flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-20 px-4"
        style={{ background: "linear-gradient(135deg, hsl(239 84% 67%), hsl(263 70% 50%))" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Prêt à simplifier votre activité ?
          </h2>
          <p className="mt-4 text-white/70 text-lg">
            Rejoignez les traiteurs qui ont déjà transformé leur gestion avec CaterPilot.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="gap-2 text-base px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-lg font-bold"
            >
              Commencer gratuitement <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-base px-8 py-6 border-white/30 text-white hover:bg-white/10 bg-transparent"
            >
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ChefHat className="h-4 w-4 text-primary" />
                </div>
                <span className="text-lg font-bold">CaterPilot</span>
              </div>
              <p className="text-sm text-muted-foreground">
                L'assistant opérationnel des traiteurs indépendants.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Mises à jour</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Ressources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Guide de démarrage</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">CGU</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 CaterPilot. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
