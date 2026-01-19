import { IDocPost } from "@/services/docs";

import { DocFolderService } from "@/lib/docs/doc-folder.service";
import { DocPostService } from "@/lib/docs/doc-post.service";

import DocRenderer from "./DocRenderer";
import DocsEmpty from "./DocsEmpty";
import GroupRender from "./GroupRender";

const DynamicDocPage = async ({ slugArray }: { slugArray: string[] }) => {
  const path = slugArray.join("/");

  // Try to get as document first
  const post = await DocPostService.getDocPostByPath(path, false);

  if (post && post.published) {
    // Render a documentation page
    // Fetch all published docs for navigation (can be optimized later)
    const allDocs = await DocPostService.listDocPosts({
      published: true,
      includeDeleted: false,
      limit: 1000, // Get all for navigation
    });
    return (
      <DocRenderer
        data={post as unknown as IDocPost}
        allDocs={(allDocs.posts || []) as IDocPost[]}
      />
    );
  }

  // Try to get as folder
  const folder = await DocFolderService.getFolderByPath(path, false);

  if (folder) {
    // Render a folder/group index page
    return <GroupRender groupPath={path} />;
  }

  // Not found
  return (
    <DocsEmpty
      title="No documentation found"
      description="There are no documentation pages available at the moment."
    />
  );
};

export default DynamicDocPage;
