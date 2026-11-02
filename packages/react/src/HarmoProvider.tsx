"use client";

import {
  createContext,
  useContext,
  type ElementType,
  type ReactNode,
} from "react";

export interface HarmoProviderProps {
  linkComponent?: ElementType;
  imageComponent?: ElementType;
  children?: ReactNode;
}

const LinkComponentContext = createContext<ElementType>("a");
const ImageComponentContext = createContext<ElementType>("img");

export const HarmoProvider = ({
  linkComponent = "a",
  imageComponent = "img",
  children,
}: HarmoProviderProps) => (
  <LinkComponentContext value={linkComponent}>
    <ImageComponentContext value={imageComponent}>
      {children}
    </ImageComponentContext>
  </LinkComponentContext>
);

export const useLinkComponent = () => useContext(LinkComponentContext);
export const useImageComponent = () => useContext(ImageComponentContext);
