import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

// Cache environment variables for performance
const ENV = env();

/**
 * Public routes configuration
 * Defines which routes are accessible without authentication
 */
const PUBLIC_ROUTES = {
    // Pages accessible without auth
    pages: {
        landing: "/",
        auth: "/auth",
    },
    // API routes accessible without auth (GET only)
    api: {
        profile: "/api/profile/",
        socials: "/api/socials/",
        projects: "/api/projects",
    },
    // OAuth routes (all methods) - these handle their own auth
    oauth: {
        storageConnect: "/api/storage/connect/",
        storageCallback: "/api/storage/callback/",
    },
} as const;

/**
 * Check if the current request path is publicly accessible
 */
function isPublicRoute(request: NextRequest): boolean {
    const path = request.nextUrl.pathname;
    const method = request.method;

    // Public pages (all methods)
    if (
        path === PUBLIC_ROUTES.pages.landing ||
        path.startsWith(PUBLIC_ROUTES.pages.auth) 
    ) {
        return true;
    }

    // OAuth routes (all methods) - handle their own auth validation
    if (
        path.startsWith(PUBLIC_ROUTES.oauth.storageConnect) ||
        path.startsWith(PUBLIC_ROUTES.oauth.storageCallback)
    ) {
        return true;
    }

    // Public API routes (GET only)
    if (method === "GET") {
        if (path.startsWith(PUBLIC_ROUTES.api.profile)) {
            return true;
        }
        if (path.startsWith(PUBLIC_ROUTES.api.socials)) {
            return true;
        }
        if (
            path.startsWith(PUBLIC_ROUTES.api.projects) &&
            request.nextUrl.searchParams.has("owner_username")
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Create a redirect response to the login page with the original path preserved
 */
function redirectToLogin(request: NextRequest): NextResponse {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
}

/**
 * Create a redirect response to the dashboard
 */
function redirectToDashboard(request: NextRequest): NextResponse {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value),
                );
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options),
                );
            },
        },
    });

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Authenticated user trying to access auth pages -> redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith("/auth")) {
        return redirectToDashboard(request);
    }

    // Unauthenticated user trying to access protected routes -> redirect to login
    if (!user && !isPublicRoute(request)) {
        return redirectToLogin(request);
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - static assets (images, fonts, etc.)
         */
        {
            source:
                "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
            missing: [
                { type: "header", key: "next-router-prefetch" },
                { type: "header", key: "purpose", value: "prefetch" },
            ],
        },
    ],
};
