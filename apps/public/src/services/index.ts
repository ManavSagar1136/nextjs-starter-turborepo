import { BlogApis } from "./blogs";
import { ContactApi } from "./contact";
import { DocApis } from "./docs";
import { PublicApi } from "./public";

export const API = {
  blogs: new BlogApis(),
  contact: new ContactApi(),
  docs: new DocApis(),
  public: new PublicApi(),
};
