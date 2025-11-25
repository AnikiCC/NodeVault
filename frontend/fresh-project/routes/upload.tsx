import { Head } from "fresh/runtime";
import Layout from "@/components/Layout.tsx";
import FileUploadIsland from "@/islands/FileUploadIsland.tsx";
import { I18n } from "@/utils/i18n.ts";

export default function UploadPage() {
  const t = I18n.getTranslations();

  return (
    <>
      <Head>
        <title>Upload - NodeVault</title>
      </Head>
      
      <Layout currentPath="/upload">
        <div class="max-w-3xl mx-auto px-4 py-6">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-secondary mb-3">
              {t.upload.title}
              <span class="typewriter-after">|</span>
            </h1>
          </div>
          
          <FileUploadIsland />
        </div>
      </Layout>
    </>
  );
}