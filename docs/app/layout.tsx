import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: 'UntitledOne Documentation',
  description: 'Documentation for UntitledOne – Full-Stack Music Collaboration Platform'
}

const banner = <Banner storageKey="u1-docs-banner">UntitledOne Docs preview</Banner>
const navbar = (
  <Navbar
    logo={<b>UntitledOne Docs</b>}
  />
)
const footer = <Footer>MIT {new Date().getFullYear()} © UntitledOne.</Footer>

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/your-username/untitledone/tree/main/docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
