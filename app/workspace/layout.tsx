import { SidebarProvider } from '@/components/ui/sidebar';
import React from 'react'
import { AppSideBar } from './_components/AppSidebar';
import AppHeader from './_components/AppHeader';

function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
        <AppSideBar/>
    <div className='w-full'>
      <AppHeader/>
      {children}
    </div>
    </SidebarProvider>
  )
}

export default WorkspaceLayout
