'use client'

import SewingMachineLoader from './SewingMachineLoader'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  return <SewingMachineLoader size={size} text={text} fullScreen={fullScreen} />
}


















































