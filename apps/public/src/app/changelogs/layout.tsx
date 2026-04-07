import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

export default function ChangelogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageWithHeaderFooter isContainer={false} wrapperClassName="gap-4">
      {children}
    </PageWithHeaderFooter>
  );
}
