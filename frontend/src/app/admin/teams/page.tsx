"use client";

import { useEffect, useState, useMemo } from "react";
import { Alert } from "@/src/components/ui/Alert";
import { Card } from "@/src/components/ui/Card";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/src/lib/api";
import { teamService } from "@/src/services/teamService";
import type { TeamDto, CreateTeamDto } from "@/src/types/team";

// SVG Ikon Bileşenleri
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

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamDto | null>(null);
  const [formData, setFormData] = useState<CreateTeamDto>({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.getAllTeams();
      setTeams(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load teams."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
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
      if (editingTeam) {
        await teamService.updateTeam(editingTeam.id, formData);
      } else {
        await teamService.createTeam(formData);
      }
      setIsModalOpen(false);
      await loadTeams();
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

  const filteredTeams = useMemo(() => {
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (t.description || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [teams, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Aksiyonlar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Team Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create support teams and assign agents to route incoming tickets efficiently.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadTeams()}
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

      {/* Arama Barı */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search teams by name or description..."
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

      {/* Ekip Listesi Tablosu */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner label="Loading teams from database..." />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {teams.length === 0 ? "No teams created yet." : "No teams found matching search criteria."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-600 dark:text-slate-400">
                <tr>
                  <th>Team Name</th>
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
                    <td className="text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {team.description || "-"}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {team.memberCount || 0} agents
                      </span>
                    </td>
                    <td className="text-right space-x-2">
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

      {/* Ekip Ekle / Düzenle Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
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
              {editingTeam ? "Update existing team details." : "Add a new support team to the system."}
            </p>

            <form onSubmit={(e) => void handleFormSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Level 1 Support, Billing, DevOps"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-sm input-bordered w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief explanation of team responsibilities..."
                  value={formData.description}
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
    </div>
  );
}