import { AuthApis } from "./auth/auth.service";
import { MediaLibraryService } from "./media-library";

export const API = {
  auth: new AuthApis(),
  mediaLibrary: new MediaLibraryService(),
};
