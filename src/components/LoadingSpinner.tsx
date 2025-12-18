import SewingMachineLoader from './ui/SewingMachineLoader'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return <SewingMachineLoader size={size} className={className} />
}

