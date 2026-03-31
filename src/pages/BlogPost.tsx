import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogPosts, categoryColors } from "@/data/blogPosts";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <Link to="/blog">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Parse markdown-like content to JSX
  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return (
          <h2
            key={i}
            className="text-xl font-bold text-foreground mt-8 mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {block.replace("## ", "")}
          </h2>
        );
      }

      // Process inline bold markers
      const parts = block.split(/(\*\*.*?\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (block.startsWith("- ")) {
        const items = block.split("\n").filter((l) => l.startsWith("- "));
        return (
          <ul key={i} className="list-disc pl-6 space-y-1 text-muted-foreground text-sm leading-relaxed">
            {items.map((item, j) => {
              const itemParts = item.replace("- ", "").split(/(\*\*.*?\*\*)/g);
              return (
                <li key={j}>
                  {itemParts.map((part, k) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={k} className="font-semibold text-foreground">
                        {part.slice(2, -2)}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          {rendered}
        </p>
      );
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={`/blog/${post.slug}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          author: { "@type": "Organization", name: post.author },
          datePublished: post.date,
          publisher: {
            "@type": "Organization",
            name: "MyFilipinoMatch",
            url: "https://www.myfilipinomatch.com",
          },
        }}
      />
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <article className="mx-auto max-w-2xl">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          {/* Header */}
          <Badge
            variant="outline"
            className={`mb-4 text-xs font-medium ${categoryColors[post.category] || ""}`}
          >
            {post.category}
          </Badge>
          <h1
            className="text-3xl font-bold text-foreground mb-4 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
          </div>

          {/* Content */}
          <div className="space-y-4">{renderContent(post.content)}</div>

          {/* CTA */}
          <div className="mt-16 rounded-3xl gradient-hero p-10 text-center">
            <h2
              className="text-2xl font-bold text-primary-foreground mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to Find Your Match?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Join thousands of verified members looking for genuine connections.
            </p>
            <Link to="/signup">
              <Button
                variant="default"
                size="lg"
                className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold"
              >
                Create Free Account
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
};

export default BlogPost;
