import React, { createContext, useContext, useState, useEffect } from "react";

interface FocusContextType {
    isFocusMode: boolean;
    toggleFocusMode: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isFocusMode, setIsFocusMode] = useState(false);

    const toggleFocusMode = () => {
        setIsFocusMode(prev => !prev);
    };

    // When focus mode is on, we might want to hide elements by class
    useEffect(() => {
        if (isFocusMode) {
            document.body.classList.add("focus-mode");
        } else {
            document.body.classList.remove("focus-mode");
        }
    }, [isFocusMode]);

    return (
        <FocusContext.Provider value={{ isFocusMode, toggleFocusMode }}>
            {children}
        </FocusContext.Provider>
    );
};

export const useFocus = () => {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error("useFocus must be used within a FocusProvider");
    }
    return context;
};
