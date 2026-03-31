import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogPosts, categoryColors } from "@/data/blogPosts";

const Blog = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Blog — Dating Tips, Safety & Culture"
        description="Expert advice on international dating, Filipino culture, relationship tips, and online safety. Stay informed with the MyFilipinoMatch blog."
        canonical="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "MyFilipinoMatch Blog",
          description:
            "Expert advice on international dating, Filipino culture, relationship tips, and online safety.",
          url: "https://www.myfilipinomatch.com/blog",
          publisher: {
            "@type": "Organization",
            name: "MyFilipinoMatch",
            url: "https://www.myfilipinomatch.com",
          },
          blogPost: blogPosts.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            author: { "@type": "Organization", name: post.author },
            datePublished: post.date,
          })),
        }}
      />
      <Navbar />
      <main className="flex-1 px-4 py-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1
              className="text-3xl font-bold md:text-4xl mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Dating Tips, Safety & Culture
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Expert advice to help you navigate international dating, understand
              Filipino culture, and stay safe online.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {blogPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="block">
                <Card className="h-full border-border bg-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <Badge
                      variant="outline"
                      className={`mb-4 text-xs font-medium ${categoryColors[post.category] || ""}`}
                    >
                      {post.category}
                    </Badge>
                    <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-16 text-center rounded-3xl gradient-hero p-10">
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
        </div>
      </main>
    </div>
  );
};

export default Blog;
