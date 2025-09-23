// src/lib/env.ts
const envRef = {
    current: {
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      SUPABASE_BASE_KEY: "",
      RESEND_API_KEY: "",
      MAIL_FROM: "",
      MAX_USER_STORAGE_MB: 500,
      MAX_UPLOAD_FILE_MB: 200,
    },
};

export const reloadEnv = () => {
    envRef.current = {
        SUPABASE_URL: String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL), // fallback
        SUPABASE_ANON_KEY: String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        SUPABASE_BASE_KEY: String(process.env.SUPABASE_BASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        RESEND_API_KEY: String(process.env.RESEND_API_KEY || ""),
        MAIL_FROM: String(process.env.MAIL_FROM || ""),
        MAX_USER_STORAGE_MB: Number(process.env.MAX_USER_STORAGE_MB || 500),
        MAX_UPLOAD_FILE_MB: Number(process.env.MAX_UPLOAD_FILE_MB || 200),
    };
};
  
reloadEnv();

export const env = () => envRef.current;

export const getMaxUserStorageBytes = (): number => {
    const mb = Number(envRef.current.MAX_USER_STORAGE_MB || 500);
    if (Number.isNaN(mb) || mb <= 0) return 500 * 1024 * 1024;
    return mb * 1024 * 1024;
};

export const getMaxUploadFileBytes = (): number => {
    const mb = Number(envRef.current.MAX_UPLOAD_FILE_MB || 200);
    if (Number.isNaN(mb) || mb <= 0) return 200 * 1024 * 1024;
    return mb * 1024 * 1024;
};
