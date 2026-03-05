import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, AlertTriangle, TrendingDown, DollarSign, Info, Activity, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface BreakdownItem {
    icon: React.ElementType;
    label: string;
    value: string;
    percent: number;
    status: "good" | "warning" | "bad";
    suggestion: string;
}

interface HealthScoreProps {
    score: number;
    label: string;
    breakdownItems?: BreakdownItem[];
}

const HealthScore = ({ score, label, breakdownItems = [] }: HealthScoreProps) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <TooltipProvider>
            <Card
                className={cn(
                    "glass-card border border-emerald-500/20 transition-all duration-500 overflow-hidden",
                    expanded ? "shadow-2xl shadow-black/5" : "hover:shadow-xl hover:shadow-black/5",
                )}
            >
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-10">
                            {/* Score Circle */}
                            <div className="relative shrink-0 flex items-center justify-center">
                                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                    <motion.circle
                                        cx="40"
                                        cy="40"
                                        r="34"
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 34}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - score / 100) }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-black text-[#10b981] tracking-tighter">{score}</span>
                                </div>
                            </div>

                            {/* Header Info */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                        ÍNDICE DE SAÚDE
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-slate-300 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="bottom"
                                            className="bg-[#001D4A] border-none text-white p-3 rounded-2xl shadow-2xl max-w-xs"
                                        >
                                            <p className="text-xs font-bold mb-1">Cálculo Estratégico:</p>
                                            <p className="text-[10px] opacity-70 leading-relaxed uppercase tracking-wider font-bold">
                                                Prazos (30%) + Honorários (25%) + Processos (25%) + Receita (20%).
                                                Clique para detalhes.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/20" />
                                    <span className="text-2xl font-black text-emerald-500 tracking-tight">
                                        {score}/100
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="h-3 w-3 text-slate-600 fill-slate-600" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="mt-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 transition-transform duration-500"
                        >
                            <ChevronDown
                                className={cn(
                                    "h-5 w-5 text-slate-400 transition-transform",
                                    expanded ? "rotate-180" : "",
                                )}
                            />
                        </button>
                    </div>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-6">
                                    <p className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                                        <span>📊</span> Fatores que compõem sua partitura (clique em cada um para
                                        detalhes):
                                    </p>

                                    <div className="space-y-4">
                                        {breakdownItems.map((item, i) => (
                                            <Tooltip key={i}>
                                                <TooltipTrigger asChild>
                                                    <div className="group cursor-pointer">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={cn(
                                                                        "flex h-9 w-9 items-center justify-center rounded-xl",
                                                                        item.status === "good"
                                                                            ? "bg-emerald-500/10 text-emerald-600"
                                                                            : item.status === "warning"
                                                                              ? "bg-amber-500/10 text-amber-600"
                                                                              : "bg-destructive/10 text-destructive",
                                                                    )}
                                                                >
                                                                    <item.icon className="h-4.5 w-4.5" />
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-700">
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                            <span
                                                                className={cn(
                                                                    "text-sm font-bold",
                                                                    item.status === "good"
                                                                        ? "text-emerald-500"
                                                                        : item.status === "warning"
                                                                          ? "text-amber-500"
                                                                          : "text-destructive",
                                                                )}
                                                            >
                                                                {item.value}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className={cn(
                                                                    "h-full rounded-full",
                                                                    item.status === "good"
                                                                        ? "bg-emerald-500"
                                                                        : item.status === "warning"
                                                                          ? "bg-amber-500"
                                                                          : "bg-destructive",
                                                                )}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${item.percent}%` }}
                                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="right"
                                                    className="bg-[#001D4A] border-none text-white p-3 rounded-2xl shadow-2xl max-w-xs ml-4"
                                                >
                                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-white/50">
                                                        Sugestão Técnica
                                                    </p>
                                                    <p className="text-xs font-bold leading-relaxed">
                                                        {item.suggestion}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
};

export default HealthScore;
