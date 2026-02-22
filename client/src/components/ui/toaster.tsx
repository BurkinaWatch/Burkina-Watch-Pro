import { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { playNotificationSound, playAlertSound } from "@/lib/notificationSound"

export function Toaster() {
  const { toasts } = useToast()
  const prevCountRef = useRef(toasts.length)

  useEffect(() => {
    if (toasts.length > prevCountRef.current) {
      const latest = toasts[toasts.length - 1]
      if (latest?.variant === 'destructive') {
        playAlertSound()
      } else {
        playNotificationSound()
      }
    }
    prevCountRef.current = toasts.length
  }, [toasts.length])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
