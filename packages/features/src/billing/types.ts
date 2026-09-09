export type MembershipManagedIn = "web" | "play_store" | "app_store" | "test_store" | "other";

export type MembershipPlan = "monthly" | "yearly";

export type MembershipVM = {
  active: boolean;
  statusLabel: string;
  managedIn: MembershipManagedIn | null;
  plan: MembershipPlan | null;
  renewalLine: string | null;
};

export type MemberBenefit = {
  title: string;
  body: string;
  soon?: boolean;
};
