import { Head } from "fresh/runtime";
import Layout from "@/components/Layout.tsx";
import HomeContent from "@/islands/HomeContent.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>NodeVault - Secure File Transfer</title>
      </Head>
      
      <Layout currentPath="/">
        <HomeContent />
      </Layout>
    </>
  );
}