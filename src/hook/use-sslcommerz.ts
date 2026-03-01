'use client'

import { getEasyCheckoutScriptUrl } from '@/actions/payment/sslcommerz'
import { SSLCommerzEnv } from '@/types/payment-types'
import { useEffect, useRef, useCallback } from 'react'

interface UseSSLCommerzScriptOptions {
  env?: SSLCommerzEnv
  onLoad?: () => void
  onError?: () => void
}

export function useSSLCommerzScript({
  env = 'sandbox',
  onLoad,
  onError,
}: UseSSLCommerzScriptOptions = {}) {
  const loaded = useRef(false)

  const load = useCallback(() => {
    // Already injected
    if (loaded.current) {
      onLoad?.()
      return
    }

    const src = getEasyCheckoutScriptUrl(env)
    const script = document.createElement('script')
    script.src = src
    script.async = true

    script.onload = () => {
      loaded.current = true
      onLoad?.()
    }

    script.onerror = () => {
      onError?.()
    }

    const firstScript = document.getElementsByTagName('script')[0]
    firstScript?.parentNode?.insertBefore(script, firstScript)
  }, [env, onLoad, onError])

  useEffect(() => {
    load()
  }, [load])
}