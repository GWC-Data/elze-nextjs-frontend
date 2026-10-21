'use client'

/**
 * react-router-dom compatible surface on top of the Next.js App Router, so the
 * existing pages and components keep working unchanged.
 */
import * as React from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import { matchRouteParams } from '@/router/routePatterns'

type To = string | { pathname?: string; search?: string; hash?: string }

function toHref(to: To): string {
  if (typeof to === 'string') return to
  return `${to.pathname ?? ''}${to.search ?? ''}${to.hash ?? ''}`
}

/* ---- location.state (react-router's navigate(to, { state })) ---- */
const navState = new Map<string, unknown>()
const pathOf = (href: string) => href.split(/[?#]/)[0]

export interface NavigateOptions {
  replace?: boolean
  state?: unknown
}

export function useNavigate() {
  const router = useRouter()
  return React.useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        if (to < 0) router.back()
        else window.history.go(to)
        return
      }
      const href = toHref(to)
      if (options?.state !== undefined) navState.set(pathOf(href), options.state)
      if (options?.replace) router.replace(href)
      else router.push(href)
    },
    [router],
  )
}

export function useLocation() {
  const pathname = usePathname() ?? '/'
  const params = useNextSearchParams()
  const search = params && params.toString() ? `?${params.toString()}` : ''
  const [hash, setHash] = React.useState('')
  React.useEffect(() => {
    setHash(window.location.hash)
  }, [pathname, search])
  return { pathname, search, hash, state: navState.get(pathname) ?? null, key: pathname + search }
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const pathname = usePathname() ?? '/'
  return React.useMemo(() => matchRouteParams(pathname) as T, [pathname])
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const params = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const current = React.useMemo(() => new URLSearchParams(params?.toString() ?? ''), [params])
  const set = React.useCallback(
    (next: URLSearchParams | Record<string, string>) => {
      const qs = new URLSearchParams(next as Record<string, string>).toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname],
  )
  return [current, set]
}

type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & { to: To; replace?: boolean }

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  return <NextLink ref={ref} href={toHref(to)} {...rest} />
})

type NavLinkProps = Omit<LinkProps, 'className'> & {
  end?: boolean
  className?: string | ((state: { isActive: boolean }) => string)
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, end, className, ...rest },
  ref,
) {
  const pathname = usePathname() ?? '/'
  const target = pathOf(toHref(to))
  const isActive = end ? pathname === target : pathname === target || pathname.startsWith(`${target}/`)
  const resolved = typeof className === 'function' ? className({ isActive }) : className
  return <NextLink ref={ref} href={toHref(to)} className={resolved} {...rest} />
})

export function Navigate({ to, replace }: { to: To; replace?: boolean }) {
  const router = useRouter()
  const href = toHref(to)
  React.useEffect(() => {
    if (replace) router.replace(href)
    else router.push(href)
  }, [router, href, replace])
  return null
}

/* ---- Outlet context: layouts provide it, pages read it ---- */
const OutletContext = React.createContext<unknown>(undefined)

export function OutletContextProvider<T>({ value, children }: { value: T; children: React.ReactNode }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>
}

export function useOutletContext<T = unknown>(): T {
  return React.useContext(OutletContext) as T
}
