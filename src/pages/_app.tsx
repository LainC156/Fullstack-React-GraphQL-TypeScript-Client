import { ChakraProvider } from '@chakra-ui/react'
import theme from '../theme'

function MyApp({ Component, pageProps }: any) {
  return (
      <ChakraProvider resetCSS theme={theme}
      // options={{
      //   useSystemColorMode: true,
      // }}
      >
        <Component {...pageProps} />
      </ChakraProvider>
  )
}

export default MyApp
