import React, { createContext, useContext, useState } from 'react';
import GlobalLoader from '../components/common/GlobalLoader/GlobalLoader';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoader = (text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <LoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
      <GlobalLoader isVisible={isLoading} text={loadingText} />
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
