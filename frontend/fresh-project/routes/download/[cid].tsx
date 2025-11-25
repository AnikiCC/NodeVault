import { Head } from "fresh/runtime";
import { PageProps } from "fresh";
import Layout from "@/components/Layout.tsx";
import FileDownloadPage from "@/islands/FileDownloadPage.tsx";
import { I18n } from "@/utils/i18n.ts";

export default function DownloadRoute({ params, url }: PageProps) {
  const { cid } = params;
  const t = I18n.getTranslations();
  
  return (
    <>
      <Head>
        <title>{t.download.title}</title>
      </Head>
      <Layout currentPath={url.pathname}>
        <FileDownloadPage cid={cid} />
      </Layout>
    </>
  );  
}