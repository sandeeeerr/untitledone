export interface AuthResponse {
  user?: any;
  session?: any;
  error?: string;
}

export interface LogoutResponse {
  success?: boolean;
  error?: string;
}

export const authApi = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Signup failed" };
      }

      return data;
    } catch (error) {
      console.error("Signup API error:", error);
      return { error: "Network error during signup" };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Login failed" };
      }

      return data;
    } catch (error) {
      console.error("Login API error:", error);
      return { error: "Network error during login" };
    }
  },

  async signOut(): Promise<LogoutResponse> {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Logout failed" };
      }

      return data;
    } catch (error) {
      console.error("Logout API error:", error);
      return { error: "Network error during logout" };
    }
  },
}; 