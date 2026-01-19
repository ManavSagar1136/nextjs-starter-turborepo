import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageWithHeaderFooter
      isContainer={false}
      className="max-w-[1440px] px-4 md:px-6 pb-8"
      wrapperClassName="gap-0"
    >
      {children}
    </PageWithHeaderFooter>
  );
}
