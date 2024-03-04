import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import Appbar from "@/components/UiComponents/Appbar/Nav";
import theme from '@/themes/theme';
import MainSidebar from '@/components/UiComponents/Appbar/MainSidebar';
import { Box } from '@mui/material';
import StoreProvider from './StoreProvider';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Influencer Platform',
  description: 'App for influencers and brands',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <script src="https://apis.google.com/js/platform.js?onload=init" async defer></script>
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <body className={inter.className}>
        <StoreProvider>
          <AppRouterCacheProvider options={{ enableCssLayer: false }}>
            <ThemeProvider theme={theme}>
              <Box style={{ width: '100%', display: 'flex', flexDirection: 'row' }}>
                <Box className='min-h-screen' style={{ width: '250px' }}>
                  <Appbar>
                    <MainSidebar />
                  </Appbar>
                </Box>
                <div className="w-full min-h-screen">
                  {children}
                </div>
              </Box>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
