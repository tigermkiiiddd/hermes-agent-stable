import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  Pencil,
  Settings2,
  Terminal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import spinners from "unicode-animations";
import { H2 } from "@/components/NouiTypography";
import { api } from "@/lib/api";
import type {
  ProfileInfo,
  ProfileSettings,
  ProfileSkillEntry,
} from "@/lib/api";

function normalizeProfileSettings(raw: ProfileSettings): ProfileSettings {
  const assigned = raw.skills_assigned ?? raw.skills ?? [];
  const available = raw.skills_available ?? [];
  return {
    ...raw,
    skills_assigned: assigned,
    skills_available: available,
    skills: assigned,
  };
}
import { ModelPickerDialog } from "@/components/ModelPickerDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { Toast } from "@/components/Toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@nous-research/ui/ui/components/checkbox";
import { Switch } from "@nous-research/ui/ui/components/switch";
import { useI18n } from "@/i18n";
import { usePageHeader } from "@/contexts/usePageHeader";
import { cn, themedBody } from "@/lib/utils";

// Mirrors hermes_cli/profiles.py::_PROFILE_ID_RE so we can reject obviously
// invalid names (uppercase, spaces, …) before round-tripping a doomed POST.
const PROFILE_NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/** Braille unicode spinner (`unicode-animations`); static first frame when reduced motion is preferred. */
function ProfilesLoadingSpinner() {
  const { frames, interval } = spinners.braille;
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(
      () => setFrameIndex((i) => (i + 1) % frames.length),
      interval,
    );
    return () => window.clearInterval(id);
  }, [frames.length, interval]);

  return (
    <span
      aria-hidden
      className="inline-block select-none font-mono text-xl leading-none text-muted-foreground"
    >
      {frames[frameIndex]}
    </span>
  );
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();
  const { t } = useI18n();
  const { setEnd } = usePageHeader();

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [cloneFromDefault, setCloneFromDefault] = useState(true);
  const [creating, setCreating] = useState(false);
  const closeCreateModal = useCallback(() => setCreateModalOpen(false), []);
  const createModalRef = useModalBehavior({
    open: createModalOpen,
    onClose: closeCreateModal,
  });

  // Inline rename state
  const [renamingFrom, setRenamingFrom] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState("");

  // Inline SOUL editor state
  const [editingSoulFor, setEditingSoulFor] = useState<string | null>(null);
  const [soulText, setSoulText] = useState("");
  const [soulSaving, setSoulSaving] = useState(false);
  // Tracks the latest SOUL request so out-of-order responses don't overwrite
  // newer state when the user switches profiles or closes the editor.
  const activeSoulRequest = useRef<string | null>(null);

  const [configuringFor, setConfiguringFor] = useState<string | null>(null);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings | null>(
    null,
  );
  const [profileSettingsMeta, setProfileSettingsMeta] = useState<{
    hadAvailableField: boolean;
  } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [modelPickerFor, setModelPickerFor] = useState<string | null>(null);
  const [togglingSkills, setTogglingSkills] = useState<Set<string>>(new Set());
  const activeSettingsRequest = useRef<string | null>(null);

  const load = useCallback(() => {
    api
      .getProfiles()
      .then((res) => setProfiles(res.profiles))
      .catch((e) => showToast(`${t.status.error}: ${e}`, "error"))
      .finally(() => setLoading(false));
  }, [showToast, t.status.error]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      showToast(t.profiles.nameRequired, "error");
      return;
    }
    if (!PROFILE_NAME_RE.test(name)) {
      showToast(`${t.profiles.invalidName}: ${t.profiles.nameRule}`, "error");
      return;
    }
    setCreating(true);
    try {
      await api.createProfile({ name, clone_from_default: cloneFromDefault });
      showToast(`${t.profiles.created}: ${name}`, "success");
      setNewName("");
      setCreateModalOpen(false);
      load();
    } catch (e) {
      showToast(`${t.status.error}: ${e}`, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (!renamingFrom) return;
    const target = renameTo.trim();
    if (!target || target === renamingFrom) {
      setRenamingFrom(null);
      setRenameTo("");
      return;
    }
    if (!PROFILE_NAME_RE.test(target)) {
      showToast(`${t.profiles.invalidName}: ${t.profiles.nameRule}`, "error");
      return;
    }
    try {
      await api.renameProfile(renamingFrom, target);
      showToast(
        `${t.profiles.renamed}: ${renamingFrom} → ${target}`,
        "success",
      );
      setRenamingFrom(null);
      setRenameTo("");
      load();
    } catch (e) {
      showToast(`${t.status.error}: ${e}`, "error");
    }
  };

  const loadProfileSettings = useCallback(
    async (name: string) => {
      activeSettingsRequest.current = name;
      setSettingsLoading(true);
      setProfileSettings(null);
      setProfileSettingsMeta(null);
      try {
        const raw = await api.getProfileSettings(name);
        const settings = normalizeProfileSettings(raw);
        if (activeSettingsRequest.current === name) {
          setProfileSettings(settings);
          setProfileSettingsMeta({
            hadAvailableField: "skills_available" in raw,
          });
        }
      } catch (e) {
        if (activeSettingsRequest.current === name) {
          showToast(`${t.status.error}: ${e}`, "error");
        }
      } finally {
        if (activeSettingsRequest.current === name) {
          setSettingsLoading(false);
        }
      }
    },
    [showToast, t.status.error],
  );

  const openConfigure = useCallback(
    async (name: string) => {
      if (configuringFor === name) {
        activeSettingsRequest.current = null;
        setConfiguringFor(null);
        setProfileSettings(null);
        setProfileSettingsMeta(null);
        return;
      }
      setConfiguringFor(name);
      setEditingSoulFor(null);
      await loadProfileSettings(name);
    },
    [configuringFor, loadProfileSettings],
  );

  const handleToggleProfileSkill = async (
    profileName: string,
    skill: ProfileSkillEntry,
  ) => {
    setTogglingSkills((prev) => new Set(prev).add(skill.name));
    try {
      await api.toggleProfileSkill(profileName, skill.name, !skill.enabled);
      setProfileSettings((prev) => {
        if (!prev) return prev;
        const mapAssigned = (list: ProfileSkillEntry[]) =>
          list.map((s) =>
            s.name === skill.name ? { ...s, enabled: !s.enabled } : s,
          );
        return {
          ...prev,
          skills_assigned: mapAssigned(prev.skills_assigned),
          skills: mapAssigned(prev.skills_assigned),
        };
      });
      load();
    } catch (e) {
      showToast(`${t.status.error}: ${e}`, "error");
    } finally {
      setTogglingSkills((prev) => {
        const next = new Set(prev);
        next.delete(skill.name);
        return next;
      });
    }
  };

  const handleAddProfileSkill = async (
    profileName: string,
    skill: ProfileSkillEntry,
  ) => {
    setTogglingSkills((prev) => new Set(prev).add(`add:${skill.name}`));
    try {
      await api.addProfileSkill(profileName, skill.name);
      showToast(`${t.profiles.skillAdded}: ${skill.name}`, "success");
      await loadProfileSettings(profileName);
      load();
    } catch (e) {
      showToast(`${t.status.error}: ${e}`, "error");
    } finally {
      setTogglingSkills((prev) => {
        const next = new Set(prev);
        next.delete(`add:${skill.name}`);
        return next;
      });
    }
  };

  const handleRemoveProfileSkill = async (
    profileName: string,
    skill: ProfileSkillEntry,
  ) => {
    setTogglingSkills((prev) => new Set(prev).add(`remove:${skill.name}`));
    try {
      await api.removeProfileSkill(profileName, skill.name);
      showToast(`${t.profiles.skillRemoved}: ${skill.name}`, "success");
      await loadProfileSettings(profileName);
      load();
    } catch (e) {
      showToast(`${t.status.error}: ${e}`, "error");
    } finally {
      setTogglingSkills((prev) => {
        const next = new Set(prev);
        next.delete(`remove:${skill.name}`);
        return next;
      });
    }
  };

  const openSoulEditor = useCallback(
    async (name: string) => {
      if (editingSoulFor === name) {
        activeSoulRequest.current = null;
        setEditingSoulFor(null);
        return;
      }
      activeSettingsRequest.current = null;
      setConfiguringFor(null);
      setProfileSettings(null);
      setEditingSoulFor(name);
      setSoulText("");
      activeSoulRequest.current = name;
      try {
        const soul = await api.getProfileSoul(name);
        if (activeSoulRequest.current === name) {
          setSoulText(soul.content);
        }
      } catch (e) {
        if (activeSoulRequest.current === name) {
          showToast(`${t.status.error}: ${e}`, "error");
        }
      }
    },
    [editingSoulFor, showToast, t.status.error],
  );

  const handleSaveSoul = async (name: string) => {
    setSoulSaving(true);
    try {
      await api.updateProfileSoul(name, soulText);
      showToast(`${t.profiles.soulSaved}: ${name}`, "success");
    } catch (e) {
      showToast(`${t.status.error}: ${e}`, "error");
    } finally {
      setSoulSaving(false);
    }
  };

  const handleCopyTerminalCommand = async (name: string) => {
    let cmd: string;
    try {
      const res = await api.getProfileSetupCommand(name);
      cmd = res.command;
    } catch (e) {
      showToast(`${t.status.error}: ${e}`, "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(cmd);
      showToast(`${t.profiles.commandCopied}: ${cmd}`, "success");
    } catch {
      showToast(`${t.profiles.copyFailed}: ${cmd}`, "error");
    }
  };

  const profileDelete = useConfirmDelete<string>({
    onDelete: useCallback(
      async (name: string) => {
        try {
          await api.deleteProfile(name);
          showToast(`${t.profiles.deleted}: ${name}`, "success");
          load();
        } catch (e) {
          showToast(`${t.status.error}: ${e}`, "error");
          throw e;
        }
      },
      [load, showToast, t.profiles.deleted, t.status.error],
    ),
  });

  const pendingName = profileDelete.pendingId;

  // Put "Create" button in page header
  useLayoutEffect(() => {
    setEnd(
      <Button
        className="uppercase"
        size="sm"
        onClick={() => setCreateModalOpen(true)}
      >
        {t.common.create}
      </Button>,
    );
    return () => {
      setEnd(null);
    };
  }, [setEnd, t.common.create, loading]);

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className="flex items-center justify-center py-24"
      >
        <span className="sr-only">{t.common.loading}</span>

        <ProfilesLoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Toast toast={toast} />

      <DeleteConfirmDialog
        open={profileDelete.isOpen}
        onCancel={profileDelete.cancel}
        onConfirm={profileDelete.confirm}
        title={t.profiles.confirmDeleteTitle}
        description={
          pendingName
            ? t.profiles.confirmDeleteMessage.replace("{name}", pendingName)
            : t.profiles.confirmDeleteMessage
        }
        loading={profileDelete.isDeleting}
      />

      {/* Create profile modal */}
      {createModalOpen && (
        <div
          ref={createModalRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setCreateModalOpen(false)
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-profile-title"
        >
          <div className={cn(themedBody, "relative w-full max-w-md border border-border bg-card shadow-2xl flex flex-col")}>
            <Button
              ghost
              size="icon"
              onClick={() => setCreateModalOpen(false)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              aria-label={t.common.close}
            >
              <X />
            </Button>

            <header className="p-5 pb-3 border-b border-border">
              <h2
                id="create-profile-title"
                className="font-mondwest text-display text-base tracking-wider"
              >
                {t.profiles.newProfile}
              </h2>
            </header>

            <div className="p-5 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="profile-name">{t.profiles.name}</Label>
                <Input
                  id="profile-name"
                  autoFocus
                  placeholder={t.profiles.namePlaceholder}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  aria-invalid={
                    newName.trim() !== "" &&
                    !PROFILE_NAME_RE.test(newName.trim())
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t.profiles.nameRule}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={cloneFromDefault}
                  id="clone-from-default"
                  onCheckedChange={(checked) =>
                    setCloneFromDefault(checked === true)
                  }
                />

                <Label
                  className="font-mondwest normal-case tracking-normal text-sm cursor-pointer"
                  htmlFor="clone-from-default"
                >
                  {t.profiles.cloneFromDefault}
                </Label>
              </div>

              <div className="flex justify-end">
                <Button
                  className="uppercase"
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? t.common.creating : t.common.create}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        <H2
          variant="sm"
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Users className="h-4 w-4" />
          {t.profiles.allProfiles} ({profiles.length})
        </H2>

        {profiles.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t.profiles.noProfiles}
            </CardContent>
          </Card>
        )}

        {profiles.map((p) => {
          const isRenaming = renamingFrom === p.name;
          const isEditingSoul = editingSoulFor === p.name;
          const isConfiguring = configuringFor === p.name;
          const settings =
            isConfiguring && profileSettings ? profileSettings : null;
          const assignedSkills = settings?.skills_assigned ?? [];
          const availableSkills = settings?.skills_available ?? [];
          const sharedSkillLibrary =
            settings?.profile_uses_shared_library ?? p.is_default;
          const libraryEmptyHint = settingsLoading
            ? null
            : sharedSkillLibrary
              ? t.profiles.skillsLibrarySharedDefault
              : availableSkills.length === 0
                ? profileSettingsMeta?.hadAvailableField
                  ? t.profiles.skillsLibraryAllAdded
                  : t.profiles.skillsLibraryUnavailable
                : null;
          const enabledSkillCount =
            assignedSkills.filter((s) => s.enabled).length ?? 0;
          return (
            <Card key={p.name}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {isRenaming ? (
                      <Input
                        autoFocus
                        value={renameTo}
                        onChange={(e) => setRenameTo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit();
                          if (e.key === "Escape") setRenamingFrom(null);
                        }}
                        aria-invalid={
                          renameTo.trim() !== "" &&
                          renameTo.trim() !== p.name &&
                          !PROFILE_NAME_RE.test(renameTo.trim())
                        }
                        className="max-w-xs"
                      />
                    ) : (
                      <span className="font-medium text-sm truncate">
                        {p.name}
                      </span>
                    )}
                    {p.is_default && (
                      <Badge tone="secondary">{t.profiles.defaultBadge}</Badge>
                    )}
                    {p.has_env && (
                      <Badge tone="outline">{t.profiles.hasEnv}</Badge>
                    )}
                  </div>
                  {isRenaming &&
                    (() => {
                      const trimmed = renameTo.trim();
                      const invalid =
                        trimmed !== "" &&
                        trimmed !== p.name &&
                        !PROFILE_NAME_RE.test(trimmed);
                      return (
                        <p
                          className={
                            "text-xs mb-1 " +
                            (invalid
                              ? "text-destructive"
                              : "text-muted-foreground")
                          }
                        >
                          {invalid
                            ? `${t.profiles.invalidName}: ${t.profiles.nameRule}`
                            : t.profiles.nameRule}
                        </p>
                      );
                    })()}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {p.model && (
                      <span>
                        {t.profiles.model}: {p.model}
                        {p.provider ? ` (${p.provider})` : ""}
                      </span>
                    )}
                    <span>
                      {t.profiles.skills}: {p.skill_count}
                    </span>
                    <span className="font-mono truncate max-w-[28rem]">
                      {p.path}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isRenaming ? (
                    <>
                      <Button size="sm" onClick={handleRenameSubmit}>
                        {t.common.save}
                      </Button>
                      <Button
                        size="sm"
                        ghost
                        onClick={() => setRenamingFrom(null)}
                      >
                        {t.common.cancel}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        ghost
                        size="icon"
                        title={t.profiles.configure}
                        aria-label={t.profiles.configure}
                        aria-expanded={isConfiguring}
                        onClick={() => openConfigure(p.name)}
                      >
                        {isConfiguring ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <Settings2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        ghost
                        size="icon"
                        title={t.profiles.editSoul}
                        aria-label={t.profiles.editSoul}
                        onClick={() => openSoulEditor(p.name)}
                      >
                        {isEditingSoul ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <span aria-hidden className="text-xs font-bold">
                            S
                          </span>
                        )}
                      </Button>
                      <Button
                        ghost
                        size="icon"
                        title={t.profiles.openInTerminal}
                        aria-label={t.profiles.openInTerminal}
                        onClick={() => handleCopyTerminalCommand(p.name)}
                      >
                        <Terminal className="h-4 w-4" />
                      </Button>
                      {!p.is_default && (
                        <Button
                          ghost
                          size="icon"
                          title={t.profiles.rename}
                          aria-label={t.profiles.rename}
                          onClick={() => {
                            setRenamingFrom(p.name);
                            setRenameTo(p.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {!p.is_default && (
                        <Button
                          ghost
                          size="icon"
                          title={t.common.delete}
                          aria-label={t.common.delete}
                          onClick={() => profileDelete.requestDelete(p.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>

              {isConfiguring && (
                <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground">
                    {t.profiles.configureTitle}
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t.profiles.model}
                        {settings?.provider
                          ? ` · ${t.profiles.provider}: ${settings.provider}`
                          : ""}
                      </p>
                      <p className="text-sm font-mono truncate">
                        {settingsLoading
                          ? t.common.loading
                          : settings?.model || t.profiles.noModelSet}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="uppercase shrink-0"
                      disabled={settingsLoading}
                      onClick={() => setModelPickerFor(p.name)}
                    >
                      {t.profiles.changeModel}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">
                        {t.profiles.skills}
                      </Label>
                      {assignedSkills.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {t.profiles.skillsEnabled
                            .replace("{enabled}", String(enabledSkillCount))
                            .replace(
                              "{total}",
                              String(assignedSkills.length),
                            )}
                        </span>
                      )}
                    </div>
                    {settingsLoading ? (
                      <p className="text-xs text-muted-foreground">
                        {t.common.loading}
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t.profiles.skillsOnProfile}
                          </p>
                          {assignedSkills.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto border border-border divide-y divide-border">
                              {assignedSkills.map((skill) => (
                                <div
                                  key={skill.name}
                                  className="flex items-center gap-2 px-3 py-2"
                                >
                                  <Switch
                                    checked={!!skill.enabled}
                                    disabled={
                                      togglingSkills.has(skill.name) ||
                                      togglingSkills.has(`remove:${skill.name}`)
                                    }
                                    onCheckedChange={() =>
                                      handleToggleProfileSkill(p.name, skill)
                                    }
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {skill.name}
                                    </p>
                                  </div>
                                  <Button
                                    ghost
                                    size="sm"
                                    className="h-7 text-xs uppercase shrink-0"
                                    disabled={togglingSkills.has(
                                      `remove:${skill.name}`,
                                    )}
                                    onClick={() =>
                                      handleRemoveProfileSkill(p.name, skill)
                                    }
                                  >
                                    {t.profiles.removeSkill}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {t.profiles.noSkillsInstalled}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t.profiles.skillsInLibrary}
                          </p>
                          {libraryEmptyHint ? (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {libraryEmptyHint}
                            </p>
                          ) : (
                            <div className="max-h-40 overflow-y-auto border border-border divide-y divide-border">
                              {availableSkills.map((skill) => (
                                <div
                                  key={skill.name}
                                  className="flex items-center gap-2 px-3 py-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {skill.name}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs uppercase shrink-0"
                                    disabled={togglingSkills.has(
                                      `add:${skill.name}`,
                                    )}
                                    onClick={() =>
                                      handleAddProfileSkill(p.name, skill)
                                    }
                                  >
                                    {t.profiles.addSkill}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {isEditingSoul && (
                <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-2">
                  <Label
                    htmlFor={`soul-editor-${p.name}`}
                    className="flex items-center gap-2 font-mondwest text-display text-xs tracking-wider text-muted-foreground"
                  >
                    {t.profiles.soulSection}
                  </Label>
                  <textarea
                    id={`soul-editor-${p.name}`}
                    className="flex min-h-[180px] w-full border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder={t.profiles.soulPlaceholder}
                    value={soulText}
                    onChange={(e) => setSoulText(e.target.value)}
                  />
                  <div>
                    <Button
                      size="sm"
                      className="uppercase"
                      onClick={() => handleSaveSoul(p.name)}
                      disabled={soulSaving}
                    >
                      {soulSaving ? t.common.saving : t.common.save}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {modelPickerFor && (
        <ModelPickerDialog
          loader={api.getModelOptions}
          alwaysGlobal
          title={t.profiles.changeModel}
          onApply={async ({ provider, model }) => {
            await api.setProfileModel(modelPickerFor, provider, model);
            showToast(t.profiles.modelSaved, "success");
            setModelPickerFor(null);
            await loadProfileSettings(modelPickerFor);
            load();
          }}
          onClose={() => setModelPickerFor(null)}
        />
      )}
    </div>
  );
}
