"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/data/types";
import type { Dict } from "@/lib/i18n";
import { updateSettingsAction, type SettingsPatch } from "./actions";
import { setPinAction } from "../lock-actions";
import { backupNowAction } from "./data-actions";
import { showSignInCodeAction } from "./device-code-actions";
import { Button, buttonClass } from "@/components/ui/button";
import { PushSettings } from "./push-settings";
import { browserClient } from "@/lib/data/clients/browser";

interface Props {
  profile: Profile;
  t: Dict;
  duskUnlocked: boolean;
  transcriptionAvailable: boolean;
  aiAvailable: boolean;
  pushConfigured: boolean;
  vapidPublicKey: string;
  defaultRange: { from: string; to: string };
}

const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["Asia/Dubai", "UTC", "Europe/London", "America/New_York"];
  }
})();

export function SettingsForm(props: Props) {
  const { t, duskUnlocked, transcriptionAvailable, aiAvailable, defaultRange } = props;
  const s = t.settings;
  const router = useRouter();
  const [p, setP] = useState(props.profile);
  const [note, setNote] = useState<string | null>(null);
  const [, start] = useTransition();
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const [range, setRange] = useState(defaultRange);

  function save(patch: SettingsPatch, local: Partial<Profile>, refresh = false) {
    setP((cur) => ({ ...cur, ...local }));
    start(async () => {
      try {
        await updateSettingsAction(patch);
        setNote(s.saved);
        if (refresh) router.refresh();
      } catch {
        setNote(t.common.errorShort);
      }
    });
  }

  return (
    <div className="space-y-8">
      <p role="status" aria-live="polite" className="sr-only">
        {note}
      </p>

      <Section title={s.profile}>
        <Field label={s.displayName} htmlFor="display_name">
          <input
            id="display_name"
            defaultValue={p.displayName}
            dir="auto"
            maxLength={60}
            onBlur={(e) =>
              save({ display_name: e.target.value.trim() }, { displayName: e.target.value.trim() })
            }
            className={inputClass}
          />
        </Field>
        <Field label={s.timezone} htmlFor="timezone">
          <select
            id="timezone"
            value={p.timezone}
            onChange={(e) => save({ timezone: e.target.value }, { timezone: e.target.value }, true)}
            className={inputClass}
          >
            {TIMEZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </Field>
        <Field label={s.language} htmlFor="language">
          <select
            id="language"
            value={p.language}
            onChange={(e) => {
              const language = e.target.value as "en" | "ar";
              save({ language }, { language }, true);
            }}
            className={inputClass}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </Field>
      </Section>

      <Section title={s.appearance} id="appearance">
        <Choice
          legend={s.theme}
          value={p.theme}
          options={[
            ["system", s.themeSystem],
            ["light", s.themeLight],
            ["dark", s.themeDark],
          ]}
          onChange={(v) => {
            document.documentElement.dataset.theme = v;
            save({ theme: v as Profile["theme"] }, { theme: v as Profile["theme"] });
          }}
        />
        <Choice
          legend={s.palette}
          value={p.palette}
          options={[
            ["calm", s.paletteCalm],
            ["dusk", duskUnlocked ? s.paletteDusk : `${s.paletteDusk} · ${fmtUnlock(t, 7)}`],
          ]}
          disabled={duskUnlocked ? [] : ["dusk"]}
          onChange={(v) => {
            document.documentElement.dataset.palette = v;
            save({ palette: v as "calm" | "dusk" }, { palette: v });
          }}
        />
        <Field label={`${s.fontSize}: ${p.fontSize}px`} htmlFor="font_size">
          <input
            id="font_size"
            type="range"
            min={14}
            max={28}
            value={p.fontSize}
            onChange={(e) => {
              const v = Number(e.target.value);
              document.documentElement.style.setProperty("--entry-size", `${v}px`);
              setP((cur) => ({ ...cur, fontSize: v }));
            }}
            onPointerUp={(e) =>
              save({ font_size: Number((e.target as HTMLInputElement).value) }, {})
            }
            onKeyUp={(e) => save({ font_size: Number((e.target as HTMLInputElement).value) }, {})}
            className="h-11 w-full accent-[var(--accent)]"
          />
          <p className="entry-prose mt-2" dir="auto">
            {p.language === "ar"
              ? "هكذا سيبدو نص تدويناتك."
              : "This is how your entries will look."}
          </p>
        </Field>
      </Section>

      <Section title={s.habit}>
        <Toggle
          label={s.showStreak}
          checked={p.showStreak}
          onChange={(v) => save({ show_streak: v }, { showStreak: v })}
        />
        <Toggle
          label={s.showPrompts}
          checked={p.showPrompts}
          onChange={(v) => save({ show_prompts: v }, { showPrompts: v })}
        />
        <Toggle
          label={s.bodyCheck}
          checked={p.bodyCheckEnabled}
          onChange={(v) => save({ body_check_enabled: v }, { bodyCheckEnabled: v })}
        />
        <Choice
          legend={s.emotionDepth}
          hint={s.depthHint}
          value={String(p.emotionDepthUnlocked)}
          options={[
            ["1", s.depth1],
            ["2", s.depth2],
            ["3", s.depth3],
          ]}
          onChange={(v) =>
            save({ emotion_depth_unlocked: Number(v) }, { emotionDepthUnlocked: Number(v) })
          }
        />
      </Section>

      <Section title={s.reminders}>
        <PushSettings
          t={t}
          configured={props.pushConfigured}
          vapidPublicKey={props.vapidPublicKey}
        />
        <Toggle
          label={s.remindersOn}
          checked={p.remindersEnabled}
          onChange={(v) => save({ reminders_enabled: v }, { remindersEnabled: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={s.reminderTime} htmlFor="reminder_time">
            <input
              id="reminder_time"
              type="time"
              value={p.reminderTime}
              onChange={(e) =>
                save({ reminder_time: e.target.value }, { reminderTime: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label={s.reminderAnchor} htmlFor="reminder_anchor">
            <input
              id="reminder_anchor"
              defaultValue={p.reminderAnchor}
              placeholder={s.reminderAnchorPlaceholder}
              dir="auto"
              maxLength={60}
              onBlur={(e) =>
                save(
                  { reminder_anchor: e.target.value.trim() },
                  { reminderAnchor: e.target.value.trim() },
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
        <Toggle
          label={s.nudge}
          checked={p.nudgeEnabled}
          onChange={(v) => save({ nudge_enabled: v }, { nudgeEnabled: v })}
        />
        <Field label={s.nudgeTime} htmlFor="nudge_time">
          <input
            id="nudge_time"
            type="time"
            value={p.nudgeTime}
            onChange={(e) => save({ nudge_time: e.target.value }, { nudgeTime: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Toggle
          label={s.morningReminder}
          checked={p.morningReminderEnabled}
          onChange={(v) => save({ morning_reminder_enabled: v }, { morningReminderEnabled: v })}
        />
        <Field label={s.morningTime} htmlFor="morning_time">
          <input
            id="morning_time"
            type="time"
            value={p.morningReminderTime}
            onChange={(e) =>
              save(
                { morning_reminder_time: e.target.value },
                { morningReminderTime: e.target.value },
              )
            }
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title={s.privacy}>
        <div className="space-y-2">
          <label htmlFor="pin" className="block text-sm font-medium">
            {s.pinLabel}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={pin}
              dir="ltr"
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className={`${inputClass} w-40 tracking-[0.4em]`}
            />
            <Button
              variant="secondary"
              onClick={async () => {
                if (!/^\d{4,6}$/.test(pin)) return setPinMsg(s.pinInvalid);
                const r = await setPinAction(pin);
                setPinMsg(r.ok ? s.pinSaved : s.pinInvalid);
                if (r.ok) {
                  setPin("");
                  setP((c) => ({ ...c, hasPin: true }));
                }
              }}
            >
              {p.hasPin ? s.pinChange : s.pinSet}
            </Button>
            {p.hasPin && (
              <Button
                variant="ghost"
                onClick={async () => {
                  await setPinAction(null);
                  setP((c) => ({ ...c, hasPin: false }));
                  setPinMsg(s.pinRemoved);
                }}
              >
                {s.pinRemove}
              </Button>
            )}
          </div>
          {pinMsg && (
            <p role="status" className="text-muted text-sm">
              {pinMsg}
            </p>
          )}
        </div>
        <Field label={s.lockAfter} htmlFor="lock_timeout">
          <input
            id="lock_timeout"
            type="number"
            min={1}
            max={240}
            defaultValue={p.lockTimeoutMinutes}
            onBlur={(e) => {
              const v = Math.min(240, Math.max(1, Number(e.target.value) || 5));
              save({ lock_timeout_minutes: v }, { lockTimeoutMinutes: v });
            }}
            className={`${inputClass} w-28`}
          />
        </Field>
        <DeviceCode t={t} />
        <PasskeyButton t={t} />
        <form
          action="/auth/signout"
          method="post"
          onSubmit={() => navigator.serviceWorker?.controller?.postMessage("clear-cache")}
        >
          <button type="submit" className={buttonClass("danger", "md")}>
            {s.signOut}
          </button>
        </form>
      </Section>

      <Section title={s.features}>
        <Toggle
          label={s.transcription}
          hint={
            transcriptionAvailable
              ? s.transcriptionHint
              : `${s.transcriptionHint} ${s.transcriptionUnavailable}`
          }
          checked={p.transcriptionEnabled}
          disabled={!transcriptionAvailable}
          onChange={(v) => save({ transcription_enabled: v }, { transcriptionEnabled: v })}
        />
        <Toggle
          label={s.aiReflection}
          hint={aiAvailable ? s.aiReflectionHint : `${s.aiReflectionHint} ${s.aiUnavailable}`}
          checked={p.aiReflectionEnabled}
          disabled={!aiAvailable}
          onChange={(v) => save({ ai_reflection_enabled: v }, { aiReflectionEnabled: v })}
        />
      </Section>

      <Section title={s.data} id="data">
        <div className="flex flex-wrap gap-2">
          <a href="/api/export/markdown" className={buttonClass("secondary", "md")}>
            {s.exportMarkdown}
          </a>
          <a href="/api/export/json" className={buttonClass("secondary", "md")}>
            {s.exportJson}
          </a>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={s.from} htmlFor="pdf_from">
            <input
              id="pdf_from"
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <Field label={s.to} htmlFor="pdf_to">
            <input
              id="pdf_to"
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className={inputClass}
            />
          </Field>
          <a
            href={`/print?from=${range.from}&to=${range.to}`}
            className={buttonClass("secondary", "md")}
          >
            {s.exportPdf}
          </a>
        </div>
        <p className="text-muted text-sm">{s.backups}</p>
        <BackupButton t={t} />
      </Section>
    </div>
  );
}

function fmtUnlock(t: Dict, n: number) {
  return t.rewards.unlockedAt.replace("{n}", String(n));
}

const inputClass =
  "block min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base";

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${title}-h`}
      className="border-border bg-surface space-y-4 rounded-2xl border p-5"
    >
      <h2 id={`${title}-h`} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block">{label}</span>
        {hint && <span className="text-muted mt-0.5 block text-sm">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-6 shrink-0 accent-[var(--accent)]"
      />
    </label>
  );
}

function Choice({
  legend,
  hint,
  value,
  options,
  onChange,
  disabled = [],
}: {
  legend: string;
  hint?: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  disabled?: string[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      {hint && <p className="text-muted mt-0.5 text-sm">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label
            key={v}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${
              value === v ? "border-accent bg-accent-soft font-medium" : "border-border"
            } ${disabled.includes(v) ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              className="sr-only"
              name={legend}
              value={v}
              checked={value === v}
              disabled={disabled.includes(v)}
              onChange={() => onChange(v)}
            />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function DeviceCode({ t }: { t: Dict }) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t.settings.deviceCode}</p>
      <p className="text-muted text-sm">{t.settings.deviceCodeHint}</p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setCode(await showSignInCodeAction());
          setBusy(false);
        }}
      >
        {t.settings.deviceCodeShow}
      </Button>
      {code && (
        <div className="bg-surface-2 rounded-xl p-4" aria-live="polite">
          <p
            className="text-center font-mono text-2xl tracking-[0.2em]"
            dir="ltr"
            data-testid="device-code"
          >
            {code}
          </p>
          <p className="text-muted mt-2 text-sm">{t.settings.deviceCodeValid}</p>
        </div>
      )}
    </div>
  );
}

function PasskeyButton({ t }: { t: Dict }) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="secondary"
        onClick={async () => {
          const { error } = await browserClient().auth.registerPasskey();
          setMsg(error ? t.common.errorShort : t.settings.passkeyAdded);
        }}
      >
        {t.settings.addPasskey}
      </Button>
      {msg && (
        <p role="status" className="text-muted mt-2 text-sm">
          {msg}
        </p>
      )}
    </div>
  );
}

function BackupButton({ t }: { t: Dict }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await backupNowAction();
          setBusy(false);
          setMsg(r.ok ? t.settings.backupDone : t.common.errorShort);
        }}
      >
        {busy ? t.common.saving : t.settings.backupNow}
      </Button>
      {msg && (
        <p role="status" className="text-muted mt-2 text-sm">
          {msg}
        </p>
      )}
    </div>
  );
}
