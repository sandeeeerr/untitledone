import Link from "next/link";
import { Home, FolderOpen, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
          <h2 className="text-3xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link href="/dashboard">
            <Button variant="default" className="w-full h-auto py-4 flex flex-col gap-2">
              <Home className="h-5 w-5" />
              <span className="font-medium">Go to Dashboard</span>
            </Button>
          </Link>
          
          <Link href="/projects">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <FolderOpen className="h-5 w-5" />
              <span className="font-medium">View Projects</span>
            </Button>
          </Link>
        </div>

        {/* Additional Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 text-sm">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <span className="hidden sm:inline text-muted-foreground/50">•</span>
          <Link 
            href="/docs" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Help & Documentation
          </Link>
        </div>

        {/* Search Hint */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for something specific?
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span>Try using the search in your projects or dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}




