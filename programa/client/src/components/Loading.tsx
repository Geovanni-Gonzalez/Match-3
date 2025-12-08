import React from 'react';
import '../styles/Loading.css';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
    message = "Cargando",
    fullScreen = true
}) => {
    const content = (
        <div className="loading-container">
            <div className="loading-gem"></div>
            <div className="loading-text">
                {message}
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="loading-overlay">
                {content}
            </div>
        );
    }

    return content;
};
