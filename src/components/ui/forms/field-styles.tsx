import classNames from 'classnames';

export const fieldBase =
    'h-11 w-full appearance-none rounded-md border px-4 py-2 text-input-large ring-[0.5px] focus:ring-[0.5px] md:h-12 lg:px-5 xl:h-[50px]';

export function fieldClass({ error, muted }: { error?: string; muted?: boolean }, extra?: string) {
    return classNames(fieldBase, extra, {
        'bg-transparent dark:bg-transparent border-input-border text-input-text placeholder:text-input-placeholder focus:border-brand ring-input-border focus:ring-brand dark:border-secondary-dark dark:text-secondary dark:ring-secondary-dark dark:placeholder:text-secondary-dark dark:focus:border-secondary-light dark:focus:ring-secondary-light':
            !muted && !error,
        'border-danger dark:border-danger text-danger-dark dark:text-danger-dark placeholder:text-danger-dark dark:placeholder:text-danger-dark bg-danger-soft focus:bg-transparent focus:border-danger-dark dark:focus:border-danger-dark focus:outline-none dark:ring-danger focus:ring-danger dark:focus:ring-danger':
            error,
        'bg-input-muted-bg dark:bg-secondary-dark border-input-border dark:border-secondary-dark text-input-text dark:text-input-text dark:placeholder:text-input-muted-placeholder placeholder:text-input-muted-placeholder':
            muted,
    });
}

export function FieldMessages({ error, helpText }: { error?: string; helpText?: string }) {
    return (
        <>
            {error && (
                <span role="alert" className="block pt-2 text-xs font-semibold text-danger-dark">
                    {error}
                </span>
            )}
            {helpText && <div className="mt-2 block text-body-2 text-body-muted">{helpText}</div>}
        </>
    );
}
