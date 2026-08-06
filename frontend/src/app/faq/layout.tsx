import MainLayout from "@/src/components/layouts/MainLayout";

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}