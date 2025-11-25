import { PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { I18n } from "@/utils/i18n.ts";

export default function App({ Component }: PageProps) {
  return (
    <html lang={I18n.getCurrentLanguage()}>
      <Head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NodeVault - Secure File Transfer</title>
        <link rel="stylesheet" href="/styles.css" />

        <script type="module" src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"></script>
        <script type="module" src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"></script>
        <script type="module" src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"></script>
      </Head>

      <body>
        <Component />
      </body>
    </html>
  );
}