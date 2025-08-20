const envRef = {
    current: {
        SUPABASE_URL: "",
        SUPABASE_ANON_KEY: "",
        SUPABASE_BASE_KEY: "",
        RESEND_API_KEY: "",
        MAIL_FROM: "",
    },
};

export const reloadEnv = () => {
    envRef.current = {
        SUPABASE_URL: String(process.env.SUPABASE_URL),
        SUPABASE_ANON_KEY: String(process.env.SUPABASE_ANON_KEY),
        SUPABASE_BASE_KEY: String(
            process.env.SUPABASE_BASE_KEY ||
                process.env.SUPABASE_ANON_KEY,
        ),
        RESEND_API_KEY: String(process.env.RESEND_API_KEY || ""),
        MAIL_FROM: String(process.env.MAIL_FROM || ""),
    };
};

reloadEnv();

export const env = () => envRef.current;
