import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import buildClient from '../utils/api';
import Header from "../components/Header";

export default function App({ Component, pageProps, authUser }: AppProps & { authUser: any }) {
  return (
    <div>
      <Header authUser={authUser} />
      <Component {...pageProps} authUser={authUser} />
    </div>
  )
}

App.getInitialProps = async ({ ctx, Component }: any) => {
  const res = await buildClient(ctx.req).get("/api/users/me");
  const pageProps = Component?.getInitialProps ? await Component.getInitialProps(ctx) : {};

  return {
    authUser: res.data?.result,
    pageProps
  };
}