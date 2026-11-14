/**
 * Project: lifeplanner-webapp
 * File: active-link
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */
'use client';

import type { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import AnchorLink from '@/components/ui/links/anchor-link';
import classNames from 'classnames';

interface ActiveLinkProps extends LinkProps {
    activeClassName?: string;
    /** Also treat nested paths (e.g. /accounts/123) as active. */
    matchNested?: boolean;
    children?: React.ReactNode;
}

const ActiveLink: React.FC<ActiveLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>> = ({
    href,
    className,
    activeClassName = 'active',
    matchNested = true,
    ...props
}) => {
    const pathname = usePathname();
    const target = String(href);
    const isActive = pathname === target || (matchNested && target !== '/' && pathname.startsWith(`${target}/`));
    return (
        <AnchorLink
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={classNames(className, { [activeClassName]: isActive })}
            {...props}
        />
    );
};

export default ActiveLink;
