import dynamic from "next/dynamic";

const ClientPage = dynamic(() => import("./ClientPage"), { ssr: true });

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <ClientPage />;
}
