import { BlogApis } from "./blogs";
import { ChangelogApis } from "./changelogs";
import { ContactApi } from "./contact";
import { DocApis } from "./docs";
import { PublicApi } from "./public";

export const API = {
  blogs: new BlogApis(),
  changelogs: new ChangelogApis(),
  contact: new ContactApi(),
  docs: new DocApis(),
  public: new PublicApi(),
};
