import { AuthApis } from "./auth/auth.service";
import { EmailProviderApis, EmailTemplateApis, EmailSentApis, EmailStatsApis } from "./email";
import { AssetApis } from "./assets";
import { MediaLibraryService } from "./media-library";

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
};
