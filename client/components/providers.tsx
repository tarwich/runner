import React, { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  providers: ReactNode[];
};

export const Providers = ({ providers, children }: Props) => {
  return (
    <>
      {providers.reduce((acc: ReactNode, provider: ReactNode) => {
        if (React.isValidElement(provider)) {
          return React.cloneElement(provider, {}, acc);
        } else return acc;
      }, children)}
    </>
  );
};
