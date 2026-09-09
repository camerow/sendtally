export type MembershipManagedIn = "web" | "play_store" | "app_store" | "other";

export type MembershipVM = {
  active: boolean;
  statusLabel: string;
  managedIn: MembershipManagedIn | null;
  renewalLine: string | null;
};
