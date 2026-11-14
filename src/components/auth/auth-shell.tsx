import { ShapesBg } from '@/components/auth/shapes-bg';
import Emojis from '@/components/auth/emojis';
import FullLogo from '@/components/ui/logo/full';
import ThemeSwitcher from '@/components/ui/theme-switcher';

/** Split-screen layout shared by setup, sign-in and two-factor pages. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-full bg-light dark:bg-dark">
            <div className="flex min-h-full flex-1">
                <div className="relative z-10 hidden w-0 flex-1 bg-grey-800 p-8 lg:block">
                    <ShapesBg className="absolute inset-0 h-full w-full object-cover" />
                    <div>
                        <FullLogo className="w-56" />
                    </div>
                    <div className="relative z-20 flex h-full flex-col items-center justify-center">
                        <Emojis />
                        <div className="mt-8 text-center">
                            <h3 className="text-3xl font-bold text-light">Your life, on your own server</h3>
                            <p className="pt-4 text-sm text-light">
                                Money, goals, plans and memories, kept private on hardware you control.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 md:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <ThemeSwitcher />
                    <div className="mt-10 w-full">
                        <div className="px-6 pb-8 pt-10 md:px-8 lg:p-12">
                            <div className="relative z-10 flex items-center justify-center">
                                <div className="w-full shrink-0 text-left md:w-[380px]">{children}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AuthHeading({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col pb-5 text-left xl:pb-6 xl:pt-2">
            <p className="pb-8 text-3xl">{emoji}</p>
            <h2 className="text-heading-2 font-semibold text-heading-dark dark:text-heading-light">{title}</h2>
            <div className="mt-1.5 text-subheading leading-6 tracking-[0.2px] dark:text-body-dark lg:mt-2.5 xl:mt-3">
                {subtitle}
            </div>
        </div>
    );
}
