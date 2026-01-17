import { compareDesc } from "date-fns";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { BlogLayout } from "./BlogLayout";
import { BlogNewsletter } from "./BlogNewsletter";
import BlogsError from "./BlogsError";
import { FeaturedBlogPost } from "./FeaturedBlogPost";
import { FeaturedBlogPostSlider } from "./FeaturedBlogPostSlider";

const BlogWrapper = async ({
  allTags,
  allBlogs,
}: {
  allTags: IBlogTag[];
  allBlogs: IBlogPost[];
}) => {
  const posts: IBlogPost[] = allBlogs
    .filter((post) => post?.publishedAt)
    .sort((a, b) => {
      // Prioritize featured posts, then sort by featuredAt or publishedAt
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // If both are featured, sort by featuredAt
      if (a.featured && b.featured) {
        const dateA = a.featuredAt || a.publishedAt || "";
        const dateB = b.featuredAt || b.publishedAt || "";
        return compareDesc(new Date(dateA), new Date(dateB));
      }

      // Otherwise sort by publishedAt
      return compareDesc(
        new Date(a.publishedAt || ""),
        new Date(b.publishedAt || ""),
      );
    });

  // Get all featured posts
  const featuredPosts = posts.filter((post) => post.featured);
  const hasMultipleFeatured = featuredPosts.length > 1;

  // If no featured posts, use first post as featured
  const featuredPost = featuredPosts.length > 0 ? featuredPosts[0] : posts[0];

  // Regular posts exclude all featured posts (or the single featured post)
  const regularPosts = hasMultipleFeatured
    ? posts.filter((post) => !post.featured)
    : posts.filter((post) => post.id !== featuredPost?.id);

  if (posts.length === 0) {
    return (
      <BlogsError subTitle="blog post you're looking for doesn't exist. Please explore other posts or check back later for new content." />
    );
  }

  return (
    <div className="min-h-screen space-y-16">
      {/* Featured Post Section */}
      {hasMultipleFeatured ? (
        <FeaturedBlogPostSlider posts={featuredPosts} />
      ) : (
        featuredPost && <FeaturedBlogPost post={featuredPost} />
      )}

      {/* Main Blog Layout */}
      <BlogLayout posts={regularPosts} allTags={allTags} />

      {/* Newsletter Section */}
      <BlogNewsletter />
    </div>
  );
};

export default BlogWrapper;
