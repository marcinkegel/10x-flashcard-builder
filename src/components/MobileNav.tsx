import * as React from "react"
import { Menu, LogOut } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface MobileNavProps {
  userEmail?: string
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })
      if (response.ok) {
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Otwórz menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-[300px] sm:w-[400px]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-bold">Flashcard Builder</SheetTitle>
          {userEmail && (
            <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
          )}
        </SheetHeader>
        <Separator className="my-2" />
        <nav className="flex flex-col gap-6 mt-6 px-2">
          <a
            href="/generate"
            className="text-lg font-medium transition-colors hover:text-primary ml-2"
            onClick={() => setOpen(false)}
          >
            Generuj
          </a>
          <a
            href="/flashcards"
            className="text-lg font-medium transition-colors hover:text-primary ml-2"
            onClick={() => setOpen(false)}
          >
            Moje fiszki
          </a>
          <a
            href="/profile"
            className="text-lg font-medium transition-colors hover:text-primary ml-2"
            onClick={() => setOpen(false)}
          >
            Profil
          </a>
        </nav>
        <SheetFooter className="mt-auto pt-6 border-t">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Wyloguj się
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
