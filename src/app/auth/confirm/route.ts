import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import createClient from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";

    // Ensure we're using HTTPS in production
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    
    if (token_hash && type) {
        const supabase = await createClient();

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });
        
        if (!error) {
            // redirect user to specified redirect URL or root of app
            redirect(next);
        } else {
            console.error('Email confirmation error:', error);
            // Redirect to error page with more specific error
            return NextResponse.redirect(`${protocol}://${host}/auth/login?error=confirmation-failed`);
        }
    }

    // redirect the user to an error page with some instructions
    return NextResponse.redirect(`${protocol}://${host}/auth/login?error=invalid-token`);
}
