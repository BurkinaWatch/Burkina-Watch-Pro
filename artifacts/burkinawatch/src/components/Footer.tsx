import { Link } from "wouter";
import { Phone, MessageCircle, Mail } from "lucide-react";

export function SotyssiBranding({ compact = false }: { compact?: boolean }) {
  const logoUrl = `${import.meta.env.BASE_URL}images/sotyssi-logo.png`;

  return (
    <div className={`flex items-center justify-center ${compact ? "gap-1.5 text-xs" : "gap-2"}`}>
      <span>Un produit</span>
      <span className="rounded bg-white p-1">
        <img
          src={logoUrl}
          alt="SOTYSSI, maison mère de BurkinaWatch"
          className={`${compact ? "h-4" : "h-5"} w-auto object-contain opacity-70 transition-all duration-300 grayscale hover:opacity-100 hover:grayscale-0 dark:brightness-110`}
          loading="lazy"
        />
      </span>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 py-6 sm:py-8 mt-8 sm:mt-16 mb-20 sm:mb-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center space-y-6">
          {/* Contact Info */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            <a
              href="tel:+22665511323"
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-all hover:scale-105"
              title="Appeler"
            >
              <Phone className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">+226 65511323</span>
            </a>
            <a
              href="https://wa.me/22670019540"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all hover:scale-105"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">WhatsApp</span>
            </a>
            <a
              href="mailto:contact@burkinawatch.com"
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all hover:scale-105"
              title="Email"
            >
              <Mail className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Email</span>
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <Link href="/a-propos">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                À propos
              </span>
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/conditions">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Conditions d'utilisation
              </span>
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/confidentialite">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Politique de confidentialité
              </span>
            </Link>
          </div>

          {/* Copyright & SOTYSSI Brand */}
          <div className="pt-6 border-t border-border/50 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-foreground mb-1">
                BurkinaWatch
              </p>
              <p className="text-xs text-muted-foreground">
                Plateforme citoyenne de veille et d'engagement
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <span>© {currentYear} BurkinaWatch. Tous droits réservés.</span>
              <span className="hidden sm:inline text-border/60">•</span>
              <SotyssiBranding />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
