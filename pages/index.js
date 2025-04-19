import Head from "next/head";
import dynamic from 'next/dynamic';

// Dynamically import the CanvasContainer component with SSR disabled
const CanvasContainer = dynamic(() => import('../components/CanvasContainer'), { ssr: false });

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Sketch Generator</title>
        <meta name="description" content="Turn your sketches into chrome sculptures" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CanvasContainer />
    </>
  );
}
