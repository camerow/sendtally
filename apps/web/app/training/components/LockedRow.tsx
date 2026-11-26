import React from "react";

export function LockedRow({
  menu,
  card = false,
  children,
}: {
  menu: React.ReactNode;
  card?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return menu === undefined ? (
    <>{children}</>
  ) : (
    <div className={card ? "locked-row locked-row--card" : "locked-row"}>
      {children}
      {menu}
    </div>
  );
}
