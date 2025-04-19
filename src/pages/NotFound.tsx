import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card rounded-xl p-12 text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4 ai-gradient-text">404</h1>
        <p className="text-xl mb-6">Oops! This prediction market doesn't exist</p>
        <Link to="/">
          <Button size="lg" className="neural-glow bg-neural-accent hover:bg-neural-accent/90">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
