import { ContactApi } from "./contact";
import { PublicApi } from "./public";

export const API = {
  contact: new ContactApi(),
  public: new PublicApi(),
};
