import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type UserRole = "admin" | "lawyer" | null;
const VALID_ROLES: UserRole[] = ["admin", "lawyer"];

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);
    const fetchIdRef = useRef(0);

    const fetchUserRole = useCallback(async (userId: string) => {
        const currentFetchId = ++fetchIdRef.current;
        try {
            const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();

            if (currentFetchId !== fetchIdRef.current) return;
            if (error) throw error;

            const validRole = VALID_ROLES.includes(data.role as UserRole) ? (data.role as UserRole) : null;
            setRole(validRole);
        } catch {
            if (currentFetchId === fetchIdRef.current) {
                setRole(null);
            }
        } finally {
            if (currentFetchId === fetchIdRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchUserRole]);

    // 9.1 — Realtime: sincroniza role sem reload quando admin altera o perfil do usuário
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel(`profile-role-${user.id}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
                (payload) => {
                    const newRole = (payload.new as Record<string, unknown>)["role"];
                    const validRole = VALID_ROLES.includes(newRole as UserRole) ? (newRole as UserRole) : null;
                    setRole(validRole);
                },
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("[Auth] signOut error:", error);
            setSession(null);
            setUser(null);
            setRole(null);
        }
    };

    return <AuthContext.Provider value={{ session, user, role, loading, signOut }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
