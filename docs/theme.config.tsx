import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>UntitledOne Docs</span>,
  project: { link: 'https://github.com/sandeeeerr/untitledone' },
  docsRepositoryBase: 'https://github.com/sandeeeerr/untitledone/tree/main/docs',
  footer: { text: `UntitledOne — © ${new Date().getFullYear()}` },
  useNextSeoProps() {
    return { titleTemplate: '%s – UntitledOne' }
  },
  sidebar: { defaultMenuCollapseLevel: 1 }
}

export default config
