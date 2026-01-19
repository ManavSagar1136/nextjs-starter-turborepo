import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageWithHeaderFooter wrapperClassName="gap-0" isContainer={false}>
      {children}
    </PageWithHeaderFooter>
  );
}
