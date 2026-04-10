import Head from 'next/head';

export default function PWAHead() {
  return (
    <Head>
      {/* Apple Touch Icons */}
      <link rel="apple-touch-icon" href="/icon-192.svg" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.svg" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.svg" />
      <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.svg" />
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      <link rel="shortcut icon" href="/icon.svg" />
      
      {/* Splash screens for iOS */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="AgriBridge" />
      
      {/* Windows */}
      <meta name="msapplication-TileImage" content="/icon-192.svg" />
      <meta name="msapplication-TileColor" content="#16a34a" />
      
      {/* PWA */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="AgriBridge" />
    </Head>
  );
}