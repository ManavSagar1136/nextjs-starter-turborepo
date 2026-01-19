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
      <Card className="group h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground h-4 w-4" />
              <h3 className="group-hover:text-primary text-lg font-semibold transition-colors">{data.title}</h3>
            </div>
          </div>
          {data.subtitle && <p className="text-muted-foreground mt-1 text-sm">{data.subtitle}</p>}
        </CardHeader>

        <CardContent className="pt-0">
          {data.description && <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">{data.description}</p>}

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{data.publishedAt ? format(new Date(data.publishedAt), "MMM d, yyyy") : "No date"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default DocCard;
