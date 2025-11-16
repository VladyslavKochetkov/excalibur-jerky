import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { Button } from "@/components/ui/button";
import { getAboutUsData } from "@/sanity/lib/aboutUs";

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

export default async function AboutUsPage() {
  const aboutUs = await getAboutUsData();

  if (!aboutUs) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">About Us page not found</h1>
          <p className="text-muted-foreground mb-6">
            Please configure the About Us page content in Sanity Studio.
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
            {aboutUs.pageTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {aboutUs.pageSubtitle}
          </p>
        </div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Our Story Section */}
          {aboutUs.storyContent && aboutUs.storyContent.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                {aboutUs.storyTitle}
              </h2>
              <div className="prose prose-lg max-w-none dark:prose-invert prose-p:text-muted-foreground">
                <PortableText
                  value={aboutUs.storyContent as any}
                  components={portableTextComponents}
                />
              </div>
            </section>
          )}

          {/* Our Commitment Section */}
          {aboutUs.commitmentItems && aboutUs.commitmentItems.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                {aboutUs.commitmentTitle}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {aboutUs.commitmentItems.map((item, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Why Choose Us Section */}
          {aboutUs.whyChooseContent && aboutUs.whyChooseContent.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                {aboutUs.whyChooseTitle}
              </h2>
              <div className="prose prose-lg max-w-none dark:prose-invert prose-p:text-muted-foreground">
                <PortableText
                  value={aboutUs.whyChooseContent as any}
                  components={portableTextComponents}
                />
              </div>
            </section>
          )}

          {/* Call to Action */}
          <section className="text-center py-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              {aboutUs.ctaTitle}
            </h2>
            <Button asChild size="lg">
              <Link href="/catalog">{aboutUs.ctaButtonText}</Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
