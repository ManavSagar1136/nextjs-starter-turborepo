import * as React from "react";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
  readTime?: string;
  tags: string[];
  image?: string;
  featured?: boolean;
}

export interface BlogProps {
  posts: BlogPost[];
  onPostClick?: (post: BlogPost) => void;
  className?: string;
  variant?: "grid" | "list" | "featured";
  showAuthor?: boolean;
  showTags?: boolean;
  showReadTime?: boolean;
}

export function Blog({
  posts,
  onPostClick,
  className,
  variant = "grid",
  showAuthor = true,
  showTags = true,
  showReadTime = true,
}: BlogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderPost = (post: BlogPost) => (
    <Card
      key={post.id}
      className={cn("cursor-pointer transition-all hover:shadow-md", post.featured && "ring-primary ring-2")}
      onClick={() => onPostClick?.(post)}
    >
      {post.image && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={post.image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}

      <CardHeader>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(post.publishedAt)}</span>
          {showReadTime && post.readTime && (
            <>
              <span>•</span>
              <span>{post.readTime}</span>
            </>
          )}
        </div>

        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
        <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {showAuthor && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="text-xs">
                {post.author.name
                  .split(" ")
                  .map(n => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-sm">{post.author.name}</span>
          </div>
        )}

        {showTags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" className="h-auto p-0">
          Read more
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );

  if (variant === "list") {
    return (
      <div className={cn("space-y-6", className)}>
        {posts.map(post => (
          <Card
            key={post.id}
            className={cn("cursor-pointer transition-all hover:shadow-md", post.featured && "ring-primary ring-2")}
            onClick={() => onPostClick?.(post)}
          >
            <div className="flex gap-4 p-6">
              {post.image && (
                <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                  {showReadTime && post.readTime && (
                    <>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </>
                  )}
                </div>

                <h3 className="line-clamp-2 text-lg font-semibold">{post.title}</h3>
                <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>

                <div className="flex items-center justify-between">
                  {showAuthor && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback className="text-xs">
                          {post.author.name
                            .split(" ")
                            .map(n => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-sm">{post.author.name}</span>
                    </div>
                  )}

                  <Button variant="ghost" size="sm" className="h-auto p-0">
                    Read more
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "featured") {
    const featuredPost = posts.find(post => post.featured) || posts[0];
    const otherPosts = posts.filter(post => post.id !== featuredPost.id);

    return (
      <div className={cn("space-y-8", className)}>
        {/* Featured Post */}
        {featuredPost && (
          <Card className="ring-primary cursor-pointer ring-2 transition-all hover:shadow-md">
            {featuredPost.image && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img src={featuredPost.image} alt={featuredPost.title} className="h-full w-full object-cover" />
              </div>
            )}

            <CardHeader>
              <Badge className="w-fit">Featured</Badge>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(featuredPost.publishedAt)}</span>
                {showReadTime && featuredPost.readTime && (
                  <>
                    <span>•</span>
                    <span>{featuredPost.readTime}</span>
                  </>
                )}
              </div>

              <CardTitle className="text-2xl">{featuredPost.title}</CardTitle>
              <CardDescription className="text-base">{featuredPost.excerpt}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {showAuthor && (
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={featuredPost.author.avatar} />
                    <AvatarFallback>
                      {featuredPost.author.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground text-sm">{featuredPost.author.name}</span>
                </div>
              )}

              {showTags && featuredPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {featuredPost.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Button variant="ghost" size="sm" className="h-auto p-0">
                Read more
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Other Posts */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{otherPosts.map(renderPost)}</div>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>{posts.map(renderPost)}</div>
  );
}
