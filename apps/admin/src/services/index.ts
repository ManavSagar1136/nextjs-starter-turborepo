import { AuthApis } from "./auth/auth.service";
import { EmailProviderApis, EmailTemplateApis, EmailSentApis, EmailStatsApis } from "./email";
import { AssetApis } from "./assets";
import { MediaLibraryService } from "./media-library";
import { BlogPostApis, BlogFolderApis, BlogTagApis, BlogAuthorApis } from "./blogs";
import { DocPostApis, DocFolderApis } from "./docs";

export const API = {
  auth: new AuthApis(),
  email: {
    providers: new EmailProviderApis(),
    templates: new EmailTemplateApis(),
    sent: new EmailSentApis(),
    stats: new EmailStatsApis(),
  },
  assets: new AssetApis(),
  mediaLibrary: new MediaLibraryService(),
  blogs: {
    posts: new BlogPostApis(),
    folders: new BlogFolderApis(),
    tags: new BlogTagApis(),
    authors: new BlogAuthorApis(),
  },
  docs: {
    posts: new DocPostApis(),
    folders: new DocFolderApis(),
  },
};
