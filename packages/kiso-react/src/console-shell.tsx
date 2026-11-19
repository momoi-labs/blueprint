"use client";

import type { MouseEvent, ReactNode } from "react";
import { CircleUser, LogOut, UserRound } from "lucide-react";
import { ApplicationShell, type ApplicationShellGroup } from "./app-shell.js";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb.js";
import { Button } from "./button.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";
import { ThemeSelector } from "./theme-selector.js";

type ConsoleCrumb = {
  label: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

type ConsoleAccount = {
  identity: ReactNode;
  theme: string;
  onThemeChange: (theme: string) => void;
  onSignOut: () => void;
  href?: string;
  language?: ReactNode;
};

type ConsoleShellProps = {
  brand: ReactNode;
  brandMark: ReactNode;
  navigation: readonly ApplicationShellGroup[];
  navigationLabel?: string;
  breadcrumb: readonly ConsoleCrumb[];
  account: ConsoleAccount;
  status?: ReactNode;
  children: ReactNode;
};

function ConsoleBreadcrumb({ items }: { items: readonly ConsoleCrumb[] }) {
  return <Breadcrumb className="app-shell-breadcrumb">
    <BreadcrumbList>
      {items.flatMap((item, index) => {
        const last = index === items.length - 1;
        const crumb = <BreadcrumbItem key={`${index}-${item.label}`}>
          {last
            ? <BreadcrumbPage>{item.label}</BreadcrumbPage>
            : item.href
              ? <BreadcrumbLink href={item.href} onClick={item.onClick}>{item.label}</BreadcrumbLink>
              : <span>{item.label}</span>}
        </BreadcrumbItem>;
        return last ? [crumb] : [crumb, <BreadcrumbSeparator key={`${index}-sep`} />];
      })}
    </BreadcrumbList>
  </Breadcrumb>;
}

function ConsoleAccountMenu({ account }: { account: ConsoleAccount }) {
  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="btn-icon" aria-label="Account" title="Account">
        <CircleUser className="icon" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="app-shell-account">
      <p className="app-shell-account-identity">{account.identity}</p>
      {account.href
        ? <Button variant="ghost" size="sm" asChild>
          <a href={account.href}><UserRound className="icon" aria-hidden="true" />Account</a>
        </Button>
        : null}
      <ThemeSelector theme={account.theme} onChange={account.onThemeChange} />
      {account.language}
      <Button variant="ghost" size="sm" onClick={account.onSignOut}>
        <LogOut className="icon" aria-hidden="true" />Sign out
      </Button>
    </PopoverContent>
  </Popover>;
}

function ConsoleShell({ brand, brandMark, navigation, navigationLabel = "Primary", breadcrumb, account, status, children }: ConsoleShellProps) {
  return <ApplicationShell
    collapsible
    togglePlacement="header"
    shellLayout
    headerVariant="default"
    brand={brand}
    brandMark={brandMark}
    navigation={navigation}
    navigationLabel={navigationLabel}
    header={<>
      <ConsoleBreadcrumb items={breadcrumb} />
      <div className="grow" />
      {status == null || status === false ? null : <div className="app-shell-status">{status}</div>}
      <ConsoleAccountMenu account={account} />
    </>}
  >
    <div className="page">{children}</div>
  </ApplicationShell>;
}

export { ConsoleShell };
export type { ConsoleAccount, ConsoleCrumb, ConsoleShellProps };
