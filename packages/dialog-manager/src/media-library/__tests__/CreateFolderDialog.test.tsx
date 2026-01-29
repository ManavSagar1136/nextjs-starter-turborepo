import { describe, it, expect } from "vitest";
import { MEDIA_LIBRARY_DIALOG_KEYS } from "../index";

describe("Media Library Dialogs", () => {
  describe("MEDIA_LIBRARY_DIALOG_KEYS", () => {
    it("should have all required dialog keys", () => {
      expect(MEDIA_LIBRARY_DIALOG_KEYS.CREATE_FOLDER).toBe("media-library:create-folder");
      expect(MEDIA_LIBRARY_DIALOG_KEYS.EDIT_FOLDER).toBe("media-library:edit-folder");
      expect(MEDIA_LIBRARY_DIALOG_KEYS.MOVE_FOLDER).toBe("media-library:move-folder");
      expect(MEDIA_LIBRARY_DIALOG_KEYS.CREATE_TAG).toBe("media-library:create-tag");
      expect(MEDIA_LIBRARY_DIALOG_KEYS.EDIT_TAG).toBe("media-library:edit-tag");
      expect(MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS).toBe("media-library:assign-tags");
      expect(MEDIA_LIBRARY_DIALOG_KEYS.MOVE_ASSET).toBe("media-library:move-asset");
      expect(MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD).toBe("media-library:upload");
    });
  });
});
