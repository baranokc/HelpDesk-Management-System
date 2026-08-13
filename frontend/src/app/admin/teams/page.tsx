"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Users, Crown, Plus, Pencil, Trash2, 
  RotateCw, Search, X, UserPlus 
} from "lucide-react";
import { Alert } from "@/src/components/ui/Alert";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { ConfirmModal } from "@/src/components/ui/ConfirmModal";
import { getApiErrorMessage } from "@/src/lib/api";
import { teamService } from "@/src/services/teamService";
import type { TeamDto, CreateTeamDto, EligibleAgentDto } from "@/src/types/team";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [eligibleAgents, setEligibleAgents] = useState<EligibleAgentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamDto | null>(null);
  const [formData, setFormData] = useState<CreateTeamDto>({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  // Silme Modalı için State'ler
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamDto | null>(null);
  const [selectedAgentToAdd, setSelectedAgentToAdd] = useState("");
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  const [isViewMembersModalOpen, setIsViewMembersModalOpen] = useState(false);
  const [viewTeamDetails, setViewTeamDetails] = useState<TeamDto | null>(null);
  const [viewMembersLoading, setViewMembersLoading] = useState(false);

  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [leaderModalTeam, setLeaderModalTeam] = useState<TeamDto | null>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [leaderActionLoading, setLeaderActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsData, agentsData] = await Promise.all([
        teamService.getAllTeams(),
        teamService.getEligibleAgents(),
      ]);
      setTeams(teamsData);
      setEligibleAgents(agentsData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load team data."));
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    await loadData();

    const detailRequests: Promise<void>[] = [];

    if (isMembersModalOpen && selectedTeamDetails?.id) {
      detailRequests.push(
        teamService.getTeamById(selectedTeamDetails.id).then((details) => {
          setSelectedTeamDetails(details);
        }),
      );
    }

    if (isViewMembersModalOpen && viewTeamDetails?.id) {
      detailRequests.push(
        teamService.getTeamById(viewTeamDetails.id).then((details) => {
          setViewTeamDetails(details);
        }),
      );
    }

    if (isLeaderModalOpen && leaderModalTeam?.id) {
      detailRequests.push(
        teamService.getTeamById(leaderModalTeam.id).then((details) => {
          setLeaderModalTeam(details);
          setSelectedLeaderId(details.leadId || "");
        }),
      );
    }

    try {
      await Promise.all(detailRequests);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to refresh team details."));
    }
  };

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(initialLoadTimer);
  }, []);

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (team: TeamDto) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateTeamDto = {
        name: formData.name,
        description: formData.description || undefined,
      };

      if (editingTeam) {
        await teamService.updateTeam(editingTeam.id, payload);
      } else {
        await teamService.createTeam(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save team."));
    } finally {
      setSubmitting(false);
    }
  };

  // Silme Modalını Tetikleme
  const openDeleteModal = (id: string, name: string) => {
    setTeamToDelete({ id, name });
  };

  // Onaylandığında Silme İşlemini Gerçekleştirme
  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    setDeletingTeam(true);
    setError(null);
    try {
      await teamService.deleteTeam(teamToDelete.id);
      setTeams((prev) => prev.filter((t) => t.id !== teamToDelete.id));
      setTeamToDelete(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete team."));
    } finally {
      setDeletingTeam(false);
    }
  };

  const openViewMembersModal = async (teamId: string) => {
    setViewMembersLoading(true);
    setIsViewMembersModalOpen(true);
    try {
      const details = await teamService.getTeamById(teamId);
      setViewTeamDetails(details);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load team members."));
    } finally {
      setViewMembersLoading(false);
    }
  };

  const openMembersModal = async (teamId: string) => {
    setMemberActionLoading(true);
    setIsMembersModalOpen(true);
    setSelectedAgentToAdd("");
    try {
      const details = await teamService.getTeamById(teamId);
      setSelectedTeamDetails(details);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load team members."));
    } finally {
      setMemberActionLoading(false);
    }
  };

  const openLeaderModal = async (team: TeamDto) => {
    setLeaderActionLoading(true);
    setIsLeaderModalOpen(true);
    try {
      const details = await teamService.getTeamById(team.id);
      setLeaderModalTeam(details);
      setSelectedLeaderId(details.leadId || "");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load team leader details."));
    } finally {
      setLeaderActionLoading(false);
    }
  };

  const handleSaveLeader = async () => {
    if (!leaderModalTeam) return;
    setLeaderActionLoading(true);
    try {
      await teamService.setTeamLead(leaderModalTeam.id, selectedLeaderId || null);
      setIsLeaderModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update team leader."));
    } finally {
      setLeaderActionLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeamDetails || !selectedAgentToAdd) return;
    setMemberActionLoading(true);
    try {
      await teamService.addMember(selectedTeamDetails.id, selectedAgentToAdd);
      setSelectedAgentToAdd("");
      const updated = await teamService.getTeamById(selectedTeamDetails.id);
      setSelectedTeamDetails(updated);
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to add member to team."));
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeamDetails) return;
    setMemberActionLoading(true);
    try {
      await teamService.removeMember(selectedTeamDetails.id, userId);
      const updated = await teamService.getTeamById(selectedTeamDetails.id);
      setSelectedTeamDetails(updated);
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to remove member from team."));
    } finally {
      setMemberActionLoading(false);
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (t.description || "").toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (t.leadName || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [teams, searchTerm]);

  const availableAgentsForSelectedTeam = useMemo(() => {
    if (!selectedTeamDetails || !selectedTeamDetails.agents) return eligibleAgents;
    const currentMemberIds = new Set(
      selectedTeamDetails.agents.map((m) => (m.id || "").toLowerCase())
    );
    return eligibleAgents.filter(
      (agent) => agent.id && !currentMemberIds.has(agent.id.toLowerCase())
    );
  }, [eligibleAgents, selectedTeamDetails]);

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* ÜST BİLGİ VE AKSİYONLAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
            Team Management
          </h1>
          <p className="mt-1 text-xs font-medium text-stone-500 dark:text-slate-400">
            Create support teams, assign team leads, and manage support agents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refreshAllData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300/80 dark:border-purple-900/40 bg-stone-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-stone-800 dark:text-slate-200 shadow-sm transition-all hover:bg-stone-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600 dark:text-pink-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Team</span>
          </button>
        </div>
      </div>

      {/* ARAMA BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-stone-200/80 dark:border-purple-900/40 shadow-xl backdrop-blur-2xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by team, description or leader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-300/80 dark:border-slate-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 text-xs pl-9 pr-3 py-2 font-medium focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-slate-500" />
        </div>
        <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
          Total Teams: <b className="text-stone-800 dark:text-slate-200">{filteredTeams.length}</b>
        </span>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* TABLO */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/80 overflow-hidden shadow-xl backdrop-blur-2xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner label="Loading teams from database..." />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center text-stone-500 dark:text-slate-400">
            {teams.length === 0 ? "No teams created yet." : "No teams match your search."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed min-w-[750px]">
              <thead className="bg-stone-50/80 dark:bg-slate-800/50 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 border-b border-stone-100 dark:border-slate-800">
                <tr>
                  {/* 🌟 SÜTUN GENİŞLİKLERİ FERAH KILINDI */}
                  <th className="px-5 py-3.5 w-[22%]">Team Name</th>
                  <th className="px-5 py-3.5 w-[22%]">Team Leader</th>
                  <th className="px-5 py-3.5 w-[28%]">Description</th>
                  <th className="px-5 py-3.5 w-[13%]">Members</th>
                  <th className="px-5 py-3.5 w-[15%] text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-medium">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-stone-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-stone-900 dark:text-white truncate">
                      {team.name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => void openLeaderModal(team)}
                        className="group inline-flex items-center cursor-pointer focus:outline-none"
                        title="Click to change Team Leader"
                      >
                        {team.leadName ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/80 dark:shadow-[0_0_12px_rgba(245,158,11,0.35)] px-3 py-1 text-xs font-bold group-hover:scale-105 transition-all">
                            <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 dark:drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                            <span className="truncate">{team.leadName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                            <Crown className="h-3.5 w-3.5 opacity-40" />
                            + Assign Leader
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-stone-500 dark:text-slate-400 text-xs truncate">
                      {team.description || "-"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => void openViewMembersModal(team.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 px-3 py-1 text-xs font-bold hover:scale-105 transition-all cursor-pointer"
                        title="Click to view team members"
                      >
                        <Users className="h-3.5 w-3.5 text-teal-700 dark:text-purple-400" />
                        {team.memberCount || 0} agents
                      </button>
                    </td>
                    {/* 🌟 ACTIONS ALANI FERAHLAŞTIRILDI (pl-6 ve gap-2 eklendi) */}
                    <td className="pl-6 pr-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => void openMembersModal(team.id)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-teal-600 dark:hover:text-purple-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Manage Members (Add / Remove)"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(team)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-emerald-600 dark:hover:text-purple-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Team"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(team.id, team.name)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Team"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SİLME ONAY MODALI */}
      <ConfirmModal
        open={!!teamToDelete}
        title="Delete Team"
        description={`Are you sure you want to delete "${teamToDelete?.name || ""}" team? This action cannot be undone.`}
        confirmText="Yes, Delete Team"
        cancelText="Cancel"
        variant="danger"
        loading={deletingTeam}
        onClose={() => setTeamToDelete(null)}
        onConfirm={() => void handleConfirmDeleteTeam()}
      />

      {/* DÜZENLEME / OLUŞTURMA MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-purple-900/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl transition-all relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                {editingTeam ? "Edit Team" : "Create New Team"}
              </h3>
              <p className="text-xs font-medium text-stone-400 dark:text-slate-400 mt-1">
                {editingTeam ? "Update team name and description." : "Add a new support team."}
              </p>
            </div>

            <form onSubmit={(e) => void handleFormSubmit(e)} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Level 1 Support, Billing, IT Infra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of team responsibilities..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 p-3 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingTeam ? "Update Team" : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LİDER SEÇME MODALI */}
      {isLeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-purple-900/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl transition-all relative">
            <button
              onClick={() => setIsLeaderModalOpen(false)}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500 dark:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Select Team Leader
              </h3>
              <p className="text-xs font-medium text-stone-400 dark:text-slate-400 mt-1">
                Team: <b className="text-stone-800 dark:text-slate-200">{leaderModalTeam?.name}</b>
              </p>
            </div>

            {leaderActionLoading && !leaderModalTeam ? (
              <div className="p-4 flex justify-center">
                <LoadingSpinner label="Loading agents..." />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1">
                    Choose Leader (Support Agents in this Team)
                  </label>
                  <select
                    value={selectedLeaderId}
                    onChange={(e) => setSelectedLeaderId(e.target.value)}
                    className="w-full rounded-xl border border-stone-300/80 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-bold text-stone-900 dark:text-white px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">No Leader Assigned</option>
                    {leaderModalTeam?.agents?.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullName} ({agent.email})
                      </option>
                    ))}
                  </select>
                  {(!leaderModalTeam?.agents || leaderModalTeam.agents.length === 0) && (
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-2">
                      Please add Support Agents to this team first to select a leader.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsLeaderModalOpen(false)}
                    className="rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveLeader()}
                    disabled={leaderActionLoading}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {leaderActionLoading ? "Saving..." : "Save Leader"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÜYELERİ GÖRÜNTÜLEME MODALI */}
      {isViewMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-purple-900/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl transition-all relative">
            <button
              onClick={() => setIsViewMembersModalOpen(false)}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                Team Members
              </h3>
              <p className="text-xs font-medium text-stone-400 dark:text-slate-400 mt-1">
                Team: <b className="text-stone-800 dark:text-slate-200">{viewTeamDetails?.name}</b>
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {viewMembersLoading && !viewTeamDetails ? (
                <div className="p-4 flex justify-center">
                  <LoadingSpinner label="Loading members..." />
                </div>
              ) : viewTeamDetails?.agents?.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-stone-500 dark:text-slate-400">
                  No support agents assigned to this team yet.
                </div>
              ) : (
                viewTeamDetails?.agents?.map((agent) => {
                  const isLead =
                    viewTeamDetails.leadId &&
                    agent.id &&
                    viewTeamDetails.leadId.toLowerCase() === agent.id.toLowerCase();
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border border-stone-100 dark:border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            {agent.fullName}
                          </span>
                          {isLead && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.35)] px-2 py-0.5 rounded-full">
                              <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Leader
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400 block mt-0.5">
                          {agent.email}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-slate-800">
              <button
                onClick={() => setIsViewMembersModalOpen(false)}
                className="rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÜYE YÖNETİMİ MODALI (EKLE / ÇIKAR) */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-purple-900/40 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl transition-all relative">
            <button
              onClick={() => setIsMembersModalOpen(false)}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                Manage Team Members
              </h3>
              <p className="text-xs font-medium text-stone-400 dark:text-slate-400 mt-1">
                Team: <b className="text-stone-800 dark:text-slate-200">{selectedTeamDetails?.name}</b>
              </p>
            </div>

            <div className="flex gap-2.5 bg-stone-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-stone-200/80 dark:border-slate-700/80">
              <select
                value={selectedAgentToAdd}
                onChange={(e) => setSelectedAgentToAdd(e.target.value)}
                className="flex-1 rounded-xl border border-stone-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-stone-900 dark:text-white px-3 py-2 focus:outline-none focus:border-emerald-600 dark:focus:border-purple-500 cursor-pointer"
              >
                <option value="">
                  {availableAgentsForSelectedTeam.length === 0
                    ? "No available Support Agents to add"
                    : "Select Support Agent to Add..."}
                </option>
                {availableAgentsForSelectedTeam.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullName} ({agent.email})
                  </option>
                ))}
              </select>
              <button
                onClick={() => void handleAddMember()}
                disabled={!selectedAgentToAdd || memberActionLoading}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-purple-600 dark:to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 dark:shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                +
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {memberActionLoading && !selectedTeamDetails ? (
                <div className="p-4 flex justify-center">
                  <LoadingSpinner label="Loading agents..." />
                </div>
              ) : selectedTeamDetails?.agents?.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-stone-500 dark:text-slate-400">
                  No support agents assigned to this team yet.
                </div>
              ) : (
                selectedTeamDetails?.agents?.map((agent) => {
                  const isLead =
                    selectedTeamDetails.leadId &&
                    agent.id &&
                    selectedTeamDetails.leadId.toLowerCase() === agent.id.toLowerCase();
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 bg-stone-50 dark:bg-slate-800/50 rounded-2xl border border-stone-100 dark:border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            {agent.fullName}
                          </span>
                          {isLead && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.35)] px-2 py-0.5 rounded-full">
                              <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Leader
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400 block mt-0.5">
                          {agent.email}
                        </span>
                      </div>
                      <button
                        onClick={() => void handleRemoveMember(agent.id)}
                        disabled={memberActionLoading}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-30"
                        title="Remove from Team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-slate-800">
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="rounded-xl border border-stone-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}