import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Vérifiez votre email pour confirmer votre inscription.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, hsl(239 84% 67%), hsl(263 70% 50%))" }}
      >
        <div className="flex items-center gap-3">
          <img src={logo} alt="CaterPilot" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-xl font-bold text-white">CaterPilot</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Lancez-vous en<br />quelques minutes.
          </h1>
          <p className="mt-4 text-white/70 text-lg max-w-md">
            Créez votre compte et commencez à gérer vos événements dès aujourd'hui.
          </p>
        </div>
        <p className="text-white/40 text-sm">© 2026 CaterPilot</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logo} alt="CaterPilot" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-xl font-bold">CaterPilot</span>
          </div>

          <h2 className="text-2xl font-bold">Créer un compte</h2>
          <p className="text-muted-foreground mt-1">Commencez gratuitement, sans engagement.</p>

          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="marc@traiteur.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-muted/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="6 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-muted/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="accent" className="w-full h-11" disabled={loading}>
              {loading ? "Création..." : "Créer mon compte"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
