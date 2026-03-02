import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { ConfigInformacoesTab } from "@/components/configuracoes/ConfigInformacoesTab";
import { ConfigAssinaturaTab } from "@/components/configuracoes/ConfigAssinaturaTab";
import { ConfigSenhaTab } from "@/components/configuracoes/ConfigSenhaTab";
import { ConfigLogoCard } from "@/components/configuracoes/ConfigLogoCard";
import { ConfigGeminiCard } from "@/components/configuracoes/ConfigGeminiCard";
import { ConfigWhatsAppCard } from "@/components/configuracoes/ConfigWhatsAppCard";
import { ConfigGoogleCalendarCard } from "@/components/configuracoes/ConfigGoogleCalendarCard";
import { ConfigPagamentosCard } from "@/components/configuracoes/ConfigPagamentosCard";
import { ConfigAssinaturaEletronicaCard } from "@/components/configuracoes/ConfigAssinaturaEletronicaCard";
import { ConfigSessaoCard } from "@/components/configuracoes/ConfigSessaoCard";

const Configuracoes = () => {
    const { isLoading } = useProfile();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Carregando...</span>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
            <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Atualize seus dados</h1>
                <p className="mt-1 text-muted-foreground">Gerencie seu perfil, assinatura, senha e cartões.</p>
            </div>

            <Tabs defaultValue="informacoes" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 gap-1 bg-muted">
                    <TabsTrigger
                        value="informacoes"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        Informações
                    </TabsTrigger>
                    <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
                    <TabsTrigger value="senha">Alterar Senha</TabsTrigger>
                </TabsList>

                <TabsContent value="informacoes" className="mt-4 space-y-6">
                    <ConfigInformacoesTab />

                    <Separator className="my-6" />

                    <div>
                        <h2 className="font-display text-xl font-bold text-foreground">Configurações gerais</h2>
                        <p className="mt-1 text-muted-foreground text-sm">Logo, IA, WhatsApp e integrações.</p>
                    </div>

                    <ConfigLogoCard />
                    <ConfigGeminiCard />
                    <ConfigWhatsAppCard />
                    <ConfigGoogleCalendarCard />
                    <ConfigPagamentosCard />
                    <ConfigAssinaturaEletronicaCard />
                    <ConfigSessaoCard />
                </TabsContent>
                <TabsContent value="assinatura" className="mt-4">
                    <ConfigAssinaturaTab />
                </TabsContent>
                <TabsContent value="senha" className="mt-4">
                    <ConfigSenhaTab />
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default Configuracoes;
