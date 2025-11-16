export async function Footer() {
  "use cache";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {/* Company Name */}
          <div className="text-lg font-semibold font-[family-name:var(--font-medieval-mystery)]">
            Excalibur Jerky Co.
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} Excalibur Jerky Co. All rights reserved.
          </div>

          {/* Optional Links */}
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a
              href="/about-us"
              className="hover:text-foreground transition-colors"
            >
              About Us
            </a>
            <a
              href="/contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
