import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalculatorStep = { step: number; label: string };

type CalculatorLayoutProps = {
  /** Título principal da calculadora (ex: "Correção do FGTS", "Divórcio") */
  title: string;
  /** Passos do wizard. Ex: [{ step: 1, label: "Dados do cálculo" }, { step: 2, label: "Resultado" }] */
  steps: CalculatorStep[];
  /** Passo ativo (1-based). Ex: 1 = primeiro passo */
  activeStep: number;
  /** Conteúdo do passo atual (formulário ou resultado) */
  children: React.ReactNode;
  /** Botão principal no rodapé: "PRÓXIMO" ou "CALCULAR" */
  primaryButton: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean };
  /** Link "Ajuda e sugestões" (se não passar, não exibe) */
  helpHref?: string;
  /** Classe extra no container */
  className?: string;
};

const CalculatorLayout = ({
  title,
  steps,
  activeStep,
  children,
  primaryButton,
  helpHref = "#",
  className,
}: CalculatorLayoutProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-6 max-w-4xl", className)}
    >
      {/* Breadcrumb + Título + Ajuda */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/calculadora" className="text-sm text-muted-foreground hover:text-foreground">Calculadoras</Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-0.5">{title}</h1>
        </div>
        {helpHref && (
          <a
            href={helpHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            <HelpCircle className="h-4 w-4" />
            Ajuda e sugestões
          </a>
        )}
      </div>

      {/* Stepper: Passo 1 ... Passo N */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        {steps.map(({ step, label }) => {
          const isActive = step === activeStep;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                isActive ? "bg-white/20 text-primary-foreground" : "bg-muted-foreground/20"
              )}>
                {step}
              </span>
              <span className="text-sm font-medium">Passo {step}</span>
              <span className="text-sm hidden sm:inline">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Conteúdo (formulário ou resultado) */}
      <div className="min-h-[200px]">{children}</div>

      {/* Botão principal (PRÓXIMO ou CALCULAR) */}
      <div className="flex justify-end">
        <Button
          onClick={primaryButton.onClick}
          disabled={primaryButton.disabled}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
        >
          {primaryButton.loading && (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2 inline-block" />
          )}
          {primaryButton.label}
        </Button>
      </div>
    </motion.div>
  );
};

export default CalculatorLayout;
