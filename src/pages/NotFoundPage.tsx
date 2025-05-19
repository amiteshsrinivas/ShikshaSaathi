
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-edu-blue mb-4">404</h1>
      <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Sorry, we couldn't find the page you're looking for. Let's get you back to learning!
      </p>
      <Button asChild className="bg-edu-blue hover:bg-edu-blue/90">
        <Link to="/">Back to Chat</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;
