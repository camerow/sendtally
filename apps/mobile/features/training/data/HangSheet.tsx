import React from "react";
import { View } from "react-native";
import { Sheet, type SheetProps } from "../../../components/Sheet";
import { HangDataContext, useHangData } from "./HangDataContext";

/**
 * The app's sheet for training screens. A sheet renders at the modal host, outside this
 * tree, so the training data is handed on to its body and footer from where it is declared.
 */
export function HangSheet({ children, footer, ...props }: SheetProps): React.ReactElement | null {
  const data = useHangData();
  const relay = (node: React.ReactNode): React.ReactElement => (
    <HangDataContext.Provider value={data}>{node}</HangDataContext.Provider>
  );
  return (
    <Sheet {...props} footer={footer === undefined ? undefined : relay(footer)}>
      {relay(<View style={{ paddingHorizontal: 18, paddingTop: 4 }}>{children}</View>)}
    </Sheet>
  );
}
