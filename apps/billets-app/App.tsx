import { AuthContextProvider, useFirebaseAnalytics, useFirebaseCrashlytics } from '@/lib'
import { GlobalErrorBoundaryRegistry } from '@/lib/errors'
import { useColorSchemeStorage } from '@/lib/storage'
import { CommonScreenLayout } from '@/ui'
import { colors, ColorScheme } from '@coldsurfers/ocean-road'
import { ColorSchemeProvider, Spinner, Text, useColorScheme } from '@coldsurfers/ocean-road/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { memo, PropsWithChildren, Suspense, useEffect, useMemo, useState } from 'react'
import { Platform, useColorScheme as rnUseColorScheme, StatusBar, View } from 'react-native'
import BootSplash from 'react-native-bootsplash'
import codePush, { DownloadProgress, RemotePackage } from 'react-native-code-push'
import Config from 'react-native-config'
import FastImage from 'react-native-fast-image'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppContainer from './src/AppContainer'

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      retry: false,
    },
  },
})

const AppSystemColorSwitcher = memo(() => {
  const { colorScheme, setColorScheme } = useColorScheme()
  const systemColorScheme = rnUseColorScheme()
  const [storageColorSchemeValue] = useColorSchemeStorage()

  useEffect(() => {
    if (storageColorSchemeValue) {
      return
    }
    setColorScheme(systemColorScheme ?? 'light')
  }, [setColorScheme, storageColorSchemeValue, systemColorScheme])

  return <StatusBar translucent barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
})

const CodepushUpdateScreen = ({ progress }: { progress: DownloadProgress }) => {
  const percentage = `${Math.floor((progress.receivedBytes / progress.totalBytes) * 100)}%`
  return (
    <CommonScreenLayout style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
      <FastImage
        source={require('assets/bootsplash/logo.png')}
        style={{
          width: 124,
          height: 124,
          borderRadius: 124 / 2,
        }}
      />
      <View style={{ marginTop: 36, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '100%', backgroundColor: colors.oc.white.value, height: 24, borderRadius: 8 }}>
          <View
            style={{
              width: `${(progress.receivedBytes / progress.totalBytes) * 100}%`,
              backgroundColor: colors.oc.indigo[8].value,
              height: '100%',
              borderRadius: 8,
            }}
          />
        </View>
        <View style={{ marginTop: 24 }}>
          <Text weight="medium" style={{ fontSize: 18 }}>
            {percentage}
          </Text>
        </View>
      </View>
    </CommonScreenLayout>
  )
}

const BootSplashAwaiter = ({ children }: PropsWithChildren) => {
  const { enable: enableFirebaseAnalytics } = useFirebaseAnalytics()
  const { enable: enableFirebaseCrashlytics } = useFirebaseCrashlytics()
  const [progress, setProgress] = useState<DownloadProgress | null>(null)

  useEffect(() => {
    const init = async (): Promise<{
      existingUpdate: RemotePackage | null
    }> => {
      try {
        await enableFirebaseAnalytics(!__DEV__)
        await enableFirebaseCrashlytics(!__DEV__)
        const existingUpdate = __DEV__
          ? null
          : await codePush.checkForUpdate(
              Platform.select({
                ios: Config.IOS_CODE_PUSH_DEPLOYMENT_KEY,
                android: Config.ANDROID_CODE_PUSH_DEPLOYMENT_KEY,
              }),
            )
        return {
          existingUpdate,
        }
      } catch (e) {
        console.error(e)
        return {
          existingUpdate: null,
        }
      }
    }

    init()
      .then(async ({ existingUpdate }) => {
        if (!existingUpdate) {
          await BootSplash.hide({ fade: true })
          return
        }
        BootSplash.hide({ fade: true })
        const downloadedPackage = await existingUpdate.download((progress) => {
          setProgress(progress)
        })
        await downloadedPackage?.install(codePush.InstallMode.IMMEDIATE)
      })
      .catch((e) => {
        console.error(e)
        BootSplash.hide({ fade: true })
        setProgress(null)
      })
  }, [enableFirebaseAnalytics, enableFirebaseCrashlytics])

  return <>{progress ? <CodepushUpdateScreen progress={progress} /> : children}</>
}

const App = () => {
  const systemColorScheme = rnUseColorScheme()
  const [storageColorSchemeValue] = useColorSchemeStorage()

  const initialColorScheme: ColorScheme = useMemo(() => {
    if (storageColorSchemeValue) {
      return storageColorSchemeValue as 'light' | 'dark'
    }
    console.log('systemColorScheme', systemColorScheme)
    return systemColorScheme ?? 'light'
  }, [storageColorSchemeValue, systemColorScheme])

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ColorSchemeProvider initialColorScheme={initialColorScheme}>
          <GlobalErrorBoundaryRegistry>
            <AppSystemColorSwitcher />
            <QueryClientProvider client={queryClient}>
              <Suspense fallback={<GlobalSuspenseFallback />}>
                <AuthContextProvider>
                  <BootSplashAwaiter>
                    <AppContainer />
                  </BootSplashAwaiter>
                </AuthContextProvider>
              </Suspense>
            </QueryClientProvider>
          </GlobalErrorBoundaryRegistry>
        </ColorSchemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}

const GlobalSuspenseFallback = () => {
  const { semantics } = useColorScheme()

  return (
    <View style={{ flex: 1, backgroundColor: semantics.background[3], alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </View>
  )
}

export default __DEV__ ? App : codePush(App)
