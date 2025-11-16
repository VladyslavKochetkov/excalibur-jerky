import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { Button } from "@/components/ui/button";
import { getContactUsData } from "@/sanity/lib/contactUs";
import { ContactForm } from "@/components/ContactForm";

// Custom components to support all block types
const portableTextComponents = {
  block: {
    normal: ({ children }: any) => {
      // Check if the block is empty or only contains whitespace
      const isEmpty = !children || (Array.isArray(children) && children.every((child: any) =>
        typeof child === 'string' ? !child.trim() : false
      ));

      // Render empty blocks as a line break
      if (isEmpty) {
        return <p className="h-4">&nbsp;</p>;
      }

      return <p>{children}</p>;
    },
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-semibold mt-3 mb-2">{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-base font-semibold mt-2 mb-1">{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-sm font-semibold mt-2 mb-1">{children}</h6>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    code: ({ children }: any) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
    link: ({ children, value }: any) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li>{children}</li>,
    number: ({ children }: any) => <li>{children}</li>,
  },
};

export default async function ContactPage() {
  const contactUs = await getContactUsData();

  if (!contactUs) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Contact Us page not found</h1>
          <p className="text-muted-foreground mb-6">
            Please configure the Contact Us page content in Sanity Studio.
          </p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-[family-name:var(--font-medieval-mystery)]">
            {contactUs.pageTitle}
          </h1>
          {contactUs.pageSubtitle && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {contactUs.pageSubtitle}
            </p>
          )}
        </div>

        {/* Content and Form Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Content Section */}
          <div className="space-y-6">
            {contactUs.content && contactUs.content.length > 0 && (
              <div className="prose prose-lg max-w-none dark:prose-invert prose-p:text-muted-foreground">
                <PortableText
                  value={contactUs.content as any}
                  components={portableTextComponents}
                />
              </div>
            )}
          </div>

          {/* Contact Form Section */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
