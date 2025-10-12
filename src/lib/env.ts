// src/lib/env.ts
const envRef = {
    current: {
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      SUPABASE_BASE_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      RESEND_API_KEY: "",
      MAIL_FROM: "",
      NEXT_PUBLIC_SITE_URL: "",
      MAX_USER_STORAGE_MB: 50,
      MAX_UPLOAD_FILE_MB: 200,
      // External storage providers (Dropbox)
      DROPBOX_APP_KEY: "",
      DROPBOX_APP_SECRET: "",
      DROPBOX_REDIRECT_URI: "",
      // External storage providers (Google Drive)
      GOOGLE_DRIVE_CLIENT_ID: "",
      GOOGLE_DRIVE_CLIENT_SECRET: "",
      GOOGLE_DRIVE_REDIRECT_URI: "",
      // Token encryption
      STORAGE_TOKEN_ENCRYPTION_KEY_V1: "",
      STORAGE_TOKEN_ENCRYPTION_CURRENT_VERSION: "v1",
    },
};

export const reloadEnv = () => {
    envRef.current = {
        SUPABASE_URL: String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL), // fallback
        SUPABASE_ANON_KEY: String(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        SUPABASE_BASE_KEY: String(process.env.SUPABASE_BASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        SUPABASE_SERVICE_ROLE_KEY: String(process.env.SUPABASE_SERVICE_ROLE_KEY || ""),
        RESEND_API_KEY: String(process.env.RESEND_API_KEY || ""),
        MAIL_FROM: String(process.env.MAIL_FROM || ""),
        NEXT_PUBLIC_SITE_URL: String(process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://untitledone.nl' : 'http://localhost:3000')),
        MAX_USER_STORAGE_MB: Number(process.env.MAX_USER_STORAGE_MB || 50),
        MAX_UPLOAD_FILE_MB: Number(process.env.MAX_UPLOAD_FILE_MB || 200),
        // External storage providers (Dropbox)
        DROPBOX_APP_KEY: String(process.env.DROPBOX_APP_KEY || ""),
        DROPBOX_APP_SECRET: String(process.env.DROPBOX_APP_SECRET || ""),
        DROPBOX_REDIRECT_URI: String(process.env.DROPBOX_REDIRECT_URI || ""),
        // External storage providers (Google Drive)
        GOOGLE_DRIVE_CLIENT_ID: String(process.env.GOOGLE_DRIVE_CLIENT_ID || ""),
        GOOGLE_DRIVE_CLIENT_SECRET: String(process.env.GOOGLE_DRIVE_CLIENT_SECRET || ""),
        GOOGLE_DRIVE_REDIRECT_URI: String(process.env.GOOGLE_DRIVE_REDIRECT_URI || ""),
        // Token encryption
        STORAGE_TOKEN_ENCRYPTION_KEY_V1: String(process.env.STORAGE_TOKEN_ENCRYPTION_KEY_V1 || ""),
        STORAGE_TOKEN_ENCRYPTION_CURRENT_VERSION: String(process.env.STORAGE_TOKEN_ENCRYPTION_CURRENT_VERSION || "v1"),
    };
};
  
reloadEnv();

export const env = () => envRef.current;

export const getMaxUserStorageBytes = (): number => {
    const mb = Number(envRef.current.MAX_USER_STORAGE_MB || 500);
    if (Number.isNaN(mb) || mb <= 0) return 50 * 1024 * 1024;
    return mb * 1024 * 1024;
};

export const getMaxUploadFileBytes = (): number => {
    const mb = Number(envRef.current.MAX_UPLOAD_FILE_MB || 200);
    if (Number.isNaN(mb) || mb <= 0) return 200 * 1024 * 1024;
    return mb * 1024 * 1024;
};
