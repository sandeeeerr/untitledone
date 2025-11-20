import { DemoProvider } from "./demo-components"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      {children}
    </DemoProvider>
  )
}


