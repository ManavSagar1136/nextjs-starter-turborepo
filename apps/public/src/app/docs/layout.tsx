import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageWithHeaderFooter isContainer={false}>
      {children}
    </PageWithHeaderFooter>
  );
}
