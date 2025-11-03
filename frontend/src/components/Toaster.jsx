// src/components/Toaster.jsx
import { Toaster as Sonner } from "sonner"

const Toaster = (props) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-gray-50 group-[.toaster]:border-gray-800",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }