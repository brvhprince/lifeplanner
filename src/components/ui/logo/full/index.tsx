/**
 * Project: lifeplanner-webapp
 * File: index
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */
"use client";

import cn from 'classnames';
import AnchorLink from '@/components/ui/links/anchor-link';
import routes from '@/config/routes';
import { useIsMounted } from '@/utils/hooks/use-is-mounted';
import { useIsDarkMode } from '@/utils/hooks/use-is-dark-mode';
import {FullLightLogo} from "@/components/ui/logo/full/light";
import {FullPrimaryLogo} from "@/components/ui/logo/full/primary";

export default function FullLogo({
                                     className = 'w-20',
                                     ...props
                                 }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    const isMounted = useIsMounted();
    const { isDarkMode } = useIsDarkMode();
    return (
        <AnchorLink
            href={routes.home}
            className={cn(
                'relative flex items-center text-dark focus:outline-none dark:text-light',
                className
            )}
            {...props}
        >
      <span
          className="relative overflow-hidden transition duration-300 ease-in-out transform hover:scale-110 h-full w-full"
      >
        {isMounted && isDarkMode && (
            <FullLightLogo
                className="w-full h-full"
            />
        )}
          {isMounted && !isDarkMode && (
              <FullPrimaryLogo
                  className="w-full h-full"
              />
          )}
      </span>
        </AnchorLink>
    );
}
