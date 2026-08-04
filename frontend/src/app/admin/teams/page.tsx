"use client";

import { useEffect, useState, useMemo } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/src/lib/api";
import { teamService } from "@/src/services/teamService";
import type { TeamDto, CreateTeamDto, EligibleAgentDto } from "@/src/types/team";

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CrownIcon = () => (
  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [eligibleAgents, setEligibleAgents] = useState<EligibleAgentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamDto | null>(null);
  const [formData, setFormData] = useState<CreateTeamDto>({ name: "", description: "", leadId: "" });
  const [submitting, setSubmitting] = useState(false);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamDto | null>(null);
  const [selectedAgentToAdd, setSelectedAgentToAdd] = useState("");
  const [memberActionLoading, setMemberActionLoading] = useState(false);

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

  useEffect(() => {
    void loadData();
  }, []);

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({ name: "", description: "", leadId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (team: TeamDto) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      leadId: team.leadId || "",
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
        leadId: formData.leadId || undefined,
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

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" team?`)) return;

    setError(null);
    try {
      await teamService.deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete team."));
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Team Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create support teams, assign team leads, and manage support agents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadData()}
            className="btn btn-sm btn-ghost border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="btn btn-sm btn-primary flex items-center gap-2 text-white"
          >
            <PlusIcon />
            <span>New Team</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by team, description or leader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs pl-8 focus:outline-none focus:border-blue-500"
          />
          <span className="absolute left-2.5 top-2.5">
            <SearchIcon />
          </span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total Teams: <b>{filteredTeams.length}</b>
        </span>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner label="Loading teams from database..." />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {teams.length === 0 ? "No teams created yet." : "No teams match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-600 dark:text-slate-400">
                <tr>
                  <th>Team Name</th>
                  <th>Team Leader</th>
                  <th>Description</th>
                  <th>Members</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="font-semibold text-slate-900 dark:text-white">
                      {team.name}
                    </td>
                    <td>
                      {team.leadName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <CrownIcon />
                          {team.leadName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {team.description || "-"}
                    </td>
                    <td>
                      <button
                        onClick={() => void openMembersModal(team.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                      >
                        <UsersIcon />
                        {team.memberCount || 0} agents
                      </button>
                    </td>
                    <td className="text-right space-x-1">
                      <button
                        onClick={() => void openMembersModal(team.id)}
                        className="btn btn-xs btn-ghost text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Manage Members"
                      >
                        <UsersIcon />
                      </button>
                      <button
                        onClick={() => openEditModal(team)}
                        className="btn btn-xs btn-ghost text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit Team"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => void handleDeleteTeam(team.id, team.name)}
                        className="btn btn-xs btn-ghost text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete Team"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <CloseIcon />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingTeam ? "Edit Team" : "Create New Team"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {editingTeam ? "Update team settings and leadership." : "Add a new support team and assign a leader."}
            </p>

            <form onSubmit={(e) => void handleFormSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Level 1 Support, Billing, IT Infra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-sm input-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Team Leader
                </label>
                <select
                  value={formData.leadId || ""}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  className="select select-sm select-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                >
                  <option value="">No Leader Assigned</option>
                  {eligibleAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of team responsibilities..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm btn-ghost border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-sm btn-primary text-white"
                >
                  {submitting ? "Saving..." : editingTeam ? "Update Team" : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-xl relative">
            <button
              onClick={() => setIsMembersModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <CloseIcon />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Manage Team Members
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Team: <b className="text-slate-800 dark:text-slate-200">{selectedTeamDetails?.name}</b>
            </p>

            <div className="flex gap-2 mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <select
                value={selectedAgentToAdd}
                onChange={(e) => setSelectedAgentToAdd(e.target.value)}
                className="select select-sm select-bordered flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
              >
                <option value="">
                  {availableAgentsForSelectedTeam.length === 0
                    ? "No available agents to add"
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
                className="btn btn-sm btn-primary text-white text-xs"
              >
                Add Member
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {memberActionLoading && !selectedTeamDetails ? (
                <div className="p-4 flex justify-center">
                  <LoadingSpinner label="Loading agents..." />
                </div>
              ) : selectedTeamDetails?.agents?.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  No agents assigned to this team yet.
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
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {agent.fullName}
                          </span>
                          {isLead && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-400 px-1.5 py-0.5 rounded">
                              <CrownIcon /> Leader
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {agent.email}
                        </span>
                      </div>
                      <button
                        onClick={() => void handleRemoveMember(agent.id)}
                        disabled={memberActionLoading}
                        className="btn btn-xs btn-ghost text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        title="Remove from Team"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="btn btn-sm btn-ghost border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
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