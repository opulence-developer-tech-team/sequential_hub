import { Ruler } from 'lucide-react'

export default function FormHeader() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center shadow-sm">
          <Ruler className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Custom Measurement Form
          </h1>
          <p className="text-sm sm:text-base text-sky-100/90">
            Share your measurements for a precisely tailored, luxury fit.
          </p>
        </div>
      </div>
    </div>
  )
}














































