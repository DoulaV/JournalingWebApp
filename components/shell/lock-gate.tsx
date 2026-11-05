import { isUnlocked } from "@/lib/pin";
import type { Dict } from "@/lib/i18n";
import { LockScreen, ActivityWatcher } from "./lock-screen";

/** Server-enforced lock: without a valid unlock cookie, journal content is never rendered. */
export async function LockGate({
  hasPin,
  timeoutMinutes,
  t,
  children,
}: {
  hasPin: boolean;
  timeoutMinutes: number;
  t: Dict["lock"];
  children: React.ReactNode;
}) {
  if (!hasPin) return <>{children}</>;
  if (!(await isUnlocked())) return <LockScreen t={t} />;
  return (
    <>
      <ActivityWatcher timeoutMinutes={timeoutMinutes} />
      {children}
    </>
  );
}
