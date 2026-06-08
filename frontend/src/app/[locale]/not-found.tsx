import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center px-6 py-24 max-w-2xl mx-auto">
        <p className="text-sm font-sans uppercase tracking-widest text-gold mb-4">
          404
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6 leading-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          The page you are looking for may have moved, been renamed, or no
          longer exists.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LinkButton href="/" size="lg">
            Return to Homepage
          </LinkButton>
          <LinkButton href="/contact" variant="outline" size="lg">
            Contact Us
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
