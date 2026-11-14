/**
 * Project: lifeplanner-webapp
 * File: label
 * Created by pennycodes on 10/08/2023.
 * Copyright lifeplanner-webapp
 */
import cn from 'classnames';

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...rest }) => {
    return <label className={cn('block text-label', className)} {...rest} />;
};

export default Label;
