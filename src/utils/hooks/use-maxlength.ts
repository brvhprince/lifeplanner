import {useCallback, useState} from 'react';

interface IUseMaxlength {
    threshold?: number; // Represents how many chars left are needed to return the counter value
    validate?: boolean, // if the browser doesn't support the maxlength attribute, attempt to type more than the indicated chars, will be prevented.
    utf8?: boolean, // counts using bytesize rather than length. eg: '£' is counted as 2 characters.
    maxLength: number | undefined, // the maximum number of characters allowed in input
    value?: string, // the initial value of the input
}

interface IUseMaxlengthReturn {
    isWarning: boolean;
    isLimitReached: boolean;
    isLimitExceeded: boolean;
    counter: number;
    isShowCounter: boolean;
    onChange: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const useMaxlength = ({
                          threshold = 10,
                          validate = false,
                          utf8 = false,
                          maxLength,
                          value,
                      }: IUseMaxlength): IUseMaxlengthReturn => {
    const [isWarning, setIsWarning] = useState(false);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [isLimitExceeded, setIsLimitExceeded] = useState(false);
    const [counter, setCounter] = useState(value ? value.length : 0);
    const [isShowCounter, setIsShowCounter] = useState(false);

    const onChange = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (!maxLength) return;

            const { value } = event.target as HTMLInputElement | HTMLTextAreaElement;
            const length = utf8 ? encodeURI(value).split(/%..|./).length - 1 : value.length;

            if (length >= maxLength) {
                setIsLimitReached(true);
                setIsLimitExceeded(true);
            } else if (length >= maxLength - threshold) {
                setIsWarning(true);
                setIsLimitReached(false);
                setIsLimitExceeded(false);
            } else {
                setIsWarning(false);
                setIsLimitReached(false);
                setIsLimitExceeded(false);
            }

            setCounter(length);

            if (validate && length > maxLength) {
                event.preventDefault();
            }

            if (length > 0) {
                setIsShowCounter(true);
            } else {
                setIsShowCounter(false);
            }

        },
        [maxLength, threshold, utf8, validate],
    );


    return {
        isWarning,
        isLimitReached,
        isLimitExceeded,
        counter,
        isShowCounter,
        onChange,
    };
}

export default useMaxlength;
