import Link from "next/link";
import { format } from "date-fns";
import { Calendar, FileText } from "lucide-react";

import { IDocPost } from "@/services/docs";
import { computeDocUrl } from "@/lib/docs/doc-url.service";
import { Card, CardContent, CardHeader } from "@buildbase/ui/components/ui/card";

const DocCard = ({ data }: { data: IDocPost | undefined }) => {
  if (!data) return null;

  const docUrl = data.url || computeDocUrl(data);

  return (
    <Link href={docUrl}>
      <div
        className="group h-full cursor-pointer mk-card mk-card-static hover:-translate-y-1 hover:shadow-lg p-0 bg-slate-50 dark:bg-dark-surface-secondary"
      >
        <div className="p-6 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400 dark:text-slate-600" />
              <h3 className="text-lg font-semibold transition-colors group-hover:text-indigo-500 text-slate-900 dark:text-slate-50">{data.title}</h3>
            </div>
          </div>
          {data.subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>}
        </div>

        <div className="px-6 pb-6 pt-0">
          {data.description && <p className="mb-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>}

          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-600">
            <Calendar className="h-3 w-3" />
            <span>{data.publishedAt ? format(new Date(data.publishedAt), "MMM d, yyyy") : "No date"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DocCard;
